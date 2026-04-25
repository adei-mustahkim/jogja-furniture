/**
 * server.js — Jogja Furniture Enterprise API v2
 * Production-ready with security hardening
 */

'use strict';

require('dotenv').config();

// ── Startup Environment Validation ────────────────────────────
// DB_PASSWORD dikecualikan karena boleh kosong (MySQL tanpa password di lokal)
const REQUIRED_ENV = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error('❌ Missing required environment variables:', missingEnv.join(', '));
  console.error('   Copy .env.example → .env and fill in all values.');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET terlalu pendek. Minimal 32 karakter (disarankan 64+).');
  process.exit(1);
}

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const fs         = require('fs');

const app = express();

// ── Ensure upload directories ──────────────────────────────────
['products', 'services', 'categories', 'settings', 'banners'].forEach((dir) => {
  const p = path.join(__dirname, 'uploads', dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// ── Security Headers (Helmet) ──────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow static uploads
    contentSecurityPolicy: false, // managed separately if needed
  })
);

// ── Trust proxy (for correct IP behind nginx/load balancer) ───
app.set('trust proxy', 1);

// ── CORS ───────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In development, allow all localhost origins
      if (
        process.env.NODE_ENV !== 'production' &&
        (origin.includes('localhost') || origin.includes('127.0.0.1'))
      ) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin tidak diizinkan — ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Global Rate Limiter ────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak request. Coba lagi dalam 15 menit.' },
});
app.use('/api', globalLimiter);

// ── Login Rate Limiter (strict) ────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Akun sementara dikunci 15 menit.',
  },
});

// ── Body parsers ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static files ───────────────────────────────────────────────
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), { maxAge: '7d', etag: true })
);
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// ── API Routes ─────────────────────────────────────────────────
app.use('/api', require('./routes/public'));
app.use('/api/admin', require('./routes/admin')(loginLimiter));

// ── Health check ───────────────────────────────────────────────
const db = require('./config/database');
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      success: true,
      message: 'Jogja Furniture Enterprise API v2',
      version: '2.0.0',
      db: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: 'Database tidak tersedia',
      db: 'error',
    });
  }
});

// ── SPA Fallbacks ──────────────────────────────────────────────
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  }
});

// ── Global Error Handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  // Log full error internally
  console.error(`[${new Date().toISOString()}] ❌ ${req.method} ${req.path}:`, err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Ukuran file terlalu besar (maks 5MB)' });
  }
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  if (err.message && err.message.includes('Hanya file gambar')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Terjadi kesalahan pada server. Silakan coba lagi.'
        : err.message,
  });
});

// ── Start Server ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server    : http://localhost:${PORT}`);
  console.log(`📦 API       : http://localhost:${PORT}/api`);
  console.log(`🔧 Admin     : http://localhost:${PORT}/admin`);
  console.log(`🌐 Frontend  : http://localhost:${PORT}`);
  console.log(`🛡  Mode      : ${process.env.NODE_ENV || 'development'}\n`);
});

// ── Graceful Shutdown ──────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await db.end();
      console.log('✅ Database pool closed.');
    } catch (e) {
      // ignore
    }
    console.log('✅ Server closed.');
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown fails
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions — log and exit cleanly
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

module.exports = app;

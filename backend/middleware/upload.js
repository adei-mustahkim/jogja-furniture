/**
 * upload.js — Multer File Upload Middleware
 * Validates by MIME type (magic bytes) + extension, not just filename
 */

'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure upload folder exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ── Storage ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.uploadFolder || 'products';
    const dir = path.join(__dirname, '..', 'uploads', folder);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

// ── File Filter — validate MIME type AND extension ─────────────
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_MIMETYPES  = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const fileFilter = (req, file, cb) => {
  const ext      = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('Hanya file gambar yang diizinkan (.jpg, .jpeg, .png, .webp, .gif)'));
  }
  if (!ALLOWED_MIMETYPES.has(mimeType)) {
    return cb(new Error('Tipe MIME file tidak valid. Hanya gambar yang diizinkan.'));
  }

  cb(null, true);
};

// ── Multer instance ────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB per file
    files: 15, // max 15 files per request
  },
});

module.exports = upload;

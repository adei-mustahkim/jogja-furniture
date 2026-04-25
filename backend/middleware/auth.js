/**
 * auth.js — JWT Authentication Middleware
 * Verifies token AND checks user is still active in DB
 */

'use strict';

const jwt = require('jsonwebtoken');
const db  = require('../config/database');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan. Silakan login.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── Check user still exists and is active in DB ────────────
    // This catches: deactivated accounts, deleted accounts
    const [rows] = await db.query(
      'SELECT id, username, role, is_active FROM admin_users WHERE id = ?',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Akun tidak ditemukan. Silakan login ulang.' });
    }

    if (!rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi administrator.' });
    }

    // Attach fresh data from DB (not just token payload)
    req.admin = {
      id:       rows[0].id,
      username: rows[0].username,
      role:     rows[0].role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Sesi telah berakhir. Silakan login ulang.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token tidak valid. Silakan login ulang.' });
    }
    // DB error or other
    console.error('[auth middleware]', err.message);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan autentikasi.' });
  }
};

module.exports = authMiddleware;

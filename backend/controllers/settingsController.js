/**
 * settingsController.js — Site Settings Management
 * Fixed: public endpoint only returns safe keys, safe error messages
 */

'use strict';

const db   = require('../config/database');
const path = require('path');
const fs   = require('fs');

// Keys safe to expose publicly (whitelist approach)
const PUBLIC_KEYS = new Set([
  'site_name', 'site_tagline', 'site_desc', 'site_logo',
  'whatsapp_number', 'whatsapp_message', 'phone', 'email', 'address',
  'maps_embed', 'hero_label', 'hero_title_1', 'hero_title_accent',
  'hero_desc', 'hero_btn_primary', 'hero_btn_secondary', 'hero_bg_image',
  'stat_projects', 'stat_years', 'stat_satisfaction', 'stat_craftsmen',
  'about_title', 'about_desc', 'about_years', 'about_image_main', 'about_image_sec',
  'footer_desc', 'jam_operasional', 'marquee_items',
  'instagram_url', 'facebook_url', 'youtube_url',
]);

// ── GET settings (public) — only whitelisted keys ──────────────
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT `key`, value FROM settings WHERE `key` IN (?)',
      [[...PUBLIC_KEYS]]
    );
    const settings = {};
    rows.forEach((r) => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('[settings.getAll]', err);
    res.status(500).json({ success: false, message: 'Gagal memuat settings.' });
  }
};

// ── GET settings by group (public) — only whitelisted keys ─────
exports.getByGroup = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT `key`, value, type, label FROM settings WHERE group_name = ? AND `key` IN (?)',
      [req.params.group, [...PUBLIC_KEYS]]
    );
    const settings = {};
    rows.forEach((r) => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error('[settings.getByGroup]', err);
    res.status(500).json({ success: false, message: 'Gagal memuat settings.' });
  }
};

// ── GET all settings with detail (admin) ──────────────────────
exports.getAllAdmin = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM settings ORDER BY group_name, id');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[settings.getAllAdmin]', err);
    res.status(500).json({ success: false, message: 'Gagal memuat settings.' });
  }
};

// ── UPDATE settings (admin) — FormData + file upload ──────────
exports.update = async (req, res) => {
  try {
    const body = req.body || {};
    const imageKeys = ['hero_bg_image', 'about_image_main', 'about_image_sec', 'site_logo'];

    // Process uploaded images
    const fileUpdates = {};
    if (req.files) {
      for (const key of imageKeys) {
        if (req.files[key] && req.files[key][0]) {
          const file = req.files[key][0];
          fileUpdates[key] = file.filename;

          // Delete old file
          const [oldRows] = await db.query('SELECT value FROM settings WHERE `key` = ?', [key]);
          if (oldRows.length && oldRows[0].value) {
            const oldPath = path.join(__dirname, '..', 'uploads', 'settings', oldRows[0].value);
            if (fs.existsSync(oldPath)) {
              try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
            }
          }
        }
      }
    }

    const allUpdates = { ...body, ...fileUpdates };
    const skipKeys = ['_method'];

    for (const [key, value] of Object.entries(allUpdates)) {
      if (skipKeys.includes(key)) continue;
      if (value === undefined || value === null) continue;

      const [exists] = await db.query('SELECT id FROM settings WHERE `key` = ?', [key]);
      if (exists.length > 0) {
        await db.query('UPDATE settings SET value = ? WHERE `key` = ?', [String(value), key]);
      }
    }

    res.json({ success: true, message: 'Settings berhasil disimpan' });
  } catch (err) {
    console.error('[settings.update]', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan settings.' });
  }
};

// ── UPDATE single setting key (admin) ─────────────────────────
exports.updateOne = async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  // Validate key length
  if (!key || key.length > 100) {
    return res.status(400).json({ success: false, message: 'Key tidak valid' });
  }

  try {
    const [result] = await db.query(
      'UPDATE settings SET value = ? WHERE `key` = ?',
      [value !== undefined ? String(value) : '', key]
    );
    if (result.affectedRows === 0) {
      // Key doesn't exist — insert
      await db.query(
        'INSERT INTO settings (`key`, value, type, group_name) VALUES (?,?,?,?)',
        [key, String(value || ''), 'text', 'general']
      );
    }
    res.json({ success: true, message: 'Setting berhasil diupdate' });
  } catch (err) {
    console.error('[settings.updateOne]', err);
    res.status(500).json({ success: false, message: 'Gagal mengupdate setting.' });
  }
};

// ── UPLOAD image setting ───────────────────────────────────────
exports.uploadImage = async (req, res) => {
  const { key } = req.params;
  const allowedKeys = ['hero_bg_image', 'about_image_main', 'about_image_sec', 'site_logo'];

  if (!allowedKeys.includes(key)) {
    return res.status(400).json({ success: false, message: 'Key tidak diizinkan untuk upload gambar' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'File gambar diperlukan' });
  }

  try {
    const filename = req.file.filename;

    // Delete old file
    const [oldRows] = await db.query('SELECT value FROM settings WHERE `key` = ?', [key]);
    if (oldRows.length && oldRows[0].value) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'settings', oldRows[0].value);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
      }
    }

    const [exists] = await db.query('SELECT id FROM settings WHERE `key` = ?', [key]);
    if (exists.length > 0) {
      await db.query('UPDATE settings SET value = ? WHERE `key` = ?', [filename, key]);
    } else {
      await db.query(
        'INSERT INTO settings (`key`, value, type, group_name) VALUES (?,?,?,?)',
        [key, filename, 'image', 'general']
      );
    }

    res.json({
      success: true,
      message: 'Gambar berhasil diupload',
      filename,
      url: `/uploads/settings/${filename}`,
    });
  } catch (err) {
    console.error('[settings.uploadImage]', err);
    res.status(500).json({ success: false, message: 'Gagal upload gambar.' });
  }
};

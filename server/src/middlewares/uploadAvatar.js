'use strict';

/**
 * uploadAvatar — Multer middleware for profile picture uploads.
 *
 * Security measures:
 * - Whitelist of allowed MIME types (no SVG — XSS risk via embedded scripts)
 * - File size capped at 3 MB
 * - Filename regenerated server-side (never trust client filename)
 * - Extension derived from validated MIME type, not from client-supplied name
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME_TO_EXT[file.mimetype];
    const randomName = crypto.randomBytes(20).toString('hex');
    cb(null, `${req.user.userId}_${randomName}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TO_EXT[file.mimetype]) {
    return cb(new Error('UNSUPPORTED_FILE_TYPE'));
  }
  cb(null, true);
}

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
}).single('avatar');

module.exports = { uploadAvatar, UPLOAD_DIR, MAX_FILE_SIZE_BYTES };

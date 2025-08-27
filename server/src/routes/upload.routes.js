const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { protect } = require('../middleware/auth');

const router = express.Router();

const uploadRoot = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadRoot);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const name = `${base}-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Invalid file type'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/image', protect, upload.single('file'), (req, res) => {
  const relPath = `/uploads/${req.file.filename}`;
  return res.json({ url: relPath });
});

module.exports = router; 
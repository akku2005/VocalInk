const express = require('express');
const router = express.Router();
const { 
  upload, 
  uploadAvatar, 
  uploadCoverImage, 
  removeAvatar, 
  removeCoverImage,
  uploadGenericImage,
} = require('../controllers/imageController');
const { protect } = require('../middleware/auth');

// All image routes require authentication
router.use(protect);

// Avatar routes
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/avatar', removeAvatar);

// Cover image routes
router.post('/cover', upload.single('coverImage'), uploadCoverImage);
router.delete('/cover', removeCoverImage);

// Generic content image upload (Cloudinary)
router.post('/upload', upload.single('file'), uploadGenericImage);

module.exports = router;

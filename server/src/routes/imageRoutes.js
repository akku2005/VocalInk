const express = require('express');
const router = express.Router();
const { 
  upload, 
  uploadAvatar, 
  uploadCoverImage, 
  removeAvatar, 
  removeCoverImage 
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

module.exports = router;

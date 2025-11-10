const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validators');
const {
  createSeriesSchema,
  updateSeriesSchema,
  addEpisodeSchema,
  updateEpisodeSchema,
  addCollaboratorSchema,
  updateProgressSchema,
  addBookmarkSchema,
  seriesQuerySchema,
  analyticsQuerySchema,
  subscriptionSchema,
  recommendationQuerySchema
} = require('../validations/seriesSchema');

const seriesController = require('./series.controller');
const seriesImageController = require('./seriesImageController');

// Series Management Routes
router.get('/', optionalAuth, validate(seriesQuerySchema, 'query'), seriesController.getSeries);
router.get('/trending', optionalAuth, seriesController.getTrendingSeries);
router.get('/recommendations', optionalAuth, validate(recommendationQuerySchema, 'query'), seriesController.getRecommendations);
router.get('/:id', optionalAuth, seriesController.getSeriesById);

// Protected routes - require authentication
router.post('/', protect, validate(createSeriesSchema), seriesController.createSeries);
router.put('/:id', protect, validate(updateSeriesSchema), seriesController.updateSeries);
router.delete('/:id', protect, seriesController.deleteSeries);

// Episode Management Routes
router.post('/:id/episodes', protect, validate(addEpisodeSchema), seriesController.addEpisode);
router.put('/:id/episodes/:episodeId', protect, validate(updateEpisodeSchema), seriesController.updateEpisode);
router.delete('/:id/episodes/:episodeId', protect, seriesController.removeEpisode);

// Collaboration Management Routes
router.post('/:id/collaborators', protect, validate(addCollaboratorSchema), seriesController.addCollaborator);
router.delete('/:id/collaborators/:userId', protect, seriesController.removeCollaborator);

// Progress Tracking Routes
router.post('/:id/progress', protect, validate(updateProgressSchema), seriesController.updateProgress);
router.get('/:id/progress', protect, seriesController.getUserProgress);
router.get('/:id/progress/:userId', protect, seriesController.getUserProgress);

// Bookmark Management Routes
router.post('/:id/bookmarks', protect, validate(addBookmarkSchema), seriesController.addBookmark);
router.delete('/:id/bookmarks/:episodeId', protect, seriesController.removeBookmark);

// Analytics Routes
router.get('/:id/analytics', protect, validate(analyticsQuerySchema, 'query'), seriesController.getSeriesAnalytics);

// Image Upload Routes
router.post('/:seriesId/images/cover', protect, seriesImageController.upload.single('coverImage'), seriesImageController.uploadCoverImage);
router.post('/:seriesId/images/banner', protect, seriesImageController.upload.single('bannerImage'), seriesImageController.uploadBannerImage);
router.delete('/:seriesId/images/cover', protect, seriesImageController.deleteCoverImage);

module.exports = router;

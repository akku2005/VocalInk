const express = require('express');

const router = express.Router();
const { protect } = require('../middleware/auth');

const seriesController = require('./series.controller');

router.get('/', seriesController.getSeries);
router.get('/:id', seriesController.getSeriesById);
router.post('/', protect, seriesController.createSeries);
router.post('/:id/add-blog', protect, seriesController.addBlogToSeries);

module.exports = router;

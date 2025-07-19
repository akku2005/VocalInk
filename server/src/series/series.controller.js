const Series = require('../models/series.model');

exports.createSeries = async (req, res) => {
  try {
    const series = new Series({ ...req.body, authorId: req.user.id });
    await series.save();
    res.status(201).json(series);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSeries = async (req, res) => {
  try {
    const seriesList = await Series.find().populate('authorId', 'name');
    res.json(seriesList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSeriesById = async (req, res) => {
  try {
    const series = await Series.findById(req.params.id).populate('authorId', 'name').populate('blogs');
    if (!series) return res.status(404).json({ message: 'Series not found' });
    res.json(series);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addBlogToSeries = async (req, res) => {
  try {
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ message: 'Series not found' });
    series.blogs.push(req.body.blogId);
    await series.save();
    res.json(series);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 
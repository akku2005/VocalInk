const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Series', seriesSchema);

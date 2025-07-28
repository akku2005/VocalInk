const Comment = require('../models/comment.model');

exports.addComment = async (req, res) => {
  try {
    const comment = new Comment({ ...req.body, userId: req.user.id });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      blogId: req.params.id,
      status: 'active',
    }).populate('userId', 'name');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.replyToComment = async (req, res) => {
  try {
    const parent = await Comment.findById(req.params.id);
    if (!parent)
      return res.status(404).json({ message: 'Parent comment not found' });
    const reply = new Comment({
      ...req.body,
      userId: req.user.id,
      parentId: req.params.id,
      blogId: parent.blogId,
    });
    await reply.save();
    res.status(201).json(reply);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reportComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { status: 'reported' },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.json({ message: 'Comment reported', comment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Request = require('../models/friendRequest');
const User = require('../models/user');
const send = asyncHandler(async (req, res) => {
  const recipient = req.params.userId;
  if (!mongoose.isValidObjectId(recipient) || recipient === req.user.id) return res.status(400).json({ message: 'Invalid recipient' });
  const [sender, target] = await Promise.all([User.findById(req.user.id), User.findById(recipient)]);
  if (!target) return res.status(404).json({ message: 'User not found' });
  if (sender.friends.some(id => String(id) === recipient)) return res.status(409).json({ message: 'Already friends' });
  const pair = [req.user.id, recipient].sort().join(':');
  try {
    const request = await Request.findOneAndUpdate({ pair, status: { $ne: 'pending' } },
      { $set: { sender: req.user.id, recipient, status: 'pending' } }, { upsert: true, new: true, runValidators: true });
    res.status(201).json(request);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A request is already pending' });
    throw err;
  }
});
const list = asyncHandler(async (req, res) => {
  res.json(await Request.find({ status: 'pending', $or: [{ sender: req.user.id }, { recipient: req.user.id }] })
    .populate('sender recipient', 'firstName lastName picturePath').sort({ createdAt: -1 }));
});
const decide = asyncHandler(async (req, res) => {
  if (!['accept', 'reject'].includes(req.body.action)) return res.status(400).json({ message: 'Choose accept or reject' });
  const session = await mongoose.startSession();
  let updatedUser;
  try {
    await session.withTransaction(async () => {
      const request = await Request.findOneAndUpdate({ _id: req.params.requestId, recipient: req.user.id, status: 'pending' },
        { $set: { status: req.body.action === 'accept' ? 'accepted' : 'rejected' } }, { new: true, session });
      if (!request) { const error = new Error('Pending request not found'); error.status = 404; throw error; }
      if (req.body.action === 'accept') {
        if (!await User.exists({ _id: request.sender }).session(session)) throw new Error('Sender no longer exists');
        await User.updateOne({ _id: request.sender }, { $addToSet: { friends: String(request.recipient) } }, { session });
        await User.updateOne({ _id: request.recipient }, { $addToSet: { friends: String(request.sender) } }, { session });
      }
      updatedUser = await User.findById(req.user.id).select('-password').session(session);
    });
    res.json({ user: updatedUser });
  } catch (error) {
    res.status(error.status || 500);
    throw error;
  } finally { await session.endSession(); }
});
module.exports = { send, list, decide };

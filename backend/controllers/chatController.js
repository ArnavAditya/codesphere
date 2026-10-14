const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Chat = require("../models/chat");
const User = require("../models/user");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  try {
    if (userId === req.user.id || !mongoose.isValidObjectId(userId)) return res.status(400).json({ message: 'Choose another user' });
    if (!await User.exists({ _id: userId })) return res.status(404).json({ message: 'User not found' });
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const loggedUserObjectId = new mongoose.Types.ObjectId(req.user.id);

    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: loggedUserObjectId } } },
        { users: { $elemMatch: { $eq: userObjectId } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");

    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "firstName lastName picturePath",
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      const chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [loggedUserObjectId, userObjectId],
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(fullChat);
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {
  try {
    await Chat.find({ users: { $elemMatch: { $eq: req.user.id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "firstName lastName picturePath",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the fields" });
  }

  const loggedUser = await User.findById(req.user.id);

  if (!Array.isArray(req.body.users)) return res.status(400).json({ message: "Users must be an array" });
  var users = [...new Set(req.body.users.map(user => String(user._id || user)))].filter(id => id !== req.user.id);
  if (users.some(id => !mongoose.isValidObjectId(id)) || await User.countDocuments({ _id: { $in: users } }) !== users.length) return res.status(400).json({ message: "Invalid group members" });

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  users.push(loggedUser);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: loggedUser,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  if (!await Chat.exists({ _id: chatId, isGroupChat: true, groupAdmin: req.user.id })) {
    return res.status(403).json({ message: "Only the group admin can change this group" });
  }
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  if (!await Chat.exists({ _id: chatId, isGroupChat: true, groupAdmin: req.user.id })) {
    return res.status(403).json({ message: "Only the group admin can change this group" });
  }
  if (String(userId) === req.user.id) return res.status(400).json({ message: "The admin cannot remove themselves" });
  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  if (!await Chat.exists({ _id: chatId, isGroupChat: true, groupAdmin: req.user.id })) {
    return res.status(403).json({ message: "Only the group admin can change this group" });
  }
  if (!await User.exists({ _id: userId })) return res.status(404).json({ message: "User not found" });
  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $addToSet: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};

const asyncHandler = require("express-async-handler");
const Message = require("../models/message");
const User = require("../models/user");
const Chat = require("../models/chat");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    if (!await Chat.exists({ _id: req.params.chatId, users: req.user.id })) return res.status(403).json({ message: "Chat access denied" });
    const messages = await Message.find({ chat: req.params.chatId })
      .populate({
        path: "sender",
        select: "firstName lastName", // Select the fields you want to populate
      })
      .populate("chat");
    
    console.log(messages);
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});
//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (typeof content !== "string" || !content.trim() || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  try {
    if (!await Chat.exists({ _id: chatId, users: req.user.id })) return res.status(403).json({ message: "Chat access denied" });
    const newMessage = {
      sender: req.user.id,
      content: content,
      chat: chatId,
    };

    let message = await Message.create(newMessage);

    // Populate the sender's name using the user model
    message = await message.populate("sender", "firstName lastName")

    // Optionally, populate other fields like the chat
    message = await message.populate("chat")

    // Update the latestMessage field in the Chat model
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    const io = req.app.get('io');
    message.chat.users.forEach(id => {
      if (String(id) !== req.user.id) io?.to(String(id)).emit('message received', message);
    });
    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage };

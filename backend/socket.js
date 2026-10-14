module.exports = function configureSockets(io) {
  const jwt = require('jsonwebtoken');
  const User = require('./models/user');
  const Chat = require('./models/chat');
  io.use(async (socket, next) => {
    try {
      const decoded = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      if (!await User.exists({ _id: decoded.id })) throw new Error('User not found');
      socket.userId = String(decoded.id);
      next();
    } catch {
      next(new Error('Authentication required'));
    }
  });
  io.on('connection', socket => {
    socket.join(socket.userId);
    socket.emit('connected');
    for (const event of ['typing', 'stop typing']) {
      socket.on(event, async chatId => {
        try {
          const chat = await Chat.findOne({ _id: chatId, users: socket.userId });
          if (!chat) return;
          chat.users.forEach(id => {
            if (String(id) !== socket.userId) socket.to(String(id)).emit(event, { chatId });
          });
        } catch { /* Ignore invalid room identifiers. */ }
      });
    }
  });

};

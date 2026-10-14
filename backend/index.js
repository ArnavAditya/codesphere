const express = require('express');
const app = express();
const connectDatabase = require("./dbconnect/dbconnect.js");
const dotenv = require("dotenv");
// dotenv.config({ path : "./config/config.env" });
dotenv.config();

const authRoute = require("./routes/authRoute.js");
const postRoute = require("./routes/postRoute.js");
const userRoute = require("./routes/userRoute.js");
const chatRoute = require("./routes/chatRoute.js");
const messageRoute = require("./routes/messageRoute.js");
const cors = require("cors");
const upload = require("./multer");
const cloudinary = require("./cloudinary"); 
const fs = require("fs"); 

const port = process.env.PORT || 5555;
app.use(express.json());
connectDatabase();
app.use(cors());

app.use("/api/auth",authRoute);
app.use("/api/post",postRoute);
app.use("/api/user",userRoute);
app.use("/api/chat", chatRoute);
app.use("/api/message", messageRoute);
app.use("/api/code", require("./routes/codeRoute"));


app.get("/", async (req,res ) => {
    res.send("HELLO WORLD !!! ");
})

////////////////////////////////////////////////////

const { verifyToken } = require('./middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
app.post('/upload-images', verifyToken, upload.array('image', 1), asyncHandler(async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: 'Choose an image' });
  try {
    const urls = await Promise.all(req.files.map(file => cloudinary.uploads(file.path, 'Image')));
    res.json({ message: 'Image uploaded successfully', data: urls });
  } finally {
    await Promise.all(req.files.map(file => fs.promises.unlink(file.path).catch(() => {})));
  }
}));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || (res.statusCode >= 400 ? res.statusCode : 500);
  res.status(error instanceof require('multer').MulterError ? 400 : status).json({ message: error.message });
});

const server = app.listen(
  port,
  console.log(`Server running on PORT ${port}...`)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    // credentials: true,
  },
});

app.set('io', io);
require('./socket')(io);

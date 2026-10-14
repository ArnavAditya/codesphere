const express = require("express");
const { getFeedPosts, getUserPosts, likePost , createPost,addComment,getComments } = require("../controllers/postController.js");
const { verifyToken } = require("../middleware/authMiddleware.js");

const router = express.Router();

/* READ */
router.get("/", verifyToken, getFeedPosts);
router.get("/:userId/posts", verifyToken, getUserPosts);
router.get('/:postId/comments', verifyToken, getComments);



router.post("/create", verifyToken, createPost);
router.post("/:postId/comment", verifyToken, addComment);
/* UPDATE */
router.patch("/:id/like", verifyToken, likePost);

module.exports = router;
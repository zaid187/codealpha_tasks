const express = require("express");
const {
  getPosts,
  getPostById,
  createPost,
  deletePost,
  toggleLike,
  addComment,
} = require("../controllers/postController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router.get("/", getPosts);
router.get("/:id", getPostById);
router.post("/", upload.single("image"), createPost);
router.delete("/:id", deletePost);
router.post("/:id/like", toggleLike);
router.post("/:id/comment", addComment);

module.exports = router;

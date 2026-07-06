const Post = require("../models/Post");
const Notification = require("../models/Notification");

// GET /api/posts?page=1&limit=5&user=userId
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.user) {
      filter.user = req.query.user;
    }

    const posts = await Post.find(filter)
      .populate("user", "name username profileImage")
      .populate("comments.user", "name username profileImage")
      .populate("likes", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    const postsWithMeta = posts.map((post) => ({
      ...post.toObject(),
      likeCount: post.likes.length,
      commentCount: post.comments.length,
      isLiked: post.likes.some(
        (like) => like._id?.toString() === req.user._id.toString()
      ),
      isOwner: post.user._id.toString() === req.user._id.toString(),
    }));

    res.json({
      posts: postsWithMeta,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/posts/:id
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "name username profileImage")
      .populate("comments.user", "name username profileImage")
      .populate("likes", "username");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({
      ...post.toObject(),
      likeCount: post.likes.length,
      commentCount: post.comments.length,
      isLiked: post.likes.some(
        (like) => like._id?.toString() === req.user._id.toString()
      ),
      isOwner: post.user._id.toString() === req.user._id.toString(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/posts
const createPost = async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const post = await Post.create({
      user: req.user._id,
      caption: caption || "",
      image: `/uploads/${req.file.filename}`,
    });

    const populatedPost = await Post.findById(post._id).populate(
      "user",
      "name username profileImage"
    );

    res.status(201).json({
      ...populatedPost.toObject(),
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      isOwner: true,
      comments: [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/posts/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/posts/:id/like
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("user", "username");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user._id.toString();
    const isLiked = post.likes.some((id) => id.toString() === userId);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);

      if (post.user._id.toString() !== userId) {
        await Notification.create({
          recipient: post.user._id,
          sender: req.user._id,
          type: "like",
          post: post._id,
          message: `${req.user.username} liked your post`,
        });
      }
    }

    await post.save();

    res.json({
      isLiked: !isLiked,
      likeCount: post.likes.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/posts/:id/comment
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("comments.user", "name username profileImage");

    const newComment = updatedPost.comments[updatedPost.comments.length - 1];

    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: "comment",
        post: post._id,
        message: `${req.user.username} commented on your post`,
      });
    }

    res.status(201).json({
      comment: newComment,
      commentCount: updatedPost.comments.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  deletePost,
  toggleLike,
  addComment,
};

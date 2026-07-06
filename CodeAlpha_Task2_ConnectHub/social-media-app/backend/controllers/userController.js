const User = require("../models/User");
const Post = require("../models/Post");
const FriendRequest = require("../models/FriendRequest");
const mongoose = require("mongoose");

// GET /api/users?search=query
const getUsers = async (req, res) => {
  try {
    const { search } = req.query;

    let query = {};
    if (search) {
      const regex = new RegExp(search, "i");
      const orConditions = [{ username: regex }, { name: regex }];

      if (mongoose.Types.ObjectId.isValid(search)) {
        orConditions.push({ _id: search });
      }

      query = { $or: orConditions };
    }

    const users = await User.find(query)
      .select("-password")
      .limit(20)
      .sort({ createdAt: -1 });

    const currentUser = await User.findById(req.user._id).select("following");

    const pendingRequests = await FriendRequest.find({
      $or: [
        { sender: req.user._id, status: "pending" },
        { recipient: req.user._id, status: "pending" },
      ],
    });

    const usersWithMeta = users.map((user) => {
      const sentRequest = pendingRequests.find(
        (r) =>
          r.sender.toString() === req.user._id.toString() &&
          r.recipient.toString() === user._id.toString()
      );
      const receivedRequest = pendingRequests.find(
        (r) =>
          r.sender.toString() === user._id.toString() &&
          r.recipient.toString() === req.user._id.toString()
      );

      return {
        ...user.toObject(),
        isFollowing: currentUser.following.some(
          (id) => id.toString() === user._id.toString()
        ),
        isOwnProfile: user._id.toString() === req.user._id.toString(),
        requestSent: !!sentRequest,
        requestReceived: !!receivedRequest,
        friendRequestId: receivedRequest?._id || sentRequest?._id || null,
      };
    });

    res.json(usersWithMeta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name username profileImage")
      .populate("following", "name username profileImage");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const postsCount = await Post.countDocuments({ user: user._id });

    const isFollowing = user.followers.some(
      (f) => f._id.toString() === req.user._id.toString()
    );

    const pendingSent = await FriendRequest.findOne({
      sender: req.user._id,
      recipient: user._id,
      status: "pending",
    });

    const pendingReceived = await FriendRequest.findOne({
      sender: user._id,
      recipient: req.user._id,
      status: "pending",
    });

    res.json({
      ...user.toObject(),
      postsCount,
      isFollowing,
      isOwnProfile: user._id.toString() === req.user._id.toString(),
      requestSent: !!pendingSent,
      requestReceived: !!pendingReceived,
      friendRequestId: pendingReceived?._id || pendingSent?._id || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this profile" });
    }

    const { name, username, bio } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username && username.toLowerCase() !== user.username) {
      const exists = await User.findOne({ username: username.toLowerCase() });
      if (exists) {
        return res.status(400).json({ message: "Username already taken" });
      }
      user.username = username.toLowerCase();
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profileImage: user.profileImage,
      followers: user.followers,
      following: user.following,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/:id/follow - kept for backward compat, sends friend request
const toggleFollow = async (req, res) => {
  const { sendFriendRequest, removeFriend } = require("./friendRequestController");

  try {
    const targetId = req.params.id;
    const targetUser = await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = targetUser.followers.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (isFollowing) {
      return removeFriend(req, res);
    }

    return sendFriendRequest(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/stories/list - users for stories section
const getStoriesUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate(
      "following",
      "name username profileImage"
    );

    const storyUsers = [
      {
        _id: currentUser._id,
        name: currentUser.name,
        username: currentUser.username,
        profileImage: currentUser.profileImage,
        isOwn: true,
      },
      ...currentUser.following.map((u) => ({
        _id: u._id,
        name: u.name,
        username: u.username,
        profileImage: u.profileImage,
        isOwn: false,
      })),
    ];

    res.json(storyUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  toggleFollow,
  getStoriesUsers,
};

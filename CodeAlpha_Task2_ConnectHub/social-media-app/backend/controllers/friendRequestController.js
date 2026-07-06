const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const Notification = require("../models/Notification");

// POST /api/users/:id/friend-request
const sendFriendRequest = async (req, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFriends = targetUser.followers.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (alreadyFriends) {
      return res.status(400).json({ message: "You are already friends" });
    }

    const existingRequest = await FriendRequest.findOne({
      sender: req.user._id,
      recipient: targetId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    const friendRequest = await FriendRequest.create({
      sender: req.user._id,
      recipient: targetId,
      status: "pending",
    });

    await Notification.create({
      recipient: targetId,
      sender: req.user._id,
      type: "friend_request",
      friendRequest: friendRequest._id,
      message: `${req.user.username} sent you a friend request`,
    });

    res.status(201).json({
      requestSent: true,
      message: "Friend request sent",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/friend-requests/:id/accept
const acceptFriendRequest = async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.id);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({ message: "Request already handled" });
    }

    const sender = await User.findById(friendRequest.sender);
    const recipient = await User.findById(friendRequest.recipient);

    if (!sender || !recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    if (!recipient.followers.includes(sender._id)) {
      recipient.followers.push(sender._id);
    }
    if (!sender.following.includes(recipient._id)) {
      sender.following.push(recipient._id);
    }

    await recipient.save();
    await sender.save();

    await Notification.updateMany(
      {
        friendRequest: friendRequest._id,
        type: "friend_request",
      },
      { handled: true, read: true }
    );

    await Notification.create({
      recipient: sender._id,
      sender: recipient._id,
      type: "friend_accepted",
      message: `${recipient.username} accepted your friend request`,
    });

    res.json({
      message: "Friend request accepted",
      followersCount: recipient.followers.length,
      followingCount: sender.following.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/friend-requests/:id/decline
const declineFriendRequest = async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.id);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({ message: "Request already handled" });
    }

    friendRequest.status = "declined";
    await friendRequest.save();

    await Notification.updateMany(
      {
        friendRequest: friendRequest._id,
        type: "friend_request",
      },
      { handled: true, read: true }
    );

    res.json({ message: "Friend request declined" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/users/:id/friend - remove friendship
const removeFriend = async (req, res) => {
  try {
    const targetId = req.params.id;

    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetId
    );

    await targetUser.save();
    await currentUser.save();

    res.json({
      isFollowing: false,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
};

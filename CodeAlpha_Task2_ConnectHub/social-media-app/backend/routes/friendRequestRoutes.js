const express = require("express");
const {
  acceptFriendRequest,
  declineFriendRequest,
} = require("../controllers/friendRequestController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.put("/:id/accept", acceptFriendRequest);
router.put("/:id/decline", declineFriendRequest);

module.exports = router;

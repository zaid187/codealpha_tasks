const express = require("express");
const {
  getUsers,
  getUserById,
  updateUser,
  toggleFollow,
  getStoriesUsers,
} = require("../controllers/userController");
const { removeFriend } = require("../controllers/friendRequestController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router.get("/stories/list", getStoriesUsers);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", upload.single("profileImage"), updateUser);
router.post("/:id/follow", toggleFollow);
router.delete("/:id/friend", removeFriend);

module.exports = router;

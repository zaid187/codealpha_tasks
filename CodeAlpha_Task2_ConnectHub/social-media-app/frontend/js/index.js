if (!requireAuth()) throw new Error("Auth required");

let currentPage = 1;
let hasMore = true;
let isLoading = false;

document.addEventListener("DOMContentLoaded", () => {
  setupNavbar();
  initLightbox();
  loadStories();
  loadFeed();
  setupCreatePost();
  setupNotifications();
  setupInfiniteScroll();
});

function setupCreatePost() {
  const user = getUser();
  const createPostAvatar = document.getElementById("createPostAvatar");
  if (createPostAvatar) createPostAvatar.src = getImageUrl(user.profileImage);

  const imageUploadArea = document.getElementById("imageUploadArea");
  const postImage = document.getElementById("postImage");
  const uploadPlaceholder = document.getElementById("uploadPlaceholder");
  const imagePreview = document.getElementById("imagePreview");
  const previewImg = document.getElementById("previewImg");
  const removeImage = document.getElementById("removeImage");
  const createPostForm = document.getElementById("createPostForm");

  imageUploadArea.addEventListener("click", (e) => {
    if (e.target !== removeImage && !removeImage?.contains(e.target)) {
      postImage.click();
    }
  });

  postImage.addEventListener("change", () => {
    const file = postImage.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadPlaceholder.classList.add("hidden");
      imagePreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  removeImage.addEventListener("click", (e) => {
    e.stopPropagation();
    postImage.value = "";
    previewImg.src = "";
    uploadPlaceholder.classList.remove("hidden");
    imagePreview.classList.add("hidden");
  });

  createPostForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = postImage.files[0];
    const caption = document.getElementById("postCaption").value.trim();

    if (!file) {
      showToast("Please select an image", "error");
      return;
    }

    const submitBtn = document.getElementById("postSubmitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Posting...";

    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);

    try {
      const post = await api.post("/posts", formData);
      const feedContainer = document.getElementById("feedContainer");
      const emptyFeed = document.getElementById("emptyFeed");

      feedContainer.prepend(createPostCard(post));
      emptyFeed.classList.add("hidden");

      postImage.value = "";
      previewImg.src = "";
      uploadPlaceholder.classList.remove("hidden");
      imagePreview.classList.add("hidden");
      document.getElementById("postCaption").value = "";

      showToast("Post created!", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Post";
    }
  });
}

async function loadStories() {
  try {
    const users = await api.get("/users/stories/list");
    const container = document.getElementById("storiesContainer");

    container.innerHTML = users
      .map(
        (u) => `
      <div class="story-item" data-user-id="${u._id}">
        <div class="story-ring">
          <img src="${getImageUrl(u.profileImage)}" alt="${u.username}">
        </div>
        <span>${u.isOwn ? "Your Story" : u.username}</span>
      </div>
    `
      )
      .join("");

    container.querySelectorAll(".story-item").forEach((item) => {
      item.addEventListener("click", () => {
        window.location.href = `profile.html?id=${item.dataset.userId}`;
      });
    });
  } catch {
    // Stories are non-critical
  }
}

async function loadFeed() {
  if (isLoading || !hasMore) return;
  isLoading = true;

  const feedLoader = document.getElementById("feedLoader");
  if (currentPage > 1) feedLoader.classList.remove("hidden");

  try {
    const data = await api.get(`/posts?page=${currentPage}&limit=5`);
    const feedContainer = document.getElementById("feedContainer");
    const emptyFeed = document.getElementById("emptyFeed");

    if (data.posts.length === 0 && currentPage === 1) {
      emptyFeed.classList.remove("hidden");
    } else {
      emptyFeed.classList.add("hidden");
      data.posts.forEach((post) => {
        feedContainer.appendChild(createPostCard(post));
      });
    }

    hasMore = data.hasMore;
    currentPage++;
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    isLoading = false;
    feedLoader.classList.add("hidden");
  }
}

function setupInfiniteScroll() {
  window.addEventListener("scroll", () => {
    if (
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - 300
    ) {
      loadFeed();
    }
  });
}

function setupNotifications() {
  const notificationBtn = document.getElementById("notificationBtn");
  const notificationDropdown = document.getElementById("notificationDropdown");
  const markAllRead = document.getElementById("markAllRead");

  if (!notificationBtn) return;

  loadNotificationCount();

  notificationBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    notificationDropdown.classList.toggle("hidden");

    if (!notificationDropdown.classList.contains("hidden")) {
      await loadNotifications();
    }
  });

  document.addEventListener("click", (e) => {
    if (
      !notificationBtn.contains(e.target) &&
      !notificationDropdown.contains(e.target)
    ) {
      notificationDropdown.classList.add("hidden");
    }
  });

  markAllRead?.addEventListener("click", async () => {
    try {
      await api.put("/notifications/read-all");
      document.getElementById("notificationBadge").classList.add("hidden");
      document.querySelectorAll(".notification-item.unread").forEach((el) => {
        el.classList.remove("unread");
      });
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

async function loadNotificationCount() {
  try {
    const { count } = await api.get("/notifications/unread-count");
    const badge = document.getElementById("notificationBadge");
    if (count > 0) {
      badge.textContent = count > 9 ? "9+" : count;
      badge.classList.remove("hidden");
    }
  } catch {
    // Non-critical
  }
}

async function loadNotifications() {
  const list = document.getElementById("notificationList");

  try {
    const notifications = await api.get("/notifications");

    if (!notifications.length) {
      list.innerHTML = '<div class="notification-empty">No notifications yet</div>';
      return;
    }

    list.innerHTML = notifications
      .map((n) => {
        const requestId = n.friendRequest?._id || n.friendRequest;
        const showActions =
          n.type === "friend_request" && !n.handled && requestId;

        return `
      <div class="notification-item ${n.read ? "" : "unread"}" data-notification-id="${n._id}" data-sender-id="${n.sender?._id || ""}" data-post-id="${n.post?._id || ""}">
        <img src="${getImageUrl(n.sender?.profileImage)}" alt="${n.sender?.username}">
        <div class="notification-content">
          <p>${n.message}</p>
          <time>${timeAgo(n.createdAt)}</time>
          ${
            showActions
              ? `<div class="notification-actions">
              <button class="btn btn-primary btn-sm accept-request-btn" data-request-id="${requestId}">Accept</button>
              <button class="btn btn-outline btn-sm decline-request-btn" data-request-id="${requestId}">Decline</button>
            </div>`
              : ""
          }
        </div>
      </div>
    `;
      })
      .join("");

    list.querySelectorAll(".notification-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".notification-actions")) return;

        const postId = item.dataset.postId;
        const senderId = item.dataset.senderId;

        if (postId) {
          window.location.href = `post.html?id=${postId}`;
        } else if (senderId) {
          window.location.href = `profile.html?id=${senderId}`;
        }
      });
    });

    list.querySelectorAll(".accept-request-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        btn.disabled = true;
        try {
          await acceptFriendRequest(btn.dataset.requestId);
          const item = btn.closest(".notification-item");
          item.querySelector(".notification-actions").remove();
          item.classList.remove("unread");
          loadNotificationCount();
        } catch (err) {
          showToast(err.message, "error");
          btn.disabled = false;
        }
      });
    });

    list.querySelectorAll(".decline-request-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        btn.disabled = true;
        try {
          await declineFriendRequest(btn.dataset.requestId);
          btn.closest(".notification-item")?.remove();
          loadNotificationCount();
        } catch (err) {
          showToast(err.message, "error");
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    list.innerHTML = '<div class="notification-empty">Failed to load</div>';
  }
}

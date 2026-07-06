function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function showLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.remove("hidden");
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.add("hidden");
}

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function confirmAction(message) {
  return window.confirm(message);
}

function initDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;

  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateDarkModeIcons(saved);

  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateDarkModeIcons(next);
  });
}

function updateDarkModeIcons(theme) {
  const sun = document.querySelector(".icon-sun");
  const moon = document.querySelector(".icon-moon");
  if (sun && moon) {
    sun.classList.toggle("hidden", theme === "dark");
    moon.classList.toggle("hidden", theme !== "dark");
  }
}

function setupNavbar() {
  const user = getUser();
  if (!user) return;

  const navUsername = document.getElementById("navUsername");
  const navAvatar = document.getElementById("navAvatar");

  if (navUsername) navUsername.textContent = user.username;
  if (navAvatar) navAvatar.src = getImageUrl(user.profileImage);

  document.querySelectorAll('a[href="profile.html"]').forEach((link) => {
    link.href = `profile.html?id=${user._id}`;
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  initDarkMode();
  initSearch();
}

function initSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  if (!searchInput || !searchResults) return;

  let debounceTimer;

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();

    if (query.length < 1) {
      searchResults.classList.add("hidden");
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const users = await api.get(`/users?search=${encodeURIComponent(query)}`);
        renderSearchResults(users, searchResults);
      } catch {
        searchResults.classList.add("hidden");
      }
    }, 300);
  });

  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add("hidden");
    }
  });
}

function getFriendActionHtml(u) {
  if (u.isOwnProfile) {
    return '<span class="search-result-self">You</span>';
  }
  if (u.isFollowing) {
    return `<button class="btn btn-outline btn-sm search-friend-btn" data-user-id="${u._id}" data-action="remove">Friends</button>`;
  }
  if (u.requestReceived && u.friendRequestId) {
    return `
      <div class="search-request-actions">
        <button class="btn btn-primary btn-sm accept-request-btn" data-request-id="${u.friendRequestId}">Accept</button>
        <button class="btn btn-outline btn-sm decline-request-btn" data-request-id="${u.friendRequestId}">Decline</button>
      </div>`;
  }
  if (u.requestSent) {
    return '<button class="btn btn-outline btn-sm" disabled>Request Sent</button>';
  }
  return `<button class="btn btn-primary btn-sm search-friend-btn" data-user-id="${u._id}" data-action="send">Add Friend</button>`;
}

function renderSearchResults(users, container) {
  if (!users.length) {
    container.innerHTML = '<div class="notification-empty">No users found</div>';
    container.classList.remove("hidden");
    return;
  }

  container.innerHTML = users
    .map(
      (u) => `
    <div class="search-result-item" data-user-id="${u._id}">
      <div class="search-result-main">
        <img src="${getImageUrl(u.profileImage)}" alt="${u.username}">
        <div class="search-result-info">
          <h4>${escapeHtml(u.username)}</h4>
          <p>${escapeHtml(u.name)}</p>
          <span class="search-result-id">ID: ${u._id}</span>
        </div>
      </div>
      ${getFriendActionHtml(u)}
    </div>
  `
    )
    .join("");

  container.classList.remove("hidden");

  container.querySelectorAll(".search-result-main").forEach((main) => {
    main.addEventListener("click", () => {
      const item = main.closest(".search-result-item");
      window.location.href = `profile.html?id=${item.dataset.userId}`;
    });
  });

  container.querySelectorAll(".search-friend-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await handleSearchFriend(btn);
    });
  });

  attachRequestActionListeners(container);
}

async function handleSearchFriend(btn) {
  const userId = btn.dataset.userId;
  const action = btn.dataset.action;

  btn.disabled = true;
  btn.textContent = action === "remove" ? "Removing..." : "Sending...";

  try {
    if (action === "remove") {
      await api.delete(`/users/${userId}/friend`);
      btn.textContent = "Add Friend";
      btn.className = "btn btn-primary btn-sm search-friend-btn";
      btn.dataset.action = "send";
      showToast("Friend removed", "info");
    } else {
      await api.post(`/users/${userId}/follow`);
      btn.outerHTML = '<button class="btn btn-outline btn-sm" disabled>Request Sent</button>';
      showToast("Friend request sent!", "success");
    }
  } catch (err) {
    showToast(err.message, "error");
    btn.textContent = action === "remove" ? "Friends" : "Add Friend";
  } finally {
    if (btn.parentNode) btn.disabled = false;
  }
}

async function acceptFriendRequest(requestId) {
  const result = await api.put(`/friend-requests/${requestId}/accept`);
  showToast("Friend request accepted!", "success");
  return result;
}

async function declineFriendRequest(requestId) {
  await api.put(`/friend-requests/${requestId}/decline`);
  showToast("Friend request declined", "info");
}

function attachRequestActionListeners(container) {
  container.querySelectorAll(".accept-request-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      btn.disabled = true;
      try {
        await acceptFriendRequest(btn.dataset.requestId);
        const item = btn.closest(".search-result-item, .notification-item");
        if (item) {
          item.querySelector(".search-request-actions, .notification-actions")?.remove();
          const status = document.createElement("span");
          status.className = "search-result-self";
          status.textContent = "Friends";
          item.appendChild(status);
        }
        loadNotificationCount?.();
      } catch (err) {
        showToast(err.message, "error");
        btn.disabled = false;
      }
    });
  });

  container.querySelectorAll(".decline-request-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      btn.disabled = true;
      try {
        await declineFriendRequest(btn.dataset.requestId);
        btn.closest(".search-result-item, .notification-item")?.remove();
        loadNotificationCount?.();
      } catch (err) {
        showToast(err.message, "error");
        btn.disabled = false;
      }
    });
  });
}

function initLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const closeBtn = document.getElementById("lightboxClose");

  if (!lightbox) return;

  window.openLightbox = (src) => {
    lightboxImg.src = src;
    lightbox.classList.remove("hidden");
  };

  const close = () => lightbox.classList.add("hidden");

  closeBtn?.addEventListener("click", close);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
}

function createPostCard(post) {
  const card = document.createElement("article");
  card.className = "post-card card";
  card.dataset.postId = post._id;

  const commentsHtml = (post.comments || [])
    .slice(-3)
    .map(
      (c) => `
    <div class="comment-item">
      <strong>${c.user?.username || "user"}</strong>
      <span>${escapeHtml(c.text)}</span>
      <time>${timeAgo(c.createdAt)}</time>
    </div>
  `
    )
    .join("");

  card.innerHTML = `
    <div class="post-header">
      <div class="post-user" data-user-id="${post.user._id}">
        <img src="${getImageUrl(post.user.profileImage)}" alt="${post.user.username}">
        <div class="post-user-info">
          <h4>${post.user.username}</h4>
          <time>${timeAgo(post.createdAt)}</time>
        </div>
      </div>
      ${post.isOwner ? '<button class="post-delete-btn" title="Delete post"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg></button>' : ""}
    </div>
    <div class="post-image-wrapper">
      <img src="${getImageUrl(post.image)}" alt="Post" class="post-image" loading="lazy">
    </div>
    <div class="post-actions">
      <button class="action-btn like-btn ${post.isLiked ? "liked" : ""}" data-liked="${post.isLiked}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="${post.isLiked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span class="like-count">${post.likeCount || 0}</span>
      </button>
      <button class="action-btn comment-toggle-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>${post.commentCount || 0}</span>
      </button>
      <a href="post.html?id=${post._id}" class="action-btn" title="View post">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>
      </a>
    </div>
    <div class="post-likes">${post.likeCount || 0} likes</div>
    ${post.caption ? `<div class="post-caption"><strong>${post.user.username}</strong>${escapeHtml(post.caption)}</div>` : ""}
    <div class="post-comments">${commentsHtml}</div>
    <form class="comment-form">
      <input type="text" placeholder="Add a comment..." maxlength="500">
      <button type="submit">Post</button>
    </form>
  `;

  attachPostEvents(card, post);
  return card;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function attachPostEvents(card, post) {
  const postId = post._id;

  card.querySelector(".post-user")?.addEventListener("click", () => {
    window.location.href = `profile.html?id=${post.user._id}`;
  });

  const likeBtn = card.querySelector(".like-btn");
  likeBtn?.addEventListener("click", () => handleLike(postId, card));

  const imageWrapper = card.querySelector(".post-image-wrapper");
  let lastTap = 0;

  imageWrapper?.addEventListener("click", (e) => {
    if (e.detail === 1) {
      setTimeout(() => {
        if (e.detail === 1) {
          openLightbox(getImageUrl(post.image));
        }
      }, 250);
    }
  });

  imageWrapper?.addEventListener("dblclick", () => {
    const likeBtn = card.querySelector(".like-btn");
    if (likeBtn?.dataset.liked !== "true") {
      handleLike(postId, card, true);
    }
  });

  imageWrapper?.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (card.querySelector(".like-btn")?.dataset.liked !== "true") {
        handleLike(postId, card, true);
      }
    }
    lastTap = now;
  });

  card.querySelector(".comment-toggle-btn")?.addEventListener("click", () => {
    card.querySelector(".comment-form input")?.focus();
  });

  card.querySelector(".comment-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = e.target.querySelector("input");
    const text = input.value.trim();
    if (!text) return;

    try {
      const result = await api.post(`/posts/${postId}/comment`, { text });
      const commentsDiv = card.querySelector(".post-comments");
      const newComment = document.createElement("div");
      newComment.className = "comment-item";
      newComment.innerHTML = `
        <strong>${getUser().username}</strong>
        <span>${escapeHtml(text)}</span>
        <time>just now</time>
      `;
      commentsDiv.appendChild(newComment);
      input.value = "";

      const commentCountEl = card.querySelector(".comment-toggle-btn span");
      if (commentCountEl) commentCountEl.textContent = result.commentCount;
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  card.querySelector(".post-delete-btn")?.addEventListener("click", async () => {
    if (!confirmAction("Are you sure you want to delete this post?")) return;

    try {
      await api.delete(`/posts/${postId}`);
      card.style.animation = "fadeInUp 0.3s ease reverse";
      setTimeout(() => card.remove(), 300);
      showToast("Post deleted", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

async function handleLike(postId, card, showAnim = false) {
  try {
    const result = await api.post(`/posts/${postId}/like`);
    const likeBtn = card.querySelector(".like-btn");
    const likeCountEl = card.querySelector(".like-count");
    const likesText = card.querySelector(".post-likes");

    likeBtn.dataset.liked = result.isLiked;
    likeBtn.classList.toggle("liked", result.isLiked);

    const svg = likeBtn.querySelector("svg");
    svg.setAttribute("fill", result.isLiked ? "currentColor" : "none");

    likeCountEl.textContent = result.likeCount;
    likesText.textContent = `${result.likeCount} likes`;

    if (showAnim && result.isLiked) {
      const anim = document.createElement("div");
      anim.className = "like-animation";
      anim.textContent = "❤️";
      card.querySelector(".post-image-wrapper").appendChild(anim);
      setTimeout(() => anim.remove(), 800);
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

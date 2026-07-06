if (!requireAuth()) throw new Error("Auth required");

let profileUserId = null;
let profileData = null;

document.addEventListener("DOMContentLoaded", () => {
  setupNavbar();
  initLightbox();
  initDarkMode();

  const params = new URLSearchParams(window.location.search);
  profileUserId = params.get("id") || getUser()._id;

  const profileLink = document.querySelector('a[href="profile.html"]');
  if (profileLink) profileLink.href = `profile.html?id=${getUser()._id}`;

  loadProfile();
  setupEditProfile();
  setupCopyLink();
});

async function loadProfile() {
  showLoader();

  try {
    profileData = await api.get(`/users/${profileUserId}`);
    renderProfile(profileData);
    await loadUserPosts();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    hideLoader();
  }
}

function renderProfile(user) {
  document.getElementById("profileAvatar").src = getImageUrl(user.profileImage);
  document.getElementById("profileUsername").textContent = user.username;
  document.getElementById("profileName").textContent = user.name;
  document.getElementById("profileBio").textContent = user.bio || "No bio yet.";
  document.getElementById("postsCount").textContent = user.postsCount || 0;
  document.getElementById("followersCount").textContent = user.followers?.length || 0;
  document.getElementById("followingCount").textContent = user.following?.length || 0;

  const actions = document.getElementById("profileActions");

  if (user.isOwnProfile) {
    actions.innerHTML = `
      <button class="btn btn-primary btn-sm" id="editProfileBtn">Edit Profile</button>
      <button class="btn btn-outline btn-sm" id="copyLinkBtn">Copy Profile Link</button>
    `;
    document.getElementById("editProfileBtn").addEventListener("click", openEditModal);
    document.getElementById("copyLinkBtn").addEventListener("click", copyProfileLink);
  } else {
    let actionHtml = "";

    if (user.isFollowing) {
      actionHtml = `<button class="btn btn-outline btn-sm" id="followBtn" data-action="remove">Friends</button>`;
    } else if (user.requestReceived && user.friendRequestId) {
      actionHtml = `
        <button class="btn btn-primary btn-sm accept-request-btn" data-request-id="${user.friendRequestId}">Accept</button>
        <button class="btn btn-outline btn-sm decline-request-btn" data-request-id="${user.friendRequestId}">Decline</button>`;
    } else if (user.requestSent) {
      actionHtml = `<button class="btn btn-outline btn-sm" disabled>Request Sent</button>`;
    } else {
      actionHtml = `<button class="btn btn-primary btn-sm" id="followBtn" data-action="send">Add Friend</button>`;
    }

    actions.innerHTML = `
      ${actionHtml}
      <button class="btn btn-outline btn-sm" id="copyLinkBtn">Copy Profile Link</button>
    `;

    const followBtn = document.getElementById("followBtn");
    if (followBtn) followBtn.addEventListener("click", handleProfileFriendAction);

    attachRequestActionListeners(actions);

    actions.querySelectorAll(".accept-request-btn, .decline-request-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (btn.classList.contains("accept-request-btn")) {
          try {
            const result = await acceptFriendRequest(btn.dataset.requestId);
            document.getElementById("followersCount").textContent = result.followersCount;
            renderProfile({ ...profileData, isFollowing: true, requestReceived: false, requestSent: false });
          } catch (err) {
            showToast(err.message, "error");
          }
        } else {
          try {
            await declineFriendRequest(btn.dataset.requestId);
            renderProfile({ ...profileData, requestReceived: false });
          } catch (err) {
            showToast(err.message, "error");
          }
        }
      });
    });

    document.getElementById("copyLinkBtn").addEventListener("click", copyProfileLink);
  }
}

async function loadUserPosts() {
  try {
    const data = await api.get(`/posts?user=${profileUserId}&limit=50`);
    const grid = document.getElementById("profilePostsGrid");
    const empty = document.getElementById("emptyPosts");

    if (!data.posts.length) {
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");
    grid.innerHTML = data.posts
      .map(
        (post) => `
      <div class="posts-grid-item" data-post-id="${post._id}">
        <img src="${getImageUrl(post.image)}" alt="Post" loading="lazy">
        <div class="posts-grid-overlay">
          <span>❤️ ${post.likeCount}</span>
          <span>💬 ${post.commentCount}</span>
        </div>
      </div>
    `
      )
      .join("");

    grid.querySelectorAll(".posts-grid-item").forEach((item) => {
      item.addEventListener("click", () => {
        window.location.href = `post.html?id=${item.dataset.postId}`;
      });
    });
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function handleProfileFriendAction() {
  const btn = document.getElementById("followBtn");
  const action = btn.dataset.action;

  btn.disabled = true;
  btn.textContent = action === "remove" ? "Removing..." : "Sending...";

  try {
    if (action === "remove") {
      const result = await api.delete(`/users/${profileUserId}/friend`);
      profileData.isFollowing = false;
      document.getElementById("followersCount").textContent = result.followersCount;
      renderProfile(profileData);
      showToast("Friend removed", "info");
    } else {
      await api.post(`/users/${profileUserId}/follow`);
      profileData.requestSent = true;
      renderProfile(profileData);
      showToast("Friend request sent!", "success");
    }
  } catch (err) {
    showToast(err.message, "error");
    btn.disabled = false;
    btn.textContent = action === "remove" ? "Friends" : "Add Friend";
  }
}

function copyProfileLink() {
  const url = `${window.location.origin}${window.location.pathname}?id=${profileUserId}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast("Profile link copied!", "success");
  });
}

function setupCopyLink() {
  // Handled in renderProfile
}

function openEditModal() {
  const modal = document.getElementById("editModal");
  document.getElementById("editName").value = profileData.name;
  document.getElementById("editUsername").value = profileData.username;
  document.getElementById("editBio").value = profileData.bio || "";
  document.getElementById("editAvatarPreview").src = getImageUrl(profileData.profileImage);
  modal.classList.remove("hidden");
}

function setupEditProfile() {
  const modal = document.getElementById("editModal");
  const overlay = document.getElementById("editModalOverlay");
  const closeBtn = document.getElementById("closeEditModal");
  const form = document.getElementById("editProfileForm");
  const imageInput = document.getElementById("editProfileImage");

  const close = () => modal.classList.add("hidden");
  overlay.addEventListener("click", close);
  closeBtn.addEventListener("click", close);

  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById("editAvatarPreview").src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("editName").value.trim());
    formData.append("username", document.getElementById("editUsername").value.trim());
    formData.append("bio", document.getElementById("editBio").value.trim());

    const imageFile = imageInput.files[0];
    if (imageFile) formData.append("profileImage", imageFile);

    try {
      const updated = await api.put(`/users/${getUser()._id}`, formData);
      profileData = { ...profileData, ...updated };
      renderProfile(profileData);
      updateStoredUser(updated);

      const navAvatar = document.getElementById("navAvatar");
      if (navAvatar) navAvatar.src = getImageUrl(updated.profileImage);

      close();
      showToast("Profile updated!", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

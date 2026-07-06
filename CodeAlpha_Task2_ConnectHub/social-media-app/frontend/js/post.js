if (!requireAuth()) throw new Error("Auth required");

document.addEventListener("DOMContentLoaded", () => {
  setupNavbar();
  initLightbox();
  initDarkMode();

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  if (!postId) {
    window.location.href = "index.html";
    return;
  }

  loadPost(postId);
});

async function loadPost(postId) {
  try {
    const post = await api.get(`/posts/${postId}`);
    const container = document.getElementById("postDetailContainer");
    container.appendChild(createPostCard(post));
    hideLoader();
  } catch (err) {
    showToast(err.message, "error");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  }
}

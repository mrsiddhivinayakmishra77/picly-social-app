let users =
  JSON.parse(
    localStorage.getItem("piclyUsers") || "[]"
  );

let currentUser =
  JSON.parse(
    localStorage.getItem("piclyCurrentUser") || "null"
  );

let posts =
  JSON.parse(
    localStorage.getItem("piclyPostsV2") || "null"
  ) || [];


/* =========================
   AUTH
========================= */

function signup() {

  const username =
    document
      .getElementById("signupUsername")
      .value
      .trim();

  const email =
    document
      .getElementById("signupEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("signupPassword")
      .value;

  if (!username || !email || !password) {

    alert("सभी details भरें।");

    return;
  }

  if (
    users.some(
      u =>
        u.username.toLowerCase() ===
        username.toLowerCase()
    )
  ) {

    alert("यह username पहले से मौजूद है।");

    return;
  }

  const user = {

    id: Date.now(),

    username,

    email,

    password,

    followers: [],

    following: [],

    posts: 0

  };

  users.push(user);

  localStorage.setItem(
    "piclyUsers",
    JSON.stringify(users)
  );

  currentUser = user;

  localStorage.setItem(
    "piclyCurrentUser",
    JSON.stringify(user)
  );

  startApp();
}


function login() {

  const username =
    document
      .getElementById("loginUsername")
      .value
      .trim();

  const password =
    document
      .getElementById("loginPassword")
      .value;

  const user =
    users.find(
      u =>
        u.username === username &&
        u.password === password
    );

  if (!user) {

    alert("Username या password गलत है।");

    return;
  }

  currentUser = user;

  localStorage.setItem(
    "piclyCurrentUser",
    JSON.stringify(user)
  );

  startApp();
}


function logout() {

  localStorage.removeItem(
    "piclyCurrentUser"
  );

  location.reload();
}


function showLogin() {

  document
    .getElementById("signupBox")
    .classList.add("hidden");

  document
    .getElementById("loginBox")
    .classList.remove("hidden");
}


function showSignup() {

  document
    .getElementById("loginBox")
    .classList.add("hidden");

  document
    .getElementById("signupBox")
    .classList.remove("hidden");
}


/* =========================
   APP
========================= */

function startApp() {

  document
    .getElementById("authScreen")
    .classList.add("hidden");

  document
    .getElementById("app")
    .classList.remove("hidden");

  renderStories();

  renderPosts();

  updateProfileButton();
}


function updateProfileButton() {

  document
    .getElementById("profileButton")
    .textContent =
      currentUser.username[0]
        .toUpperCase();
}


/* =========================
   STORIES
========================= */

function renderStories() {

  const names =
    ["maya", "rohan", "sara", "dev", "riya"];

  document
    .getElementById("stories")
    .innerHTML =

      names.map(
        name => `

        <div class="story">

          <img
            src="https://i.pravatar.cc/100?u=${name}"
          >

          <div>${name}</div>

        </div>

        `
      ).join("");
}


/* =========================
   POSTS
========================= */

function renderPosts(list = posts) {

  const feed =
    document.getElementById("feed");

  if (!list.length) {

    feed.innerHTML = `
      <div class="empty">
        अभी कोई post नहीं है ✨
      </div>
    `;

    return;
  }

  feed.innerHTML =

    list.map(
      p => `

      <article class="post">

        <div class="post-head">

          <img
            src="https://i.pravatar.cc/100?u=${p.user}"
          >

          <b>@${escapeHTML(p.user)}</b>

        </div>


        <img
          class="post-image"
          src="${p.image}"
        >


        <div class="actions">

          <button
            class="action"
            onclick="likePost(${p.id})">

            ${p.liked ? "❤️" : "♡"}

          </button>

          <button class="action">
            💬
          </button>

          <button class="action">
            ↗️
          </button>

        </div>


        <div class="caption">

          <b>
            ${p.likes || 0} likes
          </b>

          <br>

          <b>
            ${escapeHTML(p.user)}
          </b>

          ${escapeHTML(p.caption || "")}

        </div>

      </article>

      `
    ).join("");
}


function likePost(id) {

  const post =
    posts.find(
      p => p.id === id
    );

  if (!post) return;

  post.liked =
    !post.liked;

  post.likes =
    (post.likes || 0)
    +
    (post.liked ? 1 : -1);

  localStorage.setItem(
    "piclyPostsV2",
    JSON.stringify(posts)
  );

  renderPosts();
}


/* =========================
   CREATE POST
========================= */

function openPost() {

  document
    .getElementById("postModal")
    .classList.remove("hidden");

}


function closePost() {

  document
    .getElementById("postModal")
    .classList.add("hidden");

}


function publishPost() {

  const image =
    document
      .getElementById("imageUrl")
      .value
      .trim();

  const caption =
    document
      .getElementById("caption")
      .value
      .trim();

  if (!image) {

    alert("Image URL डालें।");

    return;
  }

  posts.unshift({

    id: Date.now(),

    user:
      currentUser.username,

    image,

    caption,

    likes: 0,

    liked: false

  });

  localStorage.setItem(
    "piclyPostsV2",
    JSON.stringify(posts)
  );

  renderPosts();

  closePost();

}


/* =========================
   PROFILE
========================= */

function openProfile() {

  document
    .getElementById("profileName")
    .textContent =
      "@" + currentUser.username;

  document
    .getElementById("profileEmail")
    .textContent =
      currentUser.email;

  document
    .getElementById("postCount")
    .textContent =
      posts.filter(
        p =>
          p.user ===
          currentUser.username
      ).length;

  document
    .getElementById("profileModal")
    .classList.remove("hidden");

}


/* PROFILE CLOSE / BACK */

function closeProfile() {

  document
    .getElementById("profileModal")
    .classList.add("hidden");

}


/* =========================
   SEARCH
========================= */

document
  .getElementById("search")
  .addEventListener(
    "input",
    function () {

      const q =
        this.value
          .toLowerCase()
          .trim();

      renderPosts(

        posts.filter(
          p =>
            p.user
              .toLowerCase()
              .includes(q)

            ||

            (p.caption || "")
              .toLowerCase()
              .includes(q)
        )

      );

    }
  );


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {

  return String(text)
    .replace(
      /[&<>"']/g,
      c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[c])
    );

}


/* =========================
   START APP
========================= */

if (currentUser) {

  startApp();

}

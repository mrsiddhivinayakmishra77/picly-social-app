/* =====================================================
   PICLY - SUPABASE APP.JS
===================================================== */


/* =========================
   SUPABASE CONFIG
========================= */

const SUPABASE_URL =
  "https://yvtpifktgngjjslitfle.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_QuUw4bcJnbak6Fb7FrGvpg_0tf4ywD1";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================
   GLOBAL VARIABLES
========================= */

let currentUser = null;

let currentProfile = null;

let currentViewedProfile = null;

let searchTimer = null;


/* =====================================================
   AUTH
===================================================== */


/* =========================
   SIGNUP
========================= */

async function signup() {

  const username =
    document
      .getElementById("signupUsername")
      .value
      .trim()
      .toLowerCase();

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


  if (username.length < 3) {

    alert(
      "Username कम से कम 3 characters का होना चाहिए।"
    );

    return;
  }


  if (password.length < 6) {

    alert(
      "Password कम से कम 6 characters का होना चाहिए।"
    );

    return;
  }


  /* CHECK USERNAME */

  const {
    data: existingUser,
    error: usernameError
  } =
    await supabaseClient
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();


  if (usernameError) {

    console.error(usernameError);

    alert(
      "Username check नहीं हो पाया।"
    );

    return;
  }


  if (existingUser) {

    alert(
      "यह username पहले से मौजूद है।"
    );

    return;
  }


  /* CREATE AUTH ACCOUNT */

  const {
    data,
    error
  } =
    await supabaseClient.auth.signUp({

      email: email,

      password: password

    });


  if (error) {

    console.error(error);

    alert(error.message);

    return;
  }


  if (!data.user) {

    alert(
      "Account बन गया। कृपया login करें।"
    );

    return;
  }


  /* CREATE PROFILE */

  const {
    error: profileError
  } =
    await supabaseClient
      .from("profiles")
      .insert({

        id:
          data.user.id,

        username:
          username,

        name:
          username,

        email:
          email,

        bio:
          "",

        avatar_url:
          ""

      });


  if (profileError) {

    console.error(profileError);

    alert(
      "Account बन गया लेकिन profile save नहीं हुई: " +
      profileError.message
    );

    return;
  }


  currentUser =
    data.user;


  await loadCurrentProfile();


  startApp();

}


/* =========================
   LOGIN
========================= */

async function login() {

  const username =
    document
      .getElementById("loginUsername")
      .value
      .trim()
      .toLowerCase();

  const password =
    document
      .getElementById("loginPassword")
      .value;


  if (!username || !password) {

    alert(
      "Username और password डालें।"
    );

    return;
  }


  /* FIND EMAIL */

  const {
    data: profile,
    error: profileError
  } =
    await supabaseClient
      .from("profiles")
      .select("email")
      .eq("username", username)
      .maybeSingle();


  if (profileError) {

    console.error(profileError);

    alert(
      "User खोजने में समस्या हुई।"
    );

    return;
  }


  if (!profile) {

    alert(
      "यह username मौजूद नहीं है।"
    );

    return;
  }


  /* LOGIN */

  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .signInWithPassword({

        email:
          profile.email,

        password:
          password

      });


  if (error) {

    console.error(error);

    alert(
      "Username या password गलत है।"
    );

    return;
  }


  currentUser =
    data.user;


  await loadCurrentProfile();


  startApp();

}


/* =========================
   LOGOUT
========================= */

async function logout() {

  await supabaseClient
    .auth
    .signOut();


  currentUser = null;

  currentProfile = null;

  currentViewedProfile = null;


  location.reload();

}


/* =========================
   LOGIN / SIGNUP SWITCH
========================= */

function showLogin() {

  document
    .getElementById("signupBox")
    .classList
    .add("hidden");


  document
    .getElementById("loginBox")
    .classList
    .remove("hidden");

}


function showSignup() {

  document
    .getElementById("loginBox")
    .classList
    .add("hidden");


  document
    .getElementById("signupBox")
    .classList
    .remove("hidden");

}


/* =====================================================
   APP START
===================================================== */

function startApp() {

  document
    .getElementById("authScreen")
    .classList
    .add("hidden");


  document
    .getElementById("app")
    .classList
    .remove("hidden");


  renderStories();

  loadPosts();

  updateProfileButton();

}


/* =====================================================
   CURRENT PROFILE
===================================================== */

async function loadCurrentProfile() {

  if (!currentUser)
    return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .single();


  if (error) {

    console.error(error);

    return;
  }


  currentProfile =
    data;

}


/* =====================================================
   PROFILE BUTTON
===================================================== */

function updateProfileButton() {

  const button =
    document
      .getElementById(
        "profileButton"
      );


  if (
    !button ||
    !currentProfile
  )
    return;


  button.textContent =
    (
      currentProfile.username ||
      "U"
    )[0]
      .toUpperCase();

}


/* =====================================================
   STORIES
===================================================== */

function renderStories() {

  const names =
    [
      "maya",
      "rohan",
      "sara",
      "dev",
      "riya"
    ];


  document
    .getElementById("stories")
    .innerHTML =

      names
        .map(
          name => `

          <div class="story">

            <img
              src="https://i.pravatar.cc/100?u=${name}"
            >

            <div>
              ${name}
            </div>

          </div>

          `
        )
        .join("");

}


/* =====================================================
   POSTS
===================================================== */


/* =========================
   LOAD POSTS
========================= */

async function loadPosts() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("posts")
      .select(`
        id,
        user_id,
        image_url,
        caption,
        created_at,
        profiles (
          username,
          avatar_url
        )
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    alert(
      "Posts load नहीं हो पाए।"
    );

    return;
  }


  renderPosts(
    data || []
  );

}


/* =========================
   RENDER POSTS
========================= */

function renderPosts(
  posts = []
) {

  const feed =
    document
      .getElementById("feed");


  if (!posts.length) {

    feed.innerHTML = `
      <div class="empty">
        अभी कोई post नहीं है ✨
      </div>
    `;

    return;
  }


  feed.innerHTML =

    posts
      .map(
        post => {

          const username =
            post.profiles?.username ||
            "user";


          const avatar =
            post.profiles?.avatar_url ||
            `https://i.pravatar.cc/100?u=${username}`;


          return `

          <article class="post">

            <div
              class="post-head"
              onclick="viewUserProfile('${escapeHTML(username)}')"
              style="cursor:pointer"
            >

              <img
                src="${avatar}"
              >

              <b>
                @${escapeHTML(username)}
              </b>

            </div>


            <img
              class="post-image"
              src="${escapeHTML(post.image_url)}"
              loading="lazy"
            >


            <div class="actions">

              <button class="action">
                ♡
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
                @${escapeHTML(username)}
              </b>

              ${escapeHTML(
                post.caption || ""
              )}

            </div>

          </article>

          `;

        }
      )
      .join("");

}


/* =====================================================
   CREATE POST
===================================================== */


/* =========================
   OPEN POST
========================= */

function openPost() {

  document
    .getElementById("postModal")
    .classList
    .remove("hidden");

}


/* =========================
   CLOSE POST
========================= */

function closePost() {

  document
    .getElementById("postModal")
    .classList
    .add("hidden");

}


/* =========================
   PUBLISH POST
========================= */

async function publishPost() {

  if (!currentUser) {

    alert(
      "पहले login करें।"
    );

    return;
  }


  const fileInput =
    document
      .getElementById(
        "postImage"
      );


  const caption =
    document
      .getElementById(
        "caption"
      )
      .value
      .trim();


  const file =
    fileInput.files[0];


  if (!file) {

    alert(
      "पहले photo चुनें।"
    );

    return;
  }


  /* IMAGE CHECK */

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    alert(
      "सिर्फ image upload कर सकते हैं।"
    );

    return;
  }


  /* SIZE CHECK */

  if (
    file.size >
    10 * 1024 * 1024
  ) {

    alert(
      "Photo 10MB से छोटी होनी चाहिए।"
    );

    return;
  }


  /* FILE EXTENSION */

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  /* UNIQUE FILE PATH */

  const filePath =
    currentUser.id +
    "/" +
    Date.now() +
    "." +
    extension;


  /* =========================
     UPLOAD IMAGE
  ========================= */

  const {
    error: uploadError
  } =
    await supabaseClient
      .storage
      .from("posts")
      .upload(
        filePath,
        file,
        {

          cacheControl:
            "3600",

          upsert:
            false

        }
      );


  if (uploadError) {

    console.error(
      "Upload Error:",
      uploadError
    );


    alert(
      "Photo upload नहीं हुई: " +
      uploadError.message
    );

    return;
  }


  /* =========================
     GET PUBLIC URL
  ========================= */

  const {
    data:
      publicData
  } =
    supabaseClient
      .storage
      .from("posts")
      .getPublicUrl(
        filePath
      );


  const imageUrl =
    publicData.publicUrl;


  /* =========================
     SAVE POST
  ========================= */

  const {
    error: postError
  } =
    await supabaseClient
      .from("posts")
      .insert({

        user_id:
          currentUser.id,

        image_url:
          imageUrl,

        caption:
          caption

      });


  if (postError) {

    console.error(
      "Post Error:",
      postError
    );


    alert(
      "Post save नहीं हुई: " +
      postError.message
    );


    /* DELETE UPLOADED IMAGE */

    await supabaseClient
      .storage
      .from("posts")
      .remove([
        filePath
      ]);


    return;
  }


  /* =========================
     CLEAR FORM
  ========================= */

  fileInput.value = "";

  document
    .getElementById(
      "caption"
    )
    .value = "";


  closePost();


  /* REFRESH POSTS */

  await loadPosts();


  alert(
    "Post successfully uploaded! 🎉"
  );

}


/* =====================================================
   PROFILE
===================================================== */


/* =========================
   MY PROFILE
========================= */

async function openProfile() {

  if (!currentProfile) {

    await loadCurrentProfile();

  }


  if (!currentProfile)
    return;


  await showProfile(
    currentProfile,
    true
  );

}


/* =========================
   OTHER USER PROFILE
========================= */

async function viewUserProfile(
  username
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq(
        "username",
        username
      )
      .maybeSingle();


  if (error) {

    console.error(error);

    alert(
      "Profile load नहीं हो सकी।"
    );

    return;
  }


  if (!data) {

    alert(
      "User नहीं मिला।"
    );

    return;
  }


  await showProfile(
    data,
    data.id ===
      currentUser?.id
  );

}


/* =========================
   SHOW PROFILE
========================= */

async function showProfile(
  profile,
  isMine = false
) {

  currentViewedProfile =
    profile;


  /* NAME */

  document
    .getElementById(
      "profileName"
    )
    .textContent =
      "@" +
      profile.username;


  /* EMAIL */

  document
    .getElementById(
      "profileEmail"
    )
    .textContent =
      isMine
        ? (
            profile.email ||
            ""
          )
        : "";


  /* BIO */

  document
    .getElementById(
      "profileBio"
    )
    .textContent =
      profile.bio ||
      "";


  /* AVATAR */

  const avatar =
    document
      .getElementById(
        "profileAvatar"
      );


  if (
    profile.avatar_url
  ) {

    avatar.innerHTML = `

      <img
        src="${escapeHTML(
          profile.avatar_url
        )}"
        style="
          width:100%;
          height:100%;
          border-radius:50%;
          object-fit:cover;
        "
      >

    `;

  } else {

    avatar.textContent =
      "👤";

  }


  /* =========================
     POST COUNT
  ========================= */

  const {
    count:
      postCount
  } =
    await supabaseClient
      .from("posts")
      .select(
        "id",
        {
          count:
            "exact",
          head:
            true
        }
      )
      .eq(
        "user_id",
        profile.id
      );


  /* =========================
     FOLLOWER COUNT
  ========================= */

  const {
    count:
      followerCount
  } =
    await supabaseClient
      .from("follows")
      .select(
        "follower_id",
        {
          count:
            "exact",
          head:
            true
        }
      )
      .eq(
        "following_id",
        profile.id
      );


  /* =========================
     FOLLOWING COUNT
  ========================= */

  const {
    count:
      followingCount
  } =
    await supabaseClient
      .from("follows")
      .select(
        "following_id",
        {
          count:
            "exact",
          head:
            true
        }
      )
      .eq(
        "follower_id",
        profile.id
      );


  document
    .getElementById(
      "postCount"
    )
    .textContent =
      postCount ||
      0;


  document
    .getElementById(
      "followerCount"
    )
    .textContent =
      followerCount ||
      0;


  document
    .getElementById(
      "followingCount"
    )
    .textContent =
      followingCount ||
      0;


  /* BUTTONS */

  const followButton =
    document
      .getElementById(
        "followButton"
      );


  const logoutButton =
    document
      .getElementById(
        "logoutButton"
      );


  if (isMine) {

    followButton
      .classList
      .add("hidden");


    logoutButton
      .classList
      .remove("hidden");

  } else {

    logoutButton
      .classList
      .add("hidden");


    followButton
      .classList
      .remove("hidden");


    await updateFollowButton();

  }


  /* OPEN MODAL */

  document
    .getElementById(
      "profileModal"
    )
    .classList
    .remove("hidden");

}


/* =====================================================
   FOLLOW
===================================================== */


/* =========================
   CHECK FOLLOW
========================= */

async function updateFollowButton() {

  if (
    !currentUser ||
    !currentViewedProfile
  )
    return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("follows")
      .select(
        "follower_id"
      )
      .eq(
        "follower_id",
        currentUser.id
      )
      .eq(
        "following_id",
        currentViewedProfile.id
      )
      .maybeSingle();


  if (error) {

    console.error(error);

    return;
  }


  const button =
    document
      .getElementById(
        "followButton"
      );


  button.textContent =
    data
      ? "Following"
      : "Follow";

}


/* =========================
   FOLLOW / UNFOLLOW
========================= */

async function toggleFollow() {

  if (
    !currentUser ||
    !currentViewedProfile
  )
    return;


  if (
    currentUser.id ===
    currentViewedProfile.id
  )
    return;


  const {
    data
  } =
    await supabaseClient
      .from("follows")
      .select(
        "follower_id"
      )
      .eq(
        "follower_id",
        currentUser.id
      )
      .eq(
        "following_id",
        currentViewedProfile.id
      )
      .maybeSingle();


  /* UNFOLLOW */

  if (data) {

    const {
      error
    } =
      await supabaseClient
        .from("follows")
        .delete()
        .eq(
          "follower_id",
          currentUser.id
        )
        .eq(
          "following_id",
          currentViewedProfile.id
        );


    if (error) {

      console.error(error);

      alert(
        "Unfollow नहीं हो पाया।"
      );

      return;
    }


  } else {

    /* FOLLOW */

    const {
      error
    } =
      await supabaseClient
        .from("follows")
        .insert({

          follower_id:
            currentUser.id,

          following_id:
            currentViewedProfile.id

        });


    if (error) {

      console.error(error);

      alert(
        "Follow नहीं हो पाया।"
      );

      return;
    }

  }


  await showProfile(
    currentViewedProfile,
    false
  );

}


/* =====================================================
   CLOSE PROFILE
===================================================== */

function closeProfile() {

  document
    .getElementById(
      "profileModal"
    )
    .classList
    .add("hidden");


  currentViewedProfile =
    null;

}


/* =====================================================
   USER SEARCH
===================================================== */


/* =========================
   SEARCH INPUT
========================= */

document
  .getElementById(
    "search"
  )
  .addEventListener(
    "input",
    function () {

      const query =
        this.value
          .trim()
          .toLowerCase();


      clearTimeout(
        searchTimer
      );


      if (!query) {

        document
          .getElementById(
            "userSearchResults"
          )
          .innerHTML =
            "";


        loadPosts();

        return;
      }


      searchTimer =
        setTimeout(
          () => {

            searchUsers(
              query
            );

          },
          300
        );

    }
  );


/* =========================
   SEAR

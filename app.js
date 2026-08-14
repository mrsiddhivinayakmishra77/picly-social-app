/* =====================================================
   PICLY - SUPABASE APP
===================================================== */


/* =========================
   SUPABASE
========================= */

if (!window.supabase) {
  alert("Supabase library load नहीं हुई।");
  throw new Error("Supabase library missing");
}

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
   GLOBAL
========================= */

let currentUser = null;
let currentProfile = null;
let currentViewedProfile = null;


/* =====================================================
   AUTH
===================================================== */

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
    alert("Username कम से कम 3 characters का होना चाहिए।");
    return;
  }


  if (password.length < 6) {
    alert("Password कम से कम 6 characters का होना चाहिए।");
    return;
  }


  /* CHECK USERNAME */

  const {
    data: oldProfile,
    error: usernameError
  } =
    await supabaseClient
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();


  if (usernameError) {
    console.error(usernameError);
    alert("Username check नहीं हो पाया।");
    return;
  }


  if (oldProfile) {
    alert("यह username पहले से मौजूद है।");
    return;
  }


  /* CREATE AUTH USER */

  const {
    data: authData,
    error: authError
  } =
    await supabaseClient.auth.signUp({
      email: email,
      password: password
    });


  if (authError) {
    console.error(authError);
    alert(authError.message);
    return;
  }


  if (!authData.user) {
    alert("Account create नहीं हुआ।");
    return;
  }


  /* CREATE PROFILE */

  const {
    error: insertError
  } =
    await supabaseClient
      .from("profiles")
      .insert({
        id: authData.user.id,
        username: username,
        name: username,
        email: email,
        bio: "",
        avatar_url: ""
      });


  if (insertError) {
    console.error(insertError);

    alert(
      "Account बना लेकिन profile save नहीं हुई:\n" +
      insertError.message
    );

    return;
  }


  currentUser = authData.user;

  await loadCurrentProfile();

  openApp();

}


/* =====================================================
   LOGIN
===================================================== */

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
    alert("Username और password डालें।");
    return;
  }


  /* FIND USER EMAIL */

  const {
    data: profile,
    error: findError
  } =
    await supabaseClient
      .from("profiles")
      .select("id, username, email")
      .eq("username", username)
      .maybeSingle();


  if (findError) {

    console.error(findError);

    alert(
      "User खोजने में error:\n" +
      findError.message
    );

    return;
  }


  if (!profile) {

    alert(
      "यह username मौजूद नहीं है।"
    );

    return;
  }


  if (!profile.email) {

    alert(
      "इस account में email नहीं मिली।"
    );

    return;
  }


  /* LOGIN */

  const {
    data: loginData,
    error: loginError
  } =
    await supabaseClient
      .auth
      .signInWithPassword({

        email: profile.email,

        password: password

      });


  if (loginError) {

    console.error(loginError);

    alert(
      "Login failed:\n" +
      loginError.message
    );

    return;
  }


  if (!loginData.session) {

    alert(
      "Login session नहीं बनी।"
    );

    return;
  }


  currentUser =
    loginData.user;


  await loadCurrentProfile();


  if (!currentProfile) {

    alert(
      "Profile नहीं मिली।"
    );

    return;
  }


  openApp();

}


/* =====================================================
   OPEN APP
===================================================== */

function openApp() {

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
   SHOW LOGIN / SIGNUP
===================================================== */

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
   LOGOUT
===================================================== */

async function logout() {

  const {
    error
  } =
    await supabaseClient
      .auth
      .signOut();


  if (error) {

    console.error(error);

    alert(
      "Logout नहीं हुआ।"
    );

    return;
  }


  currentUser = null;
  currentProfile = null;
  currentViewedProfile = null;


  location.reload();

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
      .maybeSingle();


  if (error) {

    console.error(error);

    alert(
      "Profile load error:\n" +
      error.message
    );

    return;
  }


  currentProfile =
    data || null;

}


/* =====================================================
   PROFILE BUTTON
===================================================== */

function updateProfileButton() {

  const button =
    document.getElementById(
      "profileButton"
    );


  if (!button || !currentProfile)
    return;


  button.textContent =
    (
      currentProfile.username ||
      "U"
    )[0].toUpperCase();

}


/* =====================================================
   STORIES
===================================================== */

function renderStories() {

  const names = [
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
      "Posts load नहीं हो पाए:\n" +
      error.message
    );

    return;
  }


  renderPosts(
    data || []
  );

}


function renderPosts(posts = []) {

  const feed =
    document.getElementById(
      "feed"
    );


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
      .map(post => {

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
                src="${escapeHTML(avatar)}"
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

      })
      .join("");

}


/* =====================================================
   CREATE POST
===================================================== */

function openPost() {

  document
    .getElementById("postModal")
    .classList
    .remove("hidden");

}


function closePost() {

  document
    .getElementById("postModal")
    .classList
    .add("hidden");

}


/* =====================================================
   UPLOAD PHOTO + CREATE POST
===================================================== */

async function publishPost() {

  if (!currentUser) {

    alert(
      "पहले login करें।"
    );

    return;
  }


  const fileInput =
    document.getElementById(
      "postImage"
    );


  const caption =
    document
      .getElementById("caption")
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


  if (
    !file.type.startsWith("image/")
  ) {

    alert(
      "सिर्फ image upload कर सकते हैं।"
    );

    return;
  }


  if (
    file.size >
    10 * 1024 * 1024
  ) {

    alert(
      "Photo 10MB से छोटी होनी चाहिए।"
    );

    return;
  }


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const filePath =
    currentUser.id +
    "/" +
    Date.now() +
    "." +
    extension;


  /* UPLOAD */

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
          cacheControl: "3600",
          upsert: false
        }
      );


  if (uploadError) {

    console.error(uploadError);

    alert(
      "Photo upload नहीं हुई:\n" +
      uploadError.message
    );

    return;
  }


  /* PUBLIC URL */

  const {
    data: publicData
  } =
    supabaseClient
      .storage
      .from("posts")
      .getPublicUrl(
        filePath
      );


  const imageUrl =
    publicData.publicUrl;


  /* SAVE POST */

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

    console.error(postError);

    await supabaseClient
      .storage
      .from("posts")
      .remove([
        filePath
      ]);


    alert(
      "Post save नहीं हुई:\n" +
      postError.message
    );

    return;
  }


  fileInput.value = "";

  document
    .getElementById("caption")
    .value = "";


  closePost();

  await loadPosts();


  alert(
    "Post successfully uploaded! 🎉"
  );

}


/* =====================================================
   MY PROFILE
===================================================== */

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


/* =====================================================
   OTHER USER PROFILE
===================================================== */

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
      "Profile load नहीं हो सकी:\n" +
      error.message
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


/* =====================================================
   SHOW PROFILE
===================================================== */

async function showProfile(
  profile,
  isMine
) {

  currentViewedProfile =
    profile;


  document
    .getElementById("profileName")
    .textContent =
      "@" +
      profile.username;


  document
    .getElementById("profileEmail")
    .textContent =
      isMine
        ? (
            profile.email ||
            ""
          )
        : "";


  document
    .getElementById("profileBio")
    .textContent =
      profile.bio ||
      "";


  const avatar =
    document.getElementById(
      "profileAvatar"
    );


  if (profile.avatar_url) {

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


  /* POST COUNT */

  const {
    count: postCount
  } =
    await supabaseClient
      .from("posts")
      .select(
        "id",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "user_id",
        profile.id
      );


  /* FOLLOWERS */

  const {
    count: followerCount
  } =
    await supabaseClient
      .from("follows")
      .select(
        "follower_id",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "following_id",
        profile.id
      );


  /* FOLLOWING */

  const {
    count: followingCount
  } =
    await supabaseClient
      .from("follows")
      .select(
        "following_id",
        {
          count: "exact",
          head: true
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
      postCount || 0;


  document
    .getElementById(
      "followerCount"
    )
    .textContent =
      followerCount || 0;


  document
    .getElementById(
      "followingCount"
    )
    .textContent =
      followingCount || 0;


  const followButton =
    document.getElementById(
      "followButton"
    );


  const logoutButton =
    document.getElementById(
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


  document
    .getElementById(
      "followButton"
    )
    .textContent =
      data
        ? "Following"
        : "Follow";

}


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
    data,
    error: checkError
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


  if (checkError) {

    console.error(checkError);

    alert(
      "Follow check नहीं हो पाया।"
    );

    return;
  }


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
        "Follow नहीं हो पाया:\n" +
        error.message
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
   SEARCH
===================================================== */

document
  .getElementById("search")
  .addEventListener(
    "input",
    function () {

      const query =
        this.value
          .trim()
          .toLowerCase();


      clearTimeout(
        window.piclySearchTimer
      );


      if (!query) {

        document
          .getElementById(
            "userSearchResults"
          )
          .innerHTML = "";


        loadPosts();

        return;
      }


      window.piclySearchTimer =
        setTimeout(
          function () {

            searchUsers(
              query
            );

          },
          300
        );

    }
  );


async function searchUsers(
  query
) {

  const resultsBox =
    document.getElementById(
      "userSearchResults"
    );


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id,username,name,avatar_url"
      )
      .or(
        "username.ilike.%" +
        query +
        "%,name.ilike.%" +
        query +
        "%"
      )
      .limit(20);


  if (error) {

    console.error(error);

    resultsBox.innerHTML = `
      <div class="empty">
        Search error
      </div>
    `;

    return;
  }


  if (
    !data ||
    data.length === 0
  ) {

    resultsBox.innerHTML = `
      <div class="empty">
        कोई user नहीं मिला।
      </div>
    `;

    return;
  }


  resultsBox.innerHTML =

    data
      .map(
        user => `

 

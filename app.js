/* =====================================================
   PICLY - SUPABASE APP
===================================================== */

const SUPABASE_URL =
  "https://yvtpifktgngjjslitfle.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_QuUw4bcJnbak6Fb7FrGvpg_0tf4ywD1";


if (!window.supabase) {
  alert("Supabase library load नहीं हुई।");
  throw new Error("Supabase library missing");
}


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


let currentUser = null;
let currentProfile = null;
let currentViewedProfile = null;
let searchTimer = null;


/* =====================================================
   HELPERS
===================================================== */

function $(id) {
  return document.getElementById(id);
}


function esc(value) {

  return String(value ?? "")
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


/* =====================================================
   SIGN UP
===================================================== */

async function signup() {

  const username =
    $("signupUsername")
      .value
      .trim()
      .toLowerCase();

  const email =
    $("signupEmail")
      .value
      .trim();

  const password =
    $("signupPassword")
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
    data: existing,
    error: checkError
  } =
    await supabaseClient
      .from("profiles")
      .select("id")
      .eq(
        "username",
        username
      )
      .maybeSingle();


  if (checkError) {

    console.error(checkError);

    alert(
      "Username check error: " +
      checkError.message
    );

    return;
  }


  if (existing) {

    alert(
      "यह username पहले से मौजूद है।"
    );

    return;
  }


  /* CREATE AUTH ACCOUNT */

  const {
    data: auth,
    error: authError
  } =
    await supabaseClient
      .auth
      .signUp({

        email: email,

        password: password

      });


  if (authError) {

    console.error(authError);

    alert(
      authError.message
    );

    return;
  }


  if (!auth.user) {

    alert(
      "Account create नहीं हुआ।"
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
          auth.user.id,

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
      "Account बना लेकिन profile save नहीं हुई: " +
      profileError.message
    );

    return;
  }


  currentUser =
    auth.user;


  await loadCurrentProfile();


  openApp();

}


/* =====================================================
   LOGIN
===================================================== */

async function login() {

  const username =
    $("loginUsername")
      .value
      .trim()
      .toLowerCase();

  const password =
    $("loginPassword")
      .value;


  if (!username || !password) {

    alert(
      "Username और password डालें।"
    );

    return;
  }


  /* FIND PROFILE */

  const {
    data: profile,
    error: findError
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id,username,email"
      )
      .eq(
        "username",
        username
      )
      .maybeSingle();


  if (findError) {

    console.error(findError);

    alert(
      "User खोजने में error: " +
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
      "Login failed: " +
      error.message
    );

    return;
  }


  if (!data.session) {

    alert(
      "Login session नहीं बनी।"
    );

    return;
  }


  currentUser =
    data.user;


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

    alert(
      "Logout नहीं हुआ: " +
      error.message
    );

    return;
  }


  location.reload();

}


/* =====================================================
   LOGIN / SIGNUP SWITCH
===================================================== */

function showLogin() {

  $("signupBox")
    .classList
    .add("hidden");


  $("loginBox")
    .classList
    .remove("hidden");

}


function showSignup() {

  $("loginBox")
    .classList
    .add("hidden");


  $("signupBox")
    .classList
    .remove("hidden");

}


/* =====================================================
   OPEN APP
===================================================== */

function openApp() {

  $("authScreen")
    .classList
    .add("hidden");


  $("app")
    .classList
    .remove("hidden");


  renderStories();

  updateProfileButton();

  loadPosts();

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

    return;
  }


  currentProfile =
    data || null;

}


/* =====================================================
   PROFILE BUTTON
===================================================== */

function updateProfileButton() {

  if (!currentProfile)
    return;


  $("profileButton")
    .textContent =
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

  const names = [
    "maya",
    "rohan",
    "sara",
    "dev",
    "riya"
  ];


  $("stories")
    .innerHTML =

      names
        .map(
          name => `

          <div class="story">

            <img
              src="https://i.pravatar.cc/100?u=${encodeURIComponent(name)}"
            >

            <div>
              ${esc(name)}
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
      "Posts load नहीं हो पाए: " +
      error.message
    );

    return;
  }


  renderPosts(
    data || []
  );

}


function renderPosts(posts) {

  const feed =
    $("feed");


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
            `https://i.pravatar.cc/100?u=${encodeURIComponent(username)}`;


          return `

          <article class="post">

            <div
              class="post-head"
              onclick="viewUserProfile('${esc(username)}')"
              style="cursor:pointer"
            >

              <img
                src="${esc(avatar)}"
              >

              <b>
                @${esc(username)}
              </b>

            </div>


            <img
              class="post-image"
              src="${esc(post.image_url)}"
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
                @${esc(username)}
              </b>

              ${esc(
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

function openPost() {

  $("postModal")
    .classList
    .remove("hidden");

}


function closePost() {

  $("postModal")
    .classList
    .add("hidden");

}


/* =====================================================
   UPLOAD PHOTO
===================================================== */

async function publishPost() {

  if (!currentUser) {

    alert(
      "पहले login करें।"
    );

    return;
  }


  const input =
    $("postImage");


  const file =
    input.files[0];


  const caption =
    $("caption")
      .value
      .trim();


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


  const ext =
    (
      file.name
        .split(".")
        .pop() ||
      "jpg"
    )
    .toLowerCase();


  const path =
    `${currentUser.id}/${Date.now()}.${ext}`;


  /* UPLOAD */

  const {
    error: uploadError
  } =
    await supabaseClient
      .storage
      .from("posts")
      .upload(
        path,
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
      uploadError
    );

    alert(
      "Photo upload नहीं हुई: " +
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
        path
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

    console.error(
      postError
    );


    await supabaseClient
      .storage
      .from("posts")
      .remove([
        path
      ]);


    alert(
      "Post save नहीं हुई: " +
      postError.message
    );

    return;
  }


  input.value = "";

  $("caption")
    .value = "";


  closePost();

  await loadPosts();

}


/* =====================================================
   MY PROFILE
===================================================== */

async function openProfile() {

  if (!currentProfile) {

    await loadCurrentProfile();

  }


  if (
    currentProfile
  ) {

    await showProfile(
      currentProfile,
      true
    );

  }

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

    alert(
      "Profile load नहीं हो सकी: " +
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


  $("profileName")
    .textContent =
      "@" +
      profile.username;


  $("profileEmail")
    .textContent =
      isMine
        ? (
            profile.email ||
            ""
          )
        : "";


  $("profileBio")
    .textContent =
      profile.bio ||
      "";


  const avatar =
    $("profileAvatar");


  if (
    profile.avatar_url
  ) {

    avatar.innerHTML = `

      <img
        src="${esc(
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


  /* COUNTS */

  const [
    posts,
    followers,
    following
  ] = await Promise.all([

    supabaseClient
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
      ),

    supabaseClient
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
      ),

    supabaseClient
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
      )

  ]);


  $("postCount")
    .textContent =
      posts.count || 0;


  $("followerCount")
    .textContent =
      followers.count || 0;


  $("followingCount")
    .textContent =
      following.count || 0;


  const followButton =
    $("followButton");


  const logoutButton =
    $("logoutButton");


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


  $("profileModal")
    .classList
    .remove("hidden");

}


/* =====================================================
   FOLLOW BUTTON
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

    console.error(
      error
    );

    return;
  }


  $("followButton")
    .textContent =
      data
        ? "Following"
        : "Follow";

}


/* =====================================================
   FOLLOW / UNFOLLOW
===================================================== */

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

    alert(
      "Follow check error: " +
      checkError.message
    );

    return;
  }


  let error;


  if (data) {

    ({
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
        ));

  } else {

    ({
      error
    } =
      await supabaseClient
        .from("follows")
        .insert({

          follower_id:
            currentUser.id,

          following_id:
            currentViewedProfile.id

        }));

  }


  if (error) {

    alert(
      "Follow नहीं हुआ: " +
      error.message
    );

    return;
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

  $("profileModal")
    .classList
    .add("hidden");


  currentViewedProfile =
    null;

}


/* =====================================================
   SEARCH
===================================================== */

$("search")
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

        $("userSearchResults")
          .innerHTML = "";


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


async function searchUsers(
  query
) {

  const box =
    $("userSearchResults");


  const safe =
    query.replace(
      /[%_,]/g,
      ""
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
        `username.ilike.%${safe}%,name.ilike.%${safe}%`
      )
      .limit(20);


  if (error) {

    console.error(
      error
    );


    box.innerHTML = `
      <div class="empty">
        Search error
      </div>
    `;

    return;
  }


  if (
    !data ||
    !data.length
  ) {

    box.innerHTML = `
      <div class="empty">
        कोई user नहीं मिला।
      </div>
    `;

    return;
  }


  box.innerHTML =

    data
      .map(
        user => `

        <div
          class="user-result"
          onclick="viewUserProfile('${esc(
            user.username
          )}')"
        >

          <img
            src="${
              esc(
                user.avatar_url ||
                `https://i.pravatar.cc/100?u=${encodeURIComponent(
                  user.username
                )}`
              )
            }"
          >

          <div>

            <b>
              ${esc(
                user.name ||
                user.username
              )}
            </b>

            <small>
              @${esc(
                user.username
              )}
            </small>

          </div>

        </div>

        `
      )
      .join("");

}


/* =====================================================
   SESSION
=====================================

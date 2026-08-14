/* =====================================================
   PICLY - SUPABASE VERSION
===================================================== */


/* =========================
   SUPABASE
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
   GLOBAL
========================= */

let currentUser = null;
let currentProfile = null;
let currentViewedProfile = null;


/* =========================
   HELPER
========================= */

function $(id) {
  return document.getElementById(id);
}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      function (c) {

        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[c];

      }
    );

}


/* =====================================================
   SIGNUP
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
    error: usernameError
  } =
    await supabaseClient
      .from("profiles")
      .select("id")
      .eq(
        "username",
        username
      )
      .maybeSingle();


  if (usernameError) {

    alert(
      "Username check error:\n" +
      usernameError.message
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
    data,
    error
  } =
    await supabaseClient
      .auth
      .signUp({

        email: email,

        password: password,

        options: {

          data: {
            username: username
          }

        }

      });


  if (error) {

    alert(
      "Signup error:\n" +
      error.message
    );

    return;
  }


  if (!data.user) {

    alert(
      "Account create नहीं हुआ।"
    );

    return;
  }


  /*
     PROFILE

     अगर email confirmation OFF है,
     तो session तुरंत मिल जाएगी।
  */

  if (data.session) {

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

      alert(
        "Profile save error:\n" +
        profileError.message
      );

      return;
    }


    currentUser =
      data.user;


    await loadCurrentProfile();

    openApp();

  } else {

    alert(
      "Account बन गया है।\n\n" +
      "अगर Supabase में email confirmation ON है, " +
      "तो पहले अपनी email verify करें, फिर Login करें।"
    );

    showLogin();

  }

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


  /* FIND EMAIL FROM USERNAME */

  const {
    data: profile,
    error: profileError
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, username, email"
      )
      .eq(
        "username",
        username
      )
      .maybeSingle();


  if (profileError) {

    alert(
      "User खोजने में error:\n" +
      profileError.message
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
      "इस account की email नहीं मिली।"
    );

    return;
  }


  /* AUTH LOGIN */

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

    alert(
      "Login failed:\n" +
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
   AUTH SWITCH
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
   LOAD CURRENT PROFILE
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

    console.error(
      "Profile error:",
      error
    );

    return;
  }


  currentProfile =
    data || null;

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
      "Logout error:\n" +
      error.message
    );

    return;
  }


  currentUser = null;
  currentProfile = null;
  currentViewedProfile = null;


  location.reload();

}


/* =====================================================
   PROFILE BUTTON
===================================================== */

function updateProfileButton() {

  if (!currentProfile)
    return;


  const username =
    currentProfile.username ||
    "U";


  $("profileButton")
    .textContent =
      username
        .charAt(0)
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
          function (name) {

            return `

              <div class="story">

                <img
                  src="https://i.pravatar.cc/100?u=${encodeURIComponent(name)}"
                >

                <div>
                  ${escapeHTML(name)}
                </div>

              </div>

            `;

          }
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
      "Posts load error:\n" +
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
        function (post) {

          const username =
            post.profiles?.username ||
            "user";


          const avatar =
            post.profiles?.avatar_url ||
            "https://i.pravatar.cc/100?u=" +
            encodeURIComponent(username);


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
   POST MODAL
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
   PUBLISH PHOTO
===================================================== */

async function publishPost() {

  if (!currentUser) {

    alert(
      "पहले login करें।"
    );

    return;
  }


  const fileInput =
    $("postImage");


  const file =
    fileInput.files[0];


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
      "सिर्फ image upload करें।"
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
    (
      file.name
        .split(".")
        .pop() ||
      "jpg"
    )
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
          upsert: false
        }
      );


  if (uploadError) {

    alert(
      "Photo upload error:\n" +
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

    await supabaseClient
      .storage
      .from("posts")
      .remove([
        filePath
      ]);


    alert(
      "Post save error:\n" +
      postError.message
    );

    return;
  }


  fileInput.value = "";

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

    alert(
      "Profile load error:\n" +
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
    data.id === currentUser?.id
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
        ? profile.email || ""
        : "";


  if ($("profileBio")) {

    $("profileBio")
      .textContent =
        profile.bio || "";

  }


  const avatar =
    $("profileAvatar");


  if (profile.avatar_url) {

    avatar.innerHTML = `

      <img
        src="${escapeHTML(profile.avatar_url)}"
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


  /* FOLLOWER COUNT */

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


  /* FOLLOWING COUNT */

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


  $("postCount")
    .textContent =
      postCount || 0;


  $("followerCount")
    .textContent =
      followerCount || 0;


  $("followingCount")
    .textContent =
      followingCount || 0;


  const followButton =
    $("followButton");

 const messageButton =
  $("messageButton");

  const logoutButton =
    $("logoutButton");


  if (isMine) {

  followButton
    .classList
    .add("hidden");

  messageButton
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

  messageButton
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

    console.error(error);

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
      "Follow check error:\n" +
      checkError.message
    );

    return;
  }


  let result;


  if (data) {

    result =
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

  } else {

    result =
      await supabaseClient
        .from("follows")
        .insert({

          follower_id:
            currentUser.id,

          following_id:
            currentViewedProfile.id

        });

  }


  if (result.error) {

    alert(
      "Follow error:\n" +
      result.error.message
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
   USER SEARCH
===================================================== */

$("search")
  .addEventListener(
    "input",
    async function () {

      const query =
        this.value
          .trim()
          .toLowerCase();


      const results =
        $("userSearchResults");


      if (!query) {

        results.innerHTML = "";

        await loadPosts();

        return;
      }


      const {
        data,
        error
      } =
        await supabaseClient
          .from("profiles")
          .select(
            "id,username,name,avatar_url"
          )
          .ilike(
            "username",
            "%" +
            query +
            "%"
          )
          .limit(20);


      if (error) {

        results.innerHTML = `

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

        results.innerHTML = `

          <div class="empty">
            कोई user नहीं मिला।
          </div>

        `;

        return;
      }


      results.innerHTML =

        data
          .map(
            function (user) {

              const avatar =
                user.avatar_url ||
                "https://i.pravatar.cc/100?u=" +
                encodeURIComponent(
                  user.username
                );


              return `

                <div
                  class="user-result"
                  onclick="viewUserProfile('${escapeHTML(user.username)}')"
                >

                  <img
                    src="${escapeHTML(avatar)}"
                  >

                  <div>
                   <b>
                      ${escapeHTML(
                        user.name ||
                        user.username
                      )}
                    </b>

                    <small>
                      @${escapeHTML(
                        user.username
                      )}
                    </small>

                  </div>

                </div>

              `;

            }
          )
          .join("");

    }
  );


/* =====================================================
   SESSION
===================================================== */

async function checkSession() {

  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .getSession();


  if (error) {

    console.error(
      "Session error:",
      error
    );

    return;
  }


  if (
    !data ||
    !data.session
  ) {

    return;
  }


  currentUser =
    data.session.user;


  await loadCurrentProfile();


  if (currentProfile) {

    openApp();

  }

}


/* =====================================================
   AUTH STATE
===================================================== */

supabaseClient
  .auth
  .onAuthStateChange(
    async function (
      event,
      session
    ) {

      if (
        event ===
        "SIGNED_OUT"
      ) {

        currentUser = null;
        currentProfile = null;

        return;
      }


      if (
        session &&
        !currentUser
      ) {

        currentUser =
          session.user;

        await loadCurrentProfile();

      }

    }
  );


/* =====================================================
   START APP
===================================================== */

checkSession();
/* =====================================================
   PROFILE PHOTO
===================================================== */

async function uploadAvatar() {

  if (!currentUser) {
    alert("पहले login करें।");
    return;
  }

  const input =
    document.getElementById("avatarInput");

  const file =
    input.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("सिर्फ image चुनें।");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Photo 5MB से छोटी होनी चाहिए।");
    return;
  }

  const extension =
    (file.name.split(".").pop() || "jpg")
      .toLowerCase();

  const filePath =
    currentUser.id +
    "/profile." +
    extension;


  /* Upload */

  const {
    error: uploadError
  } =
    await supabaseClient
      .storage
      .from("avatars")
      .upload(
        filePath,
        file,
        {
          upsert: true
        }
      );


  if (uploadError) {

    alert(
      "DP upload error:\n" +
      uploadError.message
    );

    return;
  }


  /* Get public URL */

  const {
    data
  } =
    supabaseClient
      .storage
      .from("avatars")
      .getPublicUrl(
        filePath
      );


  const avatarUrl =
    data.publicUrl +
    "?v=" +
    Date.now();


  /* Save URL in profile */

  const {
    error: updateError
  } =
    await supabaseClient
      .from("profiles")
      .update({
        avatar_url: avatarUrl
      })
      .eq(
        "id",
        currentUser.id
      );


  if (updateError) {

    alert(
      "DP save error:\n" +
      updateError.message
    );

    return;
  }


  currentProfile.avatar_url =
    avatarUrl;


  /* Show immediately */

  const avatar =
    document.getElementById(
      "profileAvatar"
    );


  avatar.innerHTML = `

    <img
      src="${escapeHTML(avatarUrl)}"
      style="
        width:100%;
        height:100%;
        border-radius:50%;
        object-fit:cover;
      "
    >

  `;


  alert("Profile photo updated! ✅");

}
/* =====================================================
   PRIVATE MESSAGES
===================================================== */

let currentChatUser = null;


/* =========================
   OPEN CHAT FROM PROFILE
========================= */

function openChatFromProfile() {

  if (!currentUser) {

    alert("पहले login करें।");

    return;
  }

  if (!currentViewedProfile) {

    return;
  }

  openChat(currentViewedProfile);

}


/* =========================
   OPEN CHAT
========================= */

async function openChat(profile) {

  if (!currentUser) {

    alert("पहले login करें।");

    return;
  }


  if (
    profile.id ===
    currentUser.id
  ) {

    alert(
      "आप खुद को message नहीं भेज सकते।"
    );

    return;
  }


  currentChatUser =
    profile;


  $("chatTitle")
    .textContent =
      "💬 @" +
      profile.username;


  $("chatInput")
    .value = "";


  $("chatModal")
    .classList
    .remove("hidden");


  await loadMessages();


  setTimeout(
    function () {

      $("chatInput")
        .focus();

    },
    100
  );

}


/* =========================
   LOAD MESSAGES
========================= */

async function loadMessages() {

  if (
    !currentUser ||
    !currentChatUser
  ) {

    return;
  }


  const myId =
    currentUser.id;

  const otherId =
    currentChatUser.id;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("messages")
      .select(
        "id,sender_id,receiver_id,content,created_at"
      )
      .or(
        "and(sender_id.eq." +
        myId +
        ",receiver_id.eq." +
        otherId +
        ")," +
        "and(sender_id.eq." +
        otherId +
        ",receiver_id.eq." +
        myId +
        ")"
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (error) {

    alert(
      "Messages load error:\n" +
      error.message
    );

    return;
  }


  renderMessages(
    data || []
  );

}

/* =====================================================
   RENDER CHAT MESSAGES
===================================================== */

function renderMessages(messages) {

  const box = $("chatMessages");


  /* NO MESSAGES */

  if (!messages || !messages.length) {

    box.innerHTML = `

      <div class="empty">
        अभी कोई message नहीं है 💬
      </div>

    `;

    return;
  }


  /* RENDER EVERY MESSAGE */

  box.innerHTML = messages
    .map(function (message) {


      /* WHO SENT IT? */

      const mine =
        message.sender_id ===
        currentUser.id;


      /* NAME */

      const senderName =
        mine
          ? "You"
          : (
              currentChatUser.username ||
              currentChatUser.name ||
              "User"
            );


      /* MESSAGE */

      return `

        <div
          class="chat-message-wrapper ${
            mine
              ? "mine"
              : "theirs"
          }"
        >

          <div class="chat-sender">
            ${escapeHTML(senderName)}
          </div>


          <div
            class="chat-message ${
              mine
                ? "mine"
                : "theirs"
            }"
          >

            ${escapeHTML(
              message.content
            )}

          </div>

        </div>

      `;

    })
    .join("");


  /* SCROLL TO BOTTOM */

  box.scrollTop =
    box.scrollHeight;

}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

  if (
    !currentUser ||
    !currentChatUser
  ) {

    return;
  }


  const input =
    $("chatInput");


  const content =
    input.value.trim();


  if (!content) {

    return;
  }


  if (
    currentChatUser.id ===
    currentUser.id
  ) {

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("messages")
      .insert({

        sender_id:
          currentUser.id,

        receiver_id:
          currentChatUser.id,

        content:
          content

      });


  if (error) {

    alert(
      "Message send error:\n" +
      error.message
    );

    return;
  }


  input.value = "";


  await loadMessages();

}


/* =========================
   CLOSE CHAT
========================= */

function closeChat() {

  $("chatModal")
    .classList
    .add("hidden");


  currentChatUser =
    null;

}


/* =========================
   ENTER TO SEND
========================= */

$("chatInput")
  .addEventListener(
    "keydown",
    function (event) {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        sendMessage();

      }

    }
  );
/* =====================================================
   MESSAGES INBOX
===================================================== */

async function openInbox() {

  if (!currentUser) {

    alert("पहले login करें।");

    return;
  }

  $("inboxModal")
    .classList
    .remove("hidden");

  await loadInbox();

}


/* =====================================================
   LOAD INBOX
===================================================== */

async function loadInbox() {

  const list =
    $("inboxList");

  list.innerHTML = `
    <div class="empty">
      Messages loading...
    </div>
  `;


  const {
    data: messages,
    error
  } =
    await supabaseClient
      .from("messages")
      .select(`
        sender_id,
        receiver_id,
        content,
        created_at
      `)
      .or(
        "sender_id.eq." +
        currentUser.id +
        ",receiver_id.eq." +
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    list.innerHTML = `
      <div class="empty">
        ${escapeHTML(error.message)}
      </div>
    `;

    return;
  }


  if (!messages || !messages.length) {

    list.innerHTML = `
      <div class="empty">
        अभी कोई conversation नहीं है 💬
      </div>
    `;

    return;
  }


  /* FIND UNIQUE USERS */

  const userIds = [];

  messages.forEach(
    function (message) {

      const otherUser =
        message.sender_id ===
        currentUser.id
          ? message.receiver_id
          : message.sender_id;


      if (
        !userIds.includes(
          otherUser
        )
      ) {

        userIds.push(
          otherUser
        );

      }

    }
  );


  /* LOAD PROFILES */

  const {
    data: profiles,
    error: profileError
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id,username,name,avatar_url"
      )
      .in(
        "id",
        userIds
      );


  if (profileError) {

    list.innerHTML = `
      <div class="empty">
        Profile load error
      </div>
    `;

    return;
  }


  /* BUILD INBOX */

  list.innerHTML = "";


  userIds.forEach(
    function (userId) {

      const profile =
        profiles.find(
          function (p) {
            return p.id === userId;
          }
        );


      if (!profile)
        return;


      const lastMessage =
        messages.find(
          function (m) {

            return (
              m.sender_id === userId ||
              m.receiver_id === userId
            );

          }
        );
const messagePrefix =
  lastMessage &&
  lastMessage.sender_id === currentUser.id
    ? "You: "
    : profile.username + ": ";

      const avatar =
        profile.avatar_url ||
        (
          "https://i.pravatar.cc/100?u=" +
          encodeURIComponent(
            profile.username
          )
        );


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "inbox-item";


      item.innerHTML = `

        <img
          src="${escapeHTML(avatar)}"
        >

        <div class="inbox-info">

          <b>
            @${escapeHTML(
              profile.username
            )}
          </b>

          <span>
  ${escapeHTML(
    messagePrefix +
    (lastMessage?.content || "")
  )}
</span>

        </div>

      `;


      item.onclick =
        async function () {

          closeInbox();

          await openChat(
            profile
          );

        };


      list.appendChild(
        item
      );

    }
  );

}


/* =====================================================
   CLOSE INBOX
===================================================== */

function closeInbox() {

  $("inboxModal")
    .classList
    .add("hidden");

}

                  

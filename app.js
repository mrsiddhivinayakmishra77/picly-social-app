function svgAvatar(name, bg) {

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg"
         width="100"
         height="100">

      <rect
        width="100"
        height="100"
        fill="${bg}"
      />

      <text
        x="50"
        y="58"
        text-anchor="middle"
        font-family="Arial"
        font-size="42"
        fill="white">
        ${name[0].toUpperCase()}
      </text>

    </svg>
  `)}`;

}


function svgPhoto(title, bg1, bg2) {

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg"
         width="800"
         height="800">

      <defs>

        <linearGradient
          id="g"
          x1="0"
          y1="0"
          x2="1"
          y2="1">

          <stop stop-color="${bg1}"/>

          <stop
            offset="1"
            stop-color="${bg2}"
          />

        </linearGradient>

      </defs>

      <rect
        width="800"
        height="800"
        fill="url(#g)"
      />

      <circle
        cx="650"
        cy="160"
        r="110"
        fill="white"
        opacity=".18"
      />

      <circle
        cx="150"
        cy="650"
        r="170"
        fill="white"
        opacity=".12"
      />

      <text
        x="400"
        y="420"
        text-anchor="middle"
        font-family="Arial"
        font-size="55"
        font-weight="700"
        fill="white">
        ${title}
      </text>

    </svg>
  `)}`;

}


const people = [

  ["alex", "#1877f2"],

  ["maya", "#e1306c"],

  ["rohan", "#7b2cff"],

  ["sara", "#ff7a00"],

  ["dev", "#00a884"],

  ["riya", "#d62976"],

  ["sam", "#555"]

];


let posts =
  JSON.parse(
    localStorage.getItem("piclyPostsV2") || "null"
  )
  ||
  [

    {
      id: 1,

      user: "maya",

      avatar:
        svgAvatar(
          "maya",
          "#e1306c"
        ),

      image:
        svgPhoto(
          "Beautiful Day",
          "#ff7a00",
          "#e1306c"
        ),

      caption:
        "A beautiful day ✨",

      likes: 128,

      liked: false,

      comments: [
        ["alex", "Love this!"]
      ]
    },


    {
      id: 2,

      user: "alex",

      avatar:
        svgAvatar(
          "alex",
          "#1877f2"
        ),

      image:
        svgPhoto(
          "Picly",
          "#1877f2",
          "#7b2cff"
        ),

      caption:
        "Welcome to my new social space 🚀",

      likes: 64,

      liked: false,

      comments: []

    },


    {
      id: 3,

      user: "rohan",

      avatar:
        svgAvatar(
          "rohan",
          "#7b2cff"
        ),

      image:
        svgPhoto(
          "Explore",
          "#00a884",
          "#1877f2"
        ),

      caption:
        "Keep exploring.",

      likes: 41,

      liked: false,

      comments: []

    }

  ];


function save() {

  localStorage.setItem(
    "piclyPostsV2",
    JSON.stringify(posts)
  );

}


function renderStories() {

  document.querySelector("#stories").innerHTML =

    people.map(
      ([name, color]) => `

        <div class="story">

          <div class="story-ring">

            <img
              src="${svgAvatar(name, color)}"
              alt="${name}"
            >

          </div>

          ${name}

        </div>

      `
    ).join("");

}


function render(list = posts) {

  const feed =
    document.querySelector("#feed");


  if (!list.length) {

    feed.innerHTML =
      '<div class="empty">No posts found.</div>';

    return;

  }


  feed.innerHTML =

    list.map(
      p => `

      <article class="post">

        <div class="post-head">

          <img
            src="${p.avatar}"
            alt="${esc(p.user)}"
          >

          <div>

            <div class="user">
              @${esc(p.user)}
            </div>

            <div class="time">
              Just now
            </div>

          </div>

          <div class="more">
            •••
          </div>

        </div>


        <img
          class="post-image"
          src="${p.image}"
          alt="Post by ${esc(p.user)}"
        >


        <div class="actions">

          <button
            class="action like-btn ${p.liked ? "liked" : ""}"
            onclick="toggleLike(${p.id})">

            ${p.liked ? "♥" : "♡"}

          </button>


          <button class="action">
            ◯
          </button>


          <button class="action">
            ↗
          </button>


          <button class="action save">
            ⌑
          </button>

        </div>


        <div class="caption">

          <b>
            ${p.likes} likes
          </b>

          <br>

          <b>
            ${esc(p.user)}
          </b>

          ${esc(p.caption)}

        </div>


        ${

          p.comments.map(
            c => `

              <div class="comment">

                <b>
                  ${esc(c[0])}
                </b>

                ${esc(c[1])}

              </div>

            `
          ).join("")

        }


        <form
          class="comment-form"
          onsubmit="comment(event, ${p.id})">

          <input
            name="text"
            placeholder="Add a comment..."
          >

          <button>
            Post
          </button>

        </form>

      </article>

      `
    ).join("");

}


function toggleLike(id) {

  const p =
    posts.find(
      x => x.id === id
    );

  if (!p) return;

  p.liked = !p.liked;

  p.likes +=
    p.liked ? 1 : -1;

  save();

  render();

}


function comment(event, id) {

  event.preventDefault();

  const text =
    event.target.text.value.trim();

  if (!text) return;

  const p =
    posts.find(
      x => x.id === id
    );

  p.comments.push([
    "alex",
    text
  ]);

  event.target.reset();

  save();

  render();

}


function esc(value) {

  return String(value)
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


/* CREATE POST */

const modal =
  document.querySelector("#postModal");


document.querySelector(
  "#newPostBtn"
).onclick = () => {

  modal.classList.remove(
    "hidden"
  );

};


document.querySelector(
  "#closeModal"
).onclick = () => {

  modal.classList.add(
    "hidden"
  );

};


document.querySelector(
  "#publishPost"
).onclick = () => {

  const url =
    document
      .querySelector("#imageUrl")
      .value
      .trim();


  const caption =
    document
      .querySelector("#caption")
      .value
      .trim();


  if (!url) {

    alert(
      "Image URL डालो"
    );

    return;

  }


  posts.unshift({

    id: Date.now(),

    user: "alex",

    avatar:
      svgAvatar(
        "alex",
        "#1877f2"
      ),

    image: url,

    caption: caption,

    likes: 0,

    liked: false,

    comments: []

  });


  save();

  render();


  document.querySelector(
    "#imageUrl"
  ).value = "";


  document.querySelector(
    "#caption"
  ).value = "";


  modal.classList.add(
    "hidden"
  );

};


/* SEARCH */

document.querySelector(
  "#search"
).addEventListener(
  "input",

  event => {

    const q =
      event.target.value
        .toLowerCase()
        .trim();


    render(

      posts.filter(
        p =>
          p.user
            .toLowerCase()
            .includes(q)

          ||

          p.caption
            .toLowerCase()
            .includes(q)
      )

    );

  }

);


/* START */

renderStories();

render();

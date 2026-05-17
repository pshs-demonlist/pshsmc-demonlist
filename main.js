// =====================
// LEVEL DATA (YOUR LIST)
// =====================
let levels = [
  {
    id: "10565740",
    rank: 1,
    name: "Bloodbath",
    creator: "Riot",
    diff: "Extreme Demon",
    points: "23.99",
    img: "https://imgs.search.brave.com/gJcG9ytvcds1WzdN8s9TDTbHLl_ekyNXQi0Js1cLeOU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJjYXZlLmNv/bS93cC93cDg5MjYy/MzguanBn",
    video: "https://www.youtube.com/embed/vBBZvXb0HrA",
    victorList: ["sadboi202"]
  },
  {
    id: "3979721",
    rank: 2,
    name: "Cataclysm",
    creator: "GGboy",
    diff: "Extreme Demon",
    points: "20.92",
    img: "https://imgs.search.brave.com/-vFfJIGvVNXC5rExLrSOXTPZocbLokvI_mZ61Upsvwg/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9wcmV2/aWV3LnJlZGQuaXQv...",
    video: "https://www.youtube.com/embed/8x0gpGutHUE",
    victorList: ["sadboi202"]
  },
  {
    id: "7054561",
    rank: 3,
    name: "Poltergeist",
    creator: "AndromedaGMD",
    diff: "Insane Demon",
    points: "15.94",
    img: "https://imgs.search.brave.com/wo2x-tFACCKqQaCVVDEZxP1jQ0GAbe-9vBDrpU4SClE/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9wcmV2/aWV3LnJlZGQuaXQv...",
    video: "https://www.youtube.com/embed/N05ijX3vz9U",
    victorList: ["sadboi202"]
  },
  {
    id: "4284013",
    rank: 4,
    name: "Nine Circles",
    creator: "Zobros",
    diff: "Hard Demon",
    points: "11.16",
    img: "https://imgs.search.brave.com/MPJ9w0-ZTvqphSCuEYGqWFUlxPma3WAO-8g-2kzsz4A/rs:fit:0:180:1:0/g:ce/aHR0cHM6Ly9nZW9t/ZXRyeWdhbWVzLmlvL...",
    video: "https://www.youtube.com/embed/DO36t7DV0ec",
    victorList: ["sadboi202"]
  },
  {
    id: "6939821",
    rank: 5,
    name: "Jawbreaker",
    creator: "ZenthicAlpha",
    diff: "Hard Demon",
    points: "11.14",
    img: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/67e586e5-84fe-470b-8370-76d46f576993/dm2ccbv-2d707292-274d-4479-82b2-11343a1e9418.png/v1/fill/w_1192,h_670,q_70,strp/image_20260517_205859_993_by_pshsdemonlist_dm2ccbv-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NzIwIiwicGF0aCI6Ii9mLzY3ZTU4NmU1LTg0ZmUtNDcwYi04MzcwLTc2ZDQ2ZjU3Njk5My9kbTJjY2J2LTJkNzA3MjkyLTI3NGQtNDQ3OS04MmIyLTExMzQzYTFlOTQxOC5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.-RKHD4zpxeLljEsGQurGlfCXO5Z6Q5tqGbUUgxZL76s",
    video: "https://drive.google.com/file/d/1HYy3aCN4TvQTkoid7fDHAD12guzGlRBe/preview",
    victorList: ["daBlooKat121"]
  },
  {
    id: "111205474",
    rank: 6,
    name: "Thermal Madness",
    creator: "ManiacDan",
    diff: "Hard Demon",
    points: "8.01",
    img: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/67e586e5-84fe-470b-8370-76d46f576993/dm2cc3f-f7e96abd-b14b-4511-909a-9d455fb66b0d.png/v1/fill/w_1192,h_670,q_70,strp/image_20260517_212140_983_by_pshsdemonlist_dm2cc3f-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NzIwIiwicGF0aCI6Ii9mLzY3ZTU4NmU1LTg0ZmUtNDcwYi04MzcwLTc2ZDQ2ZjU3Njk5My9kbTJjYzNmLWY3ZTk2YWJkLWIxNGItNDUxMS05MDlhLTlkNDU1ZmI2NmIwZC5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.y6FKibT2J4HwSyMiKV30LYXig6UaLIl4ZldMLBrGM6c",
    video: "",
    victorList: ["daBlooKat121"]
  },
  {
    id: "7",
    rank: 7,
    name: "Solar Circles",
    creator: "D4rkGryf",
    diff: "Medium Demon",
    points: "5.91",
    img: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/67e586e5-84fe-470b-8370-76d46f576993/dm2cc81-27a16257-16cb-4af8-afb3-6c68cb88155d.png/v1/fill/w_1192,h_670,q_70,strp/image_20260517_211025_584_by_pshsdemonlist_dm2cc81-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NzIwIiwicGF0aCI6Ii9mLzY3ZTU4NmU1LTg0ZmUtNDcwYi04MzcwLTc2ZDQ2ZjU3Njk5My9kbTJjYzgxLTI3YTE2MjU3LTE2Y2ItNGFmOC1hZmIzLTZjNjhjYjg4MTU1ZC5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.1C6q5yD2QMG6WBSfRmtVXIohWpL4B6GcSNQLY11qGy8",
    video: "https://drive.google.com/file/d/1IBfQPdzNedlEc2r_9eF2PjP-yuToTvYZ/preview",
    victorList: ["daBlooKat121"]
  }
];

// =====================
// DOM
// =====================
const listEl = document.getElementById("list");
const searchEl = document.getElementById("search");

// =====================
// UTIL
// =====================
function escapeHTML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function makeThumb(title) {
  return `data:image/svg+xml;charset=UTF-8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
      <rect width="640" height="360" fill="#1a1a2e"/>
      <text x="50%" y="50%" text-anchor="middle" font-size="40" fill="white">
        ${title}
      </text>
    </svg>
  `);
}

// =====================
// RENDER LIST
// =====================
function renderList(filter = "") {
  const q = filter.toLowerCase();

  const filtered = levels.filter(l =>
    l.name.toLowerCase().includes(q) ||
    l.creator.toLowerCase().includes(q) ||
    l.diff.toLowerCase().includes(q)
  );

  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty">No demons found.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(l => `
    <div class="row" onclick="openLevel('${l.id}')">
      <div class="rank">#${l.rank}</div>

      <div class="thumb">
        <img src="${l.img || makeThumb(l.name)}" />
      </div>

      <div class="info">
        <div class="title">${escapeHTML(l.name)}</div>
        <div class="sub">by ${escapeHTML(l.creator)}</div>
        <div class="points">${l.points} pts • ${l.diff}</div>
      </div>
    </div>
  `).join("");
}

// =====================
// OPEN LEVEL
// =====================
function openLevel(id) {
  const level = levels.find(l => l.id === id);
  if (!level) return;

  const video = level.video
    ? `<iframe width="100%" height="315" src="${level.video}" frameborder="0" allowfullscreen></iframe>`
    : "No video";

  const victorList = level.victorList?.length
    ? level.victorList.join(", ")
    : "None";

  document.body.innerHTML = `
    <div style="padding:20px;font-family:Arial;background:#0b0d12;color:white;">
      <button onclick="location.reload()" style="margin-bottom:20px;padding:10px;">
        ← Back
      </button>

      <h1>#${level.rank} ${level.name}</h1>
      <p><b>Creator:</b> ${level.creator}</p>
      <p><b>Difficulty:</b> ${level.diff}</p>
      <p><b>Points:</b> ${level.points}</p>

      <h3>Victors</h3>
      <p>${victorList}</p>

      <h3>Preview</h3>
      ${video}
    </div>
  `;
}

// =====================
// SEARCH
// =====================
searchEl.addEventListener("input", e => {
  renderList(e.target.value);
});

// =====================
// INIT
// =====================
renderList();

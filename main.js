// main.js
const LEVELS_FILE = "levels.json";
const PENDING_FILE = "pending.json";

// Local cache
let levels = [];
let pending = [];
let isAdmin = false; // You can toggle this for admin view

// DOM elements
const listEl = document.getElementById("list");
const queueEl = document.getElementById("queue");
const searchEl = document.getElementById("search");
const submissionTypeEl = document.getElementById("submissionType");
const newLevelFields = document.getElementById("newLevelFields");
const existingLevelWrap = document.getElementById("existingLevelWrap");
const existingLevelEl = document.getElementById("existingLevel");
const adminStatus = document.getElementById("adminStatus");

// Escape HTML to prevent XSS
function escapeHTML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Create a quick SVG thumbnail if no image
function makeThumb(title, accent = "#ff4b4b") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
    <rect width="640" height="360" fill="${accent}"/>
    <text x="50%" y="50%" text-anchor="middle" font-size="40" fill="#fff">${escapeHTML(title)}</text>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// Load JSON from GitHub Pages
async function loadJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// Save JSON (needs GitHub Actions webhook or similar to work online)
async function saveJSON(file, data) {
  try {
    await fetch(`/api/update-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file, data })
    });
  } catch (err) {
    console.error("Failed saving JSON:", err);
  }
}

// Initialize site
async function init() {
  levels = await loadJSON(LEVELS_FILE);
  pending = await loadJSON(PENDING_FILE);
  renderAll();
  populateLevelSelect();
}

// Render both list and queue
function renderAll() {
  renderList();
  renderQueue();
}

// Render demon list
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
      <div class="thumb"><img src="${l.img || makeThumb(l.name)}" /></div>
      <div class="info">
        <div class="title">${escapeHTML(l.name)}</div>
        <div class="sub">by ${escapeHTML(l.creator)}</div>
        <div class="points">${escapeHTML(l.points)} points • ${escapeHTML(l.diff)}</div>
      </div>
    </div>
  `).join("");
}

// Render submission queue (admin only)
function renderQueue() {
  if (!isAdmin) {
    queueEl.innerHTML = "<div class='empty'>Queue hidden. Admin only.</div>";
    return;
  }

  if (!pending.length) {
    queueEl.innerHTML = `<div class="empty">No submissions waiting.</div>`;
    return;
  }

  queueEl.innerHTML = pending.map(item => `
    <div class="queue-item">
      <strong>${escapeHTML(item.type)} submission by ${escapeHTML(item.username)}</strong><br>
      Level: ${escapeHTML(item.levelName || item.newLevel?.name || "N/A")}<br>
      Record: ${escapeHTML(item.recordLink || "N/A")}<br>
      Raw footage: ${escapeHTML(item.rawFootage || "N/A")}
    </div>
  `).join("");
}

// Populate existing level dropdown
function populateLevelSelect() {
  existingLevelEl.innerHTML = levels.map(l =>
    `<option value="${l.id}">#${l.rank} - ${escapeHTML(l.name)}</option>`
  ).join("");
}

// Submit new record or level
async function submitForm() {
  const type = submissionTypeEl.value;
  const username = document.getElementById("username").value.trim();
  const recordLink = document.getElementById("recordLink").value.trim();
  const rawFootage = document.getElementById("rawFootage").value.trim();

  if (!username || !recordLink || !rawFootage) {
    alert("Fill username, record link, and raw footage.");
    return;
  }

  const item = {
    id: String(Date.now()) + Math.random().toString(16).slice(2),
    type,
    username,
    recordLink,
    rawFootage,
    status: "pending"
  };

  if (type === "record") {
    const levelId = existingLevelEl.value;
    const level = levels.find(l => l.id === levelId);
    if (!level) { alert("Pick a level."); return; }
    item.levelRank = level.rank;
    item.levelName = level.name;
    item.levelId = level.id;
  } else {
    item.newLevel = {
      name: document.getElementById("newName").value.trim(),
      creator: document.getElementById("newCreator").value.trim(),
      id: document.getElementById("newLevelId").value.trim(),
      diff: document.getElementById("newDiff").value.trim(),
      points: document.getElementById("newPoints").value.trim() || "0",
      img: document.getElementById("newImg").value.trim() || "",
      video: document.getElementById("newVideo").value.trim() || ""
    };
  }

  pending.unshift(item);
  renderQueue();
  await saveJSON(PENDING_FILE, pending);

  alert("Submission sent for review!");
  document.querySelectorAll("#username, #recordLink, #rawFootage, #newName, #newCreator, #newLevelId, #newDiff, #newPoints, #newImg, #newVideo").forEach(i => i.value = "");
}

// Event listeners
submissionTypeEl.addEventListener("change", () => {
  const isNew = submissionTypeEl.value === "newLevel";
  newLevelFields.style.display = isNew ? "block" : "none";
  existingLevelWrap.style.display = isNew ? "none" : "block";
});

document.getElementById("submitBtn").addEventListener("click", submitForm);
searchEl.addEventListener("input", e => renderList(e.target.value));

// Level detail page
function openLevel(id) {
  const level = levels.find(l => l.id === id);
  if (!level) return alert("Level not found.");
  localStorage.setItem("currentLevel", JSON.stringify(level));
  window.location.href = "level.html";
}

// Initialize everything
init();

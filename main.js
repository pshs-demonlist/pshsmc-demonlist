const OWNER = "pshs-demonlist";
const REPO = "pshsmc-demonlist";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwxGtZwY3YaFOXzXY8VfOMUqdGLJAvqfz1MlzeoPrURL9Ah287qOeeOmdmQv_THoVqxfw/exec";

/* =====================
   DOM
===================== */
const listEl = document.getElementById("list");
const listPage = document.getElementById("listPage");
const detailPage = document.getElementById("detailPage");
const searchEl = document.getElementById("search");
const queueEl = document.getElementById("queue");
const submissionTypeEl = document.getElementById("submissionType");
const newLevelFields = document.getElementById("newLevelFields");
const existingLevelWrap = document.getElementById("existingLevelWrap");
const existingLevelEl = document.getElementById("existingLevel");

/* =====================
   DATA
===================== */
let levels = [];
let pending = [];

/* =====================
   POINTS SYSTEM
===================== */
function getPoints(rank) {
  const n = Number(rank);
  if (!Number.isFinite(n) || n < 1) return 0;

  const max = 350;
  const min = 18.7;
  const decay = 0.0185;

  return Math.max(
    min,
    +(min + (max - min) * Math.exp(-decay * (n - 1))).toFixed(2)
  );
}

/* =====================
   HELPERS
===================== */
function escapeHTML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function victorText(list) {
  return Array.isArray(list) && list.length ? list.join(", ") : "N/A";
}

function normalizeVideo(url) {
  const s = String(url || "").trim();
  if (!s) return "";

  if (s.includes("drive.google.com/file/d/")) {
    const match = s.match(/\/file\/d\/([^/]+)/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  }

  if (s.includes("/embed/")) return s;

  const watchMatch = s.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

  return s;
}

function makeThumb(title, accent = "#ff4b4b", accent2 = "#111522") {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="${accent2}"/>
        <stop offset="100%" stop-color="${accent}"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#g)"/>
    <text x="50%" y="52%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="#ffffff">${escapeHTML(title)}</text>
    <text x="50%" y="65%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#dce4f5">PSHS-MC Demonlist</text>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

async function loadJSON(path, fallback = []) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return fallback;
    const data = await res.json();
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

/* =====================
   LIST RENDER
===================== */
function populateLevelSelect() {
  existingLevelEl.innerHTML = levels
    .map(
      (d) =>
        `<option value="${escapeHTML(String(d.id))}">#${escapeHTML(
          String(d.rank)
        )} - ${escapeHTML(d.name)}</option>`
    )
    .join("");
}

function renderList(filter = "") {
  const q = filter.toLowerCase().trim();

  const filtered = levels.filter((d) => {
    const victors = victorText(d.victorList).toLowerCase();
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.creator || "").toLowerCase().includes(q) ||
      (d.diff || "").toLowerCase().includes(q) ||
      victors.includes(q)
    );
  });

  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty">No demons found.</div>`;
    return;
  }

  listEl.innerHTML = filtered
    .map(
      (d) => `
    <div class="row" onclick="openLevel('${escapeHTML(String(d.id))}')">
      <div class="rank">#${escapeHTML(String(d.rank))}</div>
      <div class="thumb">
        <img src="${escapeHTML(d.img || makeThumb(d.name || "Level"))}" alt="${escapeHTML(d.name)}" />
      </div>
      <div class="info">
        <div class="title">${escapeHTML(d.name)}</div>
        <div class="sub">published by ${escapeHTML(d.creator)}</div>
        <div class="sub">Victor List: ${escapeHTML(victorText(d.victorList))}</div>
        <div class="points">${getPoints(d.rank)} points • ${escapeHTML(d.diff)}</div>
        <div class="badge">ID ${escapeHTML(d.id)}</div>
      </div>
    </div>
  `
    )
    .join("");
}

/* =====================
   LEVEL VIEW
===================== */
function openLevel(id) {
  const d = levels.find((x) => String(x.id) === String(id));
  if (!d) return;

  listPage.style.display = "none";
  detailPage.style.display = "block";

  document.getElementById("dTitle").textContent = `#${d.rank} – ${d.name}`;
  document.getElementById("dInfo").textContent = `published by ${d.creator} • ID ${d.id}`;

  const video = normalizeVideo(d.video);
  document.getElementById("video").innerHTML = video
    ? `<iframe src="${video}" allowfullscreen></iframe>`
    : `<div class="no-video">No video linked yet.</div>`;

  document.getElementById("stats").innerHTML = `
    <div class="stat">Difficulty: ${escapeHTML(d.diff)}</div>
    <div class="stat">Points: ${getPoints(d.rank)}</div>
    <div class="stat">Victor List: ${escapeHTML(victorText(d.victorList))}</div>
  `;
}

function back() {
  detailPage.style.display = "none";
  listPage.style.display = "block";
}

/* =====================
   QUEUE
===================== */
function renderQueue() {
  if (!pending.length) {
    queueEl.innerHTML = `<div class="empty">No submissions waiting.</div>`;
    return;
  }

  queueEl.innerHTML = pending
    .map(
      (item) => `
      <div class="queue-item">
        <div class="queue-top">
          <div>
            <div class="queue-title">
              ${item.type === "newLevel"
                ? `New level proposal: ${escapeHTML(item.newLevel?.name || item.newName || "Unnamed")}`
                : `Record submission for: ${escapeHTML(item.levelName || "Unknown")}`}
            </div>
            <div class="queue-meta">
              type: ${escapeHTML(item.type)} • submitted by ${escapeHTML(item.username)} • status: <strong>${escapeHTML(item.status || "pending")}</strong>
            </div>
          </div>
          <div class="badge">${escapeHTML(item.type)}</div>
        </div>

        <div class="queue-meta" style="margin-top:8px;">
          record: ${escapeHTML(item.recordLink || "none")}<br/>
          raw footage: ${escapeHTML(item.rawFootage || "none")}<br/>
          notes: ${escapeHTML(item.notes || "none")}
        </div>

        ${
          item.type === "newLevel"
            ? `
          <div class="queue-meta" style="margin-top:8px;">
            creator: ${escapeHTML(item.newLevel?.creator || item.newCreator || "")} • ID: ${escapeHTML(item.newLevel?.id || item.newLevelId || "")} • diff: ${escapeHTML(item.newLevel?.diff || item.newDiff || "")} • points: ${escapeHTML(item.newLevel?.points || item.newPoints || "")}
          </div>
        `
            : `
          <div class="queue-meta" style="margin-top:8px;">
            will add to Victor List on approval: ${escapeHTML(item.username)}
          </div>
        `
        }
      </div>
    `
    )
    .join("");
}

/* =====================
   SUBMISSION SYSTEM
===================== */
function buildPayload(type) {
  const username = document.getElementById("username").value.trim();
  const recordLink = document.getElementById("recordLink").value.trim();
  const rawFootage = document.getElementById("rawFootage").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if (!username || !recordLink || !rawFootage) {
    alert("Fill required fields");
    return null;
  }

  if (type === "record") {
    const level = levels.find((x) => String(x.id) === String(existingLevelEl.value));
    if (!level) {
      alert("Pick a level first.");
      return null;
    }

    return {
      type: "record",
      username,
      recordLink,
      rawFootage,
      notes,
      levelName: level.name,
      id: level.id,
      creator: level.creator
    };
  }

  const newName = document.getElementById("newName").value.trim();
  const newCreator = document.getElementById("newCreator").value.trim();
  const newLevelId = document.getElementById("newLevelId").value.trim();
  const newDiff = document.getElementById("newDiff").value.trim();
  const newPoints = document.getElementById("newPoints").value.trim();
  const newImg = document.getElementById("newImg").value.trim();
  const newVideo = document.getElementById("newVideo").value.trim();

  if (!newName || !newCreator || !newLevelId || !newDiff) {
    alert("Fill level details");
    return null;
  }

  return {
    type: "newLevel",
    username,
    recordLink,
    rawFootage,
    notes,
    newName,
    newCreator,
    newLevelId,
    newDiff,
    newPoints,
    newImg,
    newVideo
  };
}

async function submitToSheet(payload) {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Sheet submit failed:", e);
  }
}

function openBackupGitHub(payload) {
  const title =
    payload.type === "record"
      ? `Record: ${payload.username}`
      : `New Level: ${payload.newName}`;

  const body = JSON.stringify(payload, null, 2);

  const url =
    `https://github.com/${OWNER}/${REPO}/issues/new` +
    `?title=${encodeURIComponent(title)}` +
    `&body=${encodeURIComponent(body)}` +
    `&labels=submission`;

  window.open(url, "_blank", "noopener,noreferrer");
}

async function submitForm() {
  const type = submissionTypeEl.value;
  const payload = buildPayload(type);
  if (!payload) return;

  await submitToSheet(payload);
  openBackupGitHub(payload);

  document.querySelectorAll("input").forEach((i) => (i.value = ""));
  alert("Submitted!");
}

/* =====================
   EVENTS
===================== */
submissionTypeEl.addEventListener("change", () => {
  const isNew = submissionTypeEl.value === "newLevel";
  newLevelFields.style.display = isNew ? "block" : "none";
  existingLevelWrap.style.display = isNew ? "none" : "block";
});

document.getElementById("submitBtn").addEventListener("click", submitForm);
searchEl.addEventListener("input", (e) => renderList(e.target.value));

/* =====================
   INIT
===================== */
async function init() {
  levels = await loadJSON("./levels.json", []);
  pending = await loadJSON("./pending.json", []);

  levels = levels.map((d, i) => ({
    rank: Number(d.rank ?? i + 1),
    name: d.name ?? "Unnamed",
    creator: d.creator ?? "Unknown",
    id: String(d.id ?? i),
    diff: d.diff ?? "Unknown",
    img: d.img ?? "",
    video: d.video ?? "",
    victorList: Array.isArray(d.victorList) ? d.victorList : []
  }));

  populateLevelSelect();
  renderList("");
  renderQueue();
}

window.openLevel = openLevel;
window.back = back;
window.addEventListener("load", init);

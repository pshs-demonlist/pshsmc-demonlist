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
  rank = Number(rank);
  if (!rank || rank < 1) return 0;

  const max = 350;
  const min = 18.7;
  const decay = 0.0185;

  return Math.max(
    min,
    +(min + (max - min) * Math.exp(-decay * (rank - 1))).toFixed(2)
  );
}

/* =====================
   HELPERS
===================== */
function escapeHTML(str){
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function victorText(list){
  return Array.isArray(list) && list.length ? list.join(", ") : "N/A";
}

async function loadJSON(path, fallback = []){
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
function renderList(filter = ""){
  const q = filter.toLowerCase();

  const filtered = levels.filter(d =>
    (d.name || "").toLowerCase().includes(q) ||
    (d.creator || "").toLowerCase().includes(q) ||
    (d.diff || "").toLowerCase().includes(q)
  );

  if (!filtered.length) {
    listEl.innerHTML = `<div class="empty">No demons found.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(d => `
    <div class="row" onclick="openLevel('${d.id}')">
      <div class="rank">#${d.rank}</div>

      <div class="thumb">
        <img src="${escapeHTML(d.img)}" alt="${escapeHTML(d.name)}"/>
      </div>

      <div class="info">
        <div class="title">${escapeHTML(d.name)}</div>
        <div class="sub">published by ${escapeHTML(d.creator)}</div>
        <div class="sub">Victor List: ${escapeHTML(victorText(d.victorList))}</div>

        <div class="points">
          ${getPoints(d.rank)} points • ${escapeHTML(d.diff)}
        </div>

        <div class="badge">ID ${escapeHTML(d.id)}</div>
      </div>
    </div>
  `).join("");
}

/* =====================
   LEVEL VIEW
===================== */
function openLevel(id){
  const d = levels.find(x => String(x.id) === String(id));
  if (!d) return;

  listPage.style.display = "none";
  detailPage.style.display = "block";

  document.getElementById("dTitle").textContent = `#${d.rank} – ${d.name}`;
  document.getElementById("dInfo").textContent =
    `published by ${d.creator} • ID ${d.id}`;

  document.getElementById("stats").innerHTML = `
    <div class="stat">Difficulty: ${escapeHTML(d.diff)}</div>
    <div class="stat">Points: ${getPoints(d.rank)}</div>
    <div class="stat">Victor List: ${escapeHTML(victorText(d.victorList))}</div>
  `;
}

function back(){
  detailPage.style.display = "none";
  listPage.style.display = "block";
}

/* =====================
   QUEUE
===================== */
function renderQueue(){
  if (!pending.length) {
    queueEl.innerHTML = `<div class="empty">No submissions waiting.</div>`;
    return;
  }

  queueEl.innerHTML = pending.map(item => `
    <div class="queue-item">
      <div class="queue-title">${item.type}</div>
      <div class="queue-meta">
        ${item.username} • ${item.status || "pending"}
      </div>
    </div>
  `).join("");
}

/* =====================
   SUBMISSION SYSTEM
===================== */
function buildPayload(type){
  const username = document.getElementById("username").value.trim();
  const recordLink = document.getElementById("recordLink").value.trim();
  const rawFootage = document.getElementById("rawFootage").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if (!username || !recordLink || !rawFootage) {
    alert("Fill required fields");
    return null;
  }

  if (type === "record") {
    const level = levels.find(x => String(x.id) === String(existingLevelEl.value));
    if (!level) return null;

    return {
      type,
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

  if (!newName || !newCreator || !newLevelId || !newDiff) {
    alert("Fill level details");
    return null;
  }

  return {
    type,
    username,
    recordLink,
    rawFootage,
    notes,
    newName,
    newCreator,
    newLevelId,
    newDiff
  };
}

async function submitForm(){
  const type = submissionTypeEl.value;
  const payload = buildPayload(type);
  if (!payload) return;

  // send to google sheet
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error(e);
  }

  // github backup
  const url =
    `https://github.com/${OWNER}/${REPO}/issues/new` +
    `?title=${encodeURIComponent("Submission")}` +
    `&body=${encodeURIComponent(JSON.stringify(payload, null, 2))}`;

  window.open(url, "_blank");

  document.querySelectorAll("input").forEach(i => i.value = "");
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

searchEl.addEventListener("input", e => renderList(e.target.value));

/* =====================
   INIT
===================== */
async function init(){
  levels = await loadJSON("./levels.json", []);
  pending = await loadJSON("./pending.json", []);

  levels = levels.map((d, i) => ({
    rank: Number(d.rank ?? i + 1),
    name: d.name ?? "Unnamed",
    creator: d.creator ?? "Unknown",
    id: String(d.id ?? i),
    diff: d.diff ?? "Unknown",
    img: d.img ?? "",
    victorList: Array.isArray(d.victorList) ? d.victorList : []
  }));

  renderList("");
  renderQueue();
}

window.openLevel = openLevel;
window.back = back;
window.addEventListener("load", init);

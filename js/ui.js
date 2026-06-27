// js/ui.js
import { escapeHTML, calculateLevelPoints, getNormalizedListType, getRecordList } from './utils.js';
import { CONFIG } from './config.js';
import { submitRecordData } from './api.js';

export const uiState = {
  allLevels: [],
  currentMainTab: 'demon',
  currentStatsTab: 'demon'
};

// --- NAVIGATION & CORE UI ---
export function toggleNavMenu() {
  const menu = document.getElementById("navMenu");
  if (menu) menu.classList.toggle("open");
}

export function closeNavMenu() {
  const menu = document.getElementById("navMenu");
  if (menu) menu.classList.remove("open");
}

export function switchPage(pageId) {
  closeNavMenu();
  const mainVid = document.getElementById('video');
  const playerVid = document.getElementById('pvVideo');
  if (mainVid) mainVid.innerHTML = '';
  if (playerVid) playerVid.innerHTML = '';

  const corePages = ['landingPage', 'levelsPage', 'statsPage', 'detailPage', 'playerVideoPage'];
  corePages.forEach(id => {
    const pageEl = document.getElementById(id);
    if (pageEl) {
      pageEl.style.display = 'none';
      pageEl.classList.remove('active-page');
    }
  });

  const targetPage = document.getElementById(pageId + 'Page');
  if (targetPage) {
    targetPage.style.display = 'block';
    targetPage.classList.add('active-page');
    window.scrollTo({
       top: 0, 
       behavior: "auto"
    });
  }
}

export function goToLevelsDashboard() {
  switchPage('levels');
  const sBox = document.getElementById('submissionBox');
  if (sBox) sBox.style.display = 'block';
  renderLevelsDashboard();
}

export function goToSubmissionBox() {
  switchPage('levels');
  setTimeout(() => {
    const sBox = document.getElementById('submissionBox');
    if (sBox) sBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 80);
}

export function openGuidelinesModal() {
  closeNavMenu();
  const modal = document.getElementById("guidelinesModal");
  if (modal) modal.style.display = "flex";
}

export function closeGuidelinesModal() {
  const modal = document.getElementById("guidelinesModal");
  if (modal) modal.style.display = "none";
}

export function updateThemeToggleText() {
  const toggleButton = document.getElementById('themeToggle');
  if (!toggleButton) return;

  toggleButton.textContent =
    document.body.classList.contains('light-theme')
      ? 'Toggle Dark Mode'
      : 'Toggle Light Mode';
}

export function toggleThemeMode() {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  localStorage.setItem('pshsmc_theme', isLight ? 'light' : 'dark');
  updateThemeToggleText();
  closeNavMenu();
}

export function displayFallbackUIMessage(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = `<div style="color:var(--accent); text-align:center; padding:20px; font-size:13px;">${message}</div>`;
}

// --- METRICS & FILTERS ---
export function clearUIFieldsToZero() {
  ['heroCountLevels', 'heroCountPlayers', 'heroCountRecords'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "0";
  });
}

export function calculateCounterMetrics() {
  let uniquePlayers = new Set();
  let totalRecordsCount = 0;
  uiState.allLevels.forEach(lvl => {
    getRecordList(lvl).forEach(rec => {
      const name = escapeHTML(String(rec.username || rec.name || rec.player || rec.user || '').trim());
      if (name) uniquePlayers.add(name);
      totalRecordsCount++;
    });
  });
  const lvlEl = document.getElementById('heroCountLevels');
  const playEl = document.getElementById('heroCountPlayers');
  const recEl = document.getElementById('heroCountRecords');
  if (lvlEl) lvlEl.textContent = uiState.allLevels.length;
  if (playEl) playEl.textContent = uniquePlayers.size;
  if (recEl) recEl.textContent = totalRecordsCount;
}

export function populateCampusDropdownFilters() {
  let campuses = new Set();
  uiState.allLevels.forEach(lvl => {
    if (lvl.campus) campuses.add(escapeHTML(String(lvl.campus).trim()));
    getRecordList(lvl).forEach(rec => { if (rec.campus) campuses.add(escapeHTML(String(rec.campus).trim())); });
  });
  const sorted = Array.from(campuses).sort();
  const optionsStr = '<option value="ALL">All Campuses</option>' + sorted.map(c => `<option value="${c}">${c}</option>`).join('');
  const dFilter = document.getElementById("dashboardCampusFilter");
  if (dFilter) dFilter.innerHTML = optionsStr;
  const sFilter = document.getElementById("statsCampusFilter");
  if (sFilter) sFilter.innerHTML = optionsStr;
}

// --- NEWS ENGINE ---
export function processLiveDecayFilterAndNews() {
  const feed = document.getElementById('liveChangelogFeed');
  if (!feed) return;

  const now = new Date();
  const targetTodayStr = now.getFullYear() + '-' + 
                         String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(now.getDate()).padStart(2, '0');

  let validNews = [];

  // Helper: Checks if a date string matches today and grabs a timestamp for sorting
  const checkIsToday = (dateStr) => {
    if (!dateStr) return { isToday: false, sortTime: 0 };
    let itemDayStr = "";
    const strMatch = String(dateStr).match(/(\d{4}-\d{2}-\d{2})/);
    
    if (strMatch) {
      itemDayStr = strMatch[1];
    } else {
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) return { isToday: false, sortTime: 0 };
      itemDayStr = parsedDate.getFullYear() + '-' + 
                   String(parsedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(parsedDate.getDate()).padStart(2, '0');
    }
    
    const cleanDateStr = String(dateStr).replace(/[A-Za-z]+$/, '').trim();
    const sortDateObj = new Date(cleanDateStr);
    const sortTimestamp = isNaN(sortDateObj.getTime()) ? Date.now() : sortDateObj.getTime();

    return { isToday: (itemDayStr === targetTodayStr), sortTime: sortTimestamp };
  };

  uiState.allLevels.forEach(lvl => {
    const currentRank = parseInt(lvl.rank || 999, 10);
    const targetName = String(lvl.name || lvl.levelName || "Unnamed Level").trim();
    const listCategory = getNormalizedListType(lvl);
    
    // Sort the current category so we know what levels sit at #76 and #151
    const categorySortedLevels = uiState.allLevels
      .filter(l => getNormalizedListType(l) === listCategory)
      .sort((a, b) => parseInt(a.rank || 999) - parseInt(b.rank || 999));

    // 1. CHECK FOR NEW LEVEL PLACEMENTS
    const levelDateData = checkIsToday(lvl.createdDate || lvl.date || lvl.publishDate || lvl.added || lvl.timestamp);
    
    if (levelDateData.isToday) {
        const indexInSorted = categorySortedLevels.findIndex(item => 
          String(item.name || item.levelName || "Unnamed Level").trim() === targetName
        );
        
        let textHarder = "None"; 
        let textEasier = "None"; 

        if (indexInSorted > 0) {
          const harderLevel = categorySortedLevels[indexInSorted - 1];
          textHarder = escapeHTML(harderLevel.name || harderLevel.levelName || "Unnamed");
        }
        if (indexInSorted !== -1 && indexInSorted < categorySortedLevels.length - 1) {
          const easierLevel = categorySortedLevels[indexInSorted + 1];
          textEasier = escapeHTML(easierLevel.name || easierLevel.levelName || "Unnamed");
        }

        let placementText = `below <strong>${textHarder}</strong> and above <strong>${textEasier}</strong>`;
        if (textHarder === "None" && textEasier === "None") {
          placementText = `as the only level in this category`;
        } else if (textHarder === "None") {
          placementText = `at the very top of the list, above <strong>${textEasier}</strong>`;
        } else if (textEasier === "None") {
          placementText = `below <strong>${textHarder}</strong>, at the bottom of the list`;
        }

        // List Pushing Logic (0-indexed array, so index 75 is rank #76)
        if (currentRank <= 75 && categorySortedLevels.length > 75) {
            const pushedExtended = escapeHTML(categorySortedLevels[75].name || categorySortedLevels[75].levelName || "Unnamed");
            placementText += `, this pushes <strong>${pushedExtended}</strong> into the <strong>Extended List</strong>`;
        } else if (currentRank > 75 && currentRank <= 150 && categorySortedLevels.length > 150) {
            const pushedLegacy = escapeHTML(categorySortedLevels[150].name || categorySortedLevels[150].levelName || "Unnamed");
            placementText += `, this pushes <strong>${pushedLegacy}</strong> into the <strong>Legacy List</strong>`;
        }

        validNews.push({
          type: 'placement',
          title: escapeHTML(targetName),
          rank: currentRank,
          listType: listCategory,
          placementText: placementText,
          sortTime: levelDateData.sortTime 
        });
    }

    // 2. CHECK FOR NEW VICTORS TODAY
    const records = getRecordList(lvl);
    records.forEach(rec => {
        // Look for a date property on the individual record
        const recDateData = checkIsToday(rec.date || rec.timestamp || rec.achieved);
        if (recDateData.isToday) {
            const username = escapeHTML(String(rec.username || rec.name || rec.player || rec.user || "Someone").trim());
            validNews.push({
                type: 'victor',
                title: escapeHTML(targetName),
                listType: listCategory,
                username: username,
                sortTime: recDateData.sortTime
            });
        }
    });
  });

  validNews.sort((a, b) => b.sortTime - a.sortTime);

  if (validNews.length === 0) {
    feed.innerHTML = `<div style="color:#64748b; padding:16px; font-size:12px; text-align:center; font-style:italic;">No changes detected for today (${targetTodayStr}).</div>`;
    return;
  }

  feed.innerHTML = '';
  const container = document.createElement('div');
  container.style.marginBottom = "14px";
  
  const displayDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  let html = `<div style="font-size:11px; color:var(--accent); font-weight:700; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">${displayDate}</div>`;
  
  validNews.forEach(item => {
    let badgeText = 'DEMON LIST';
    let badgeColor = 'var(--accent)';
    if (item.listType === 'challenge') { badgeText = 'CHALLENGE LIST'; badgeColor = '#f59e0b'; }
    else if (item.listType === 'platformer') { badgeText = 'PLATFORMER LIST'; badgeColor = '#3b82f6'; }

    // Differentiate between a New Level Placement vs a New Victor
    let itemDescriptionHtml = '';
    if (item.type === 'placement') {
        itemDescriptionHtml = `Placed at <strong class="news-rank">#${item.rank}</strong>, ${item.placementText}.`;
    } else if (item.type === 'victor') {
        itemDescriptionHtml = `Congratulations to <strong>${item.username}</strong> for beating <strong>${item.title}</strong> today! Huge GGS!`;
    }

    html += `
      <div class="changelog-item">
        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:3px; gap:10px;">
          <span class="changelog-item-title">${item.title}</span>
          <span style="font-size:11px; white-space:nowrap; font-weight:700; color:${badgeColor};">
            ${badgeText}
          </span>
        </div>
        <div class="changelog-item-desc">
          ${itemDescriptionHtml}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  feed.appendChild(container);
}

// --- LEVEL DASHBOARD & TABS ---
export function switchMainListTab(tab) {
  uiState.currentMainTab = tab;
  ['tabDemons', 'tabChallenges', 'tabPlatformers'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  
  let activeId = 'tabDemons';
  if (tab === 'challenge') activeId = 'tabChallenges';
  if (tab === 'platformer') activeId = 'tabPlatformers';
  
  const target = document.getElementById(activeId);
  if (target) target.classList.add('active');
  renderLevelsDashboard();
}

export function renderLevelsDashboard() {
  let list = document.getElementById('list');
  if (!list) return;

  const queryEl = document.getElementById('search');
  const query = queryEl ? escapeHTML(queryEl.value).toLowerCase() : '';
  const campusEl = document.getElementById('dashboardCampusFilter');
  const campusVal = campusEl ? campusEl.value : 'ALL';

  list.innerHTML = '';

  let displayedItems = uiState.allLevels.filter(lvl => {
    if (getNormalizedListType(lvl) !== uiState.currentMainTab) return false;
    const lvlCampus = escapeHTML(String(lvl.campus || 'Main Campus').trim());
    const records = getRecordList(lvl);
    const campusMatch = (campusVal === 'ALL' || lvlCampus === campusVal || records.some(r => escapeHTML(String(r.campus || 'Main Campus').trim()) === campusVal));
    if (!campusMatch) return false;

    return (
      String(lvl.name || lvl.levelName || '').toLowerCase().includes(query) ||
      String(lvl.creator || '').toLowerCase().includes(query) ||
      String(lvl.diff || lvl.difficulty || '').toLowerCase().includes(query)
    );
  });

  displayedItems.sort((a, b) => parseInt(a.rank || 999) - parseInt(b.rank || 999));

  if (displayedItems.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding:24px; opacity:0.5; font-size:13px;">No tier entries match these filtering criteria.</div>';
    return;
  }

  displayedItems.forEach(lvl => {
    const rank = parseInt(lvl.rank || 999, 10);
    const pts = calculateLevelPoints(rank);
    const itemRow = document.createElement('div');
    itemRow.className = 'row';
    itemRow.onclick = () => showLevelDetailPage(lvl, rank);

    let thumb = lvl.img || lvl.thumbnail;
    if (!thumb && lvl.video && lvl.video.includes('embed/')) {
      try { thumb = `https://img.youtube.com/vi/${lvl.video.split('embed/')[1].split('?')[0]}/maxdefault.jpg`; } catch(e) {}
    }
    if (!thumb) thumb = CONFIG.IMAGES.FALLBACK_THUMBNAIL;

    list.appendChild(itemRow);
    itemRow.innerHTML = `
      <div class="rank">#${rank}</div>
      <div class="thumb"><img src="${escapeHTML(thumb)}" onerror="this.onerror=null; this.src='${CONFIG.IMAGES.FALLBACK_THUMBNAIL}'"></div>
      <div class="info">
        <div class="title">${escapeHTML(lvl.name || lvl.levelName || 'Unnamed')} <span class="badge" style="font-size:10px;">${escapeHTML(lvl.diff || lvl.difficulty || 'Demon')}</span></div>
        <div class="sub">By ${escapeHTML(lvl.creator || 'Unknown')} | Verified by ${escapeHTML(lvl.verifier || 'Unknown')}</div>
        <div class="points">${pts.toFixed(2)} Points</div>
        <div class="sub" style="color:var(--accent); font-weight:bold; margin-top:2px; font-size:11px;">Campus: ${escapeHTML(lvl.campus || 'Main Campus')}</div>
      </div>
    `;
  });
}

export function showLevelDetailPage(lvl, forceRank) {
  switchPage('detail');
  const finalRank = forceRank || lvl.rank || 999;
  const records = getRecordList(lvl);

  const t = document.getElementById('dTitle');
  const info = document.getElementById('dInfo');
  const vid = document.getElementById('video');
  const stats = document.getElementById('stats');
  const container = document.getElementById('dRecordsContainer');

  if (t) t.textContent = lvl.name || lvl.levelName || "Unnamed Map";
  if (info) info.innerHTML = `Creator: <strong>${escapeHTML(lvl.creator || 'Unknown')}</strong> | Verifier: <strong>${escapeHTML(lvl.verifier || 'Unknown')}</strong><br>ID Reference: ${escapeHTML(lvl.id || 'N/A')}`;
  if (vid) vid.innerHTML = lvl.video ? `<iframe src="${escapeHTML(lvl.video)}" allowfullscreen style="width:100%; height:100%; border:none; border-radius:6px;"></iframe>` : '<div style="padding:20px; text-align:center; opacity:0.4;">No linked video data.</div>';
  
  if (stats) {
    stats.innerHTML = `
      <div class="stat"><h4>Rank Spectrum</h4><p>#${finalRank}</p></div>
      <div class="stat"><h4>Point Value</h4><p>${calculateLevelPoints(finalRank).toFixed(2)}</p></div>
      <div class="stat"><h4>Total Records</h4><p>${records.length}</p></div>
    `;
  }

  if (container) {
    container.innerHTML = `<h3 style="font-size:14px; margin-top:16px;">Verified Level Victors</h3>`;
    if (records.length === 0) {
      container.innerHTML += '<div style="padding:12px; opacity:0.4; font-size:12px; text-align:center;">No campus data records approved.</div>';
      return;
    }
    const table = document.createElement('table');
    table.className = 'records-table';
    table.style.width = "100%";
    table.innerHTML = `<thead><tr><th style="text-align:left;">Player</th><th style="text-align:left;">Campus</th><th style="text-align:right;">Proof</th></tr></thead><tbody></tbody>`;
    const tbody = table.querySelector('tbody');
    records.forEach(r => {
      const row = document.createElement('tr');
      const name = escapeHTML(String(r.username || r.name || r.player || r.user || '').trim());
      row.innerHTML = `<td>${name} <strong>(${escapeHTML(r.percent || 100)}%)</strong></td><td>${escapeHTML(r.campus || 'Main Campus')}</td><td style="text-align:right;"><a class="proof-btn" href="${escapeHTML(r.video || '#')}" target="_blank" style="font-size:11px; text-decoration:none; color:var(--accent);">Link</a></td>`;
      tbody.appendChild(row);
    });
    container.appendChild(table);
  }
}

// --- STATS & LEADERBOARD ---
export function switchStatsPageListTab(tab) {
  uiState.currentStatsTab = tab;
  ['statTabDemons', 'statTabChallenges', 'statTabPlatformers'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  
  let activeId = 'statTabDemons';
  if (tab === 'challenge') activeId = 'statTabChallenges';
  if (tab === 'platformer') activeId = 'statTabPlatformers';
  
  const target = document.getElementById(activeId);
  if (target) target.classList.add('active');
  renderStatsLeaderboard();
}

export function renderStatsLeaderboard() {
  const targetBody = document.getElementById('leaderboardBody');
  if (!targetBody) return;

  const campusEl = document.getElementById('statsCampusFilter');
  const campusFilter = campusEl ? campusEl.value : 'ALL';
  targetBody.innerHTML = '';
  
  let processedPlayers = {};

  uiState.allLevels.forEach(lvl => {
    const cat = getNormalizedListType(lvl); 
    const rank = parseInt(lvl.rank || 999, 10);
    const records = getRecordList(lvl);

    records.forEach(r => {
      const name = escapeHTML(String(r.username || r.name || r.player || r.user || '').trim());
      if (!name) return;

      const playerCampus = escapeHTML(String(r.campus || 'Main Campus').trim());
      if (campusFilter !== 'ALL' && playerCampus !== campusFilter) return;

      if (!processedPlayers[name]) {
        processedPlayers[name] = { 
          name: name, 
          campus: playerCampus, 
          points: 0, 
          completions: [], 
          demons: 0, 
          challenges: 0,
          platformers: 0
        };
      }

      const pct = parseInt(r.percent || 100, 10);
      const score = calculateLevelPoints(rank) * (pct / 100);

      if (cat === uiState.currentStatsTab) {
        processedPlayers[name].points += score;
      }

      if (pct === 100) {
        if (cat === 'demon') processedPlayers[name].demons++;
        else if (cat === 'challenge') processedPlayers[name].challenges++;
        else if (cat === 'platformer') processedPlayers[name].platformers++;
      }
      
      processedPlayers[name].completions.push({ 
        levelName: escapeHTML(lvl.name || lvl.levelName || 'Unnamed'), 
        rank: rank, 
        category: cat, 
        percent: pct, 
        video: escapeHTML(r.video || '#') 
      });
    });
  });

  let leaderboardData = Object.values(processedPlayers).filter(p => 
    p.completions.some(c => c.category === uiState.currentStatsTab)
  );
  
  leaderboardData.sort((a, b) => b.points - a.points);

  if (leaderboardData.length === 0) {
    targetBody.innerHTML = '<div style="padding:16px; font-size:12px; opacity:0.5; text-align:center;">No records match conditions.</div>';
    return;
  }

  leaderboardData.forEach((player, idx) => {
    const row = document.createElement('div');
    row.className = 'sv-row';
    row.onclick = () => displayPlayerProfile(player, idx);
    
    let subLabel = `${player.demons} Demons`;
    if (uiState.currentStatsTab === 'challenge') subLabel = `${player.challenges} Challenges`;
    if (uiState.currentStatsTab === 'platformer') subLabel = `${player.platformers} Platformers`;

    row.innerHTML = `
      <div class="sv-left">
        <span class="sv-rank">#${idx + 1}</span>
        <span class="sv-name">${player.name} <small style="display:block; opacity:0.4; font-size:10px;">${subLabel}</small></span>
      </div>
      <span class="sv-points" style="font-weight:bold;">${player.points.toFixed(2)} pts</span>
    `;
    targetBody.appendChild(row);
  });

  if (leaderboardData.length > 0) displayPlayerProfile(leaderboardData[0], 0);
}

export function displayPlayerProfile(player, activeIdx) {
  const canvas = document.getElementById('profileContent');
  const startPrompt = document.getElementById('startPrompt');
  if (!canvas) return;
  
  if (startPrompt) startPrompt.style.display = 'none';
  canvas.style.display = 'block';

  let main = [], extended = [], legacy = [];
  
  player.completions
  .filter(c => c.category === uiState.currentStatsTab)
  .forEach(c => {
    if (c.percent < 100) {
      legacy.push(c);
      return;
    }
    if (c.rank <= 75) {
      main.push(c);
    } else if (c.rank <= 150) {
      extended.push(c);
    } else {
      legacy.push(c);
    }
  });

  const buildCloud = (arr, typeClass) => {
    if (arr.length === 0) return '<span style="opacity:0.3; font-size:11px; font-style:italic;">None verified</span>';
    return arr.map(c => `<span class="demon-click ${typeClass}" style="display:inline-block; margin:2px; padding:3px 6px; background:rgba(255,255,255,0.04); border-radius:4px; font-size:11px; cursor:pointer;" onclick="viewPlayerVideo('${c.levelName.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}', '${c.video}')">${c.levelName} (${c.percent}%)</span>`).join(' ');
  };

  let contextHeader = uiState.currentStatsTab.charAt(0).toUpperCase() + uiState.currentStatsTab.slice(1);
  canvas.innerHTML = `
    <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px; margin-bottom:10px;">
      <h3 style="margin:0; font-size:18px;">#${activeIdx + 1} ${player.name}</h3>
      <p style="margin:4px 0; font-size:14px; color:var(--accent); font-weight:bold;">Total Score: ${player.points.toFixed(2)} Points</p>
      <span class="badge" style="background:var(--line); font-size:10px; padding:2px 6px; color:var(--text); display:inline-block; margin-top:3px;">Campus: ${player.campus}</span>
    </div>
    <div>
      <h4 style="margin:8px 0 2px 0; font-size:11px; color:#94a3b8; text-transform:uppercase;">Main ${contextHeader} Completions</h4><div>${buildCloud(main, 'cloud-main')}</div>
      <h4 style="margin:12px 0 2px 0; font-size:11px; color:#94a3b8; text-transform:uppercase;">Extended ${contextHeader} Completions</h4><div>${buildCloud(extended, 'cloud-extended')}</div>
      <h4 style="margin:12px 0 2px 0; font-size:11px; color:#94a3b8; text-transform:uppercase;">Legacy & Progress</h4><div>${buildCloud(legacy, 'cloud-legacy')}</div>
    </div>
  `;
}

export function viewPlayerVideo(lvlName, link) {
  switchPage('playerVideo');
  const title = document.getElementById('pvTitle');
  const targetFrame = document.getElementById('pvVideo');
  if (title) title.textContent = `Record Run: ${lvlName}`;
  if (targetFrame) {
    targetFrame.innerHTML = (link && link !== '#') ? `<iframe src="${link}" allowfullscreen style="width:100%; height:100%; border:none; border-radius:4px;"></iframe>` : '<div style="padding:24px; opacity:0.5; text-align:center;">No video reference saved.</div>';
  }
}

// --- SUBMISSIONS & FORMS ---
export function populateExistingLevelsDropdown() {
  const d = document.getElementById('existingLevel');
  const t = document.getElementById('listType');
  if (!d || !t) return;
  d.innerHTML = '';
  const filtered = uiState.allLevels.filter(l => getNormalizedListType(l) === t.value);
  filtered.forEach(l => {
    const opt = document.createElement('option');
    opt.value = escapeHTML(l.name || l.levelName);
    opt.dataset.id = escapeHTML(String(l.id || ''));
    opt.dataset.creator = escapeHTML(l.creator || '');
    opt.textContent = `${escapeHTML(l.name || l.levelName)} (by ${escapeHTML(l.creator || 'Unknown')})`;
    d.appendChild(opt);
  });
}

export function toggleFormFields() {
  const t = document.getElementById("listType");
  const s = document.getElementById("submissionType");
  if (!t || !s) return;
  
  const eWrap = document.getElementById("existingLevelWrap");
  const nFields = document.getElementById("newLevelFields");
  
  if (s.value === "newLevel") {
    if (eWrap) eWrap.style.display = "none";
    if (nFields) nFields.style.display = "block";
  } else {
    if (eWrap) eWrap.style.display = "block";
    if (nFields) nFields.style.display = "none";
  }
}

export function handleListTypeChange() {
  populateExistingLevelsDropdown();
  toggleFormFields();
}

export function bindSubmitHandler() {
  const btn = document.getElementById('submitBtn');
  if(!btn) return;

  btn.addEventListener('click', async () => {
    const ogText = btn.textContent;
    try {
      const user = document.getElementById('username').value.trim();
      const link = document.getElementById('recordLink').value.trim();
      const campus = document.getElementById('campus').value.trim();
      const subType = document.getElementById('submissionType').value;
      const listType = document.getElementById('listType').value;

      if (!user || !link || !campus) {
        throw new Error("Missing required fields. Please fill in Username, Record Link, and Campus.");
      }

      const urlRegex = /^(https?:\/\/)?([a-z\d-]+\.)+[a-z]{2,63}(\/[^\s]*)?$/i;
      if (!urlRegex.test(link)) {
        throw new Error("Invalid Record Link format. Please provide a valid URL.");
      }

      btn.textContent = "Submitting...";
      btn.disabled = true;

      let payload = {
        username: user,
        recordLink: link,
        campus: campus,
        type: subType,     
        listType: listType 
      };

      if (subType === 'record') {
        const selectEl = document.getElementById('existingLevel');
        if (!selectEl) throw new Error("Existing level element registry missing.");
        if (!selectEl.value) throw new Error("Please select an existing level from the dropdown.");
        
        const activeOpt = selectEl.options[selectEl.selectedIndex];
        payload.levelName = selectEl.value;
        payload.id = activeOpt ? (activeOpt.dataset.id || '') : '';
        payload.creator = activeOpt ? (activeOpt.dataset.creator || '') : '';
      } else {
        payload.newName = document.getElementById('newName').value.trim();
        payload.newCreator = document.getElementById('newCreator').value.trim();
        payload.newLevelId = document.getElementById('newLevelId').value.trim();
        
        if (!payload.newName || !payload.newCreator) {
          throw new Error("Name and Creator are required when submitting a new level.");
        }
        
        const diffEl = document.getElementById('newDifficulty');
        if (diffEl) payload.difficulty = diffEl.value;
      }

      await submitRecordData(payload);

      await new Promise(r => setTimeout(r, 600));
      alert("Success! Your submission has been sent for staff review.");
      
      document.getElementById('username').value = '';
      document.getElementById('recordLink').value = '';
      if(document.getElementById('newName')) document.getElementById('newName').value = '';
      if(document.getElementById('newCreator')) document.getElementById('newCreator').value = '';
      if(document.getElementById('newLevelId')) document.getElementById('newLevelId').value = '';
      
    } catch (err) {
      console.error("[Submission Error Detail]:", err);
      alert("Submission Error: " + err.message);
    } finally {
      btn.textContent = ogText;
      btn.disabled = false;
    }
  });
}

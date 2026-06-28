// js/ui/list.js
import { escapeHTML, calculateLevelPoints, getNormalizedListType, getRecordList } from '../utils.js';
import { CONFIG } from '../config.js';
import { switchPage } from './modal.js';

export const uiState = {
  allLevels: [],
  currentMainTab: 'demon',
  currentSubTab: 'main', 
  currentStatsTab: 'demon'
};

// --- NEWS ENGINE ---
export function processLiveDecayFilterAndNews() {
  const feed = document.getElementById('liveChangelogFeed');
  if (!feed) return;

  const now = new Date();
  const targetTodayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

  let validNews = [];

  const checkIsToday = (dateStr) => {
    if (!dateStr) return { isToday: false, sortTime: 0 };
    let itemDayStr = "";
    const strMatch = String(dateStr).match(/(\d{4}-\d{2}-\d{2})/);
    
    if (strMatch) {
      itemDayStr = strMatch[1];
    } else {
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) return { isToday: false, sortTime: 0 };
      itemDayStr = parsedDate.getFullYear() + '-' + String(parsedDate.getMonth() + 1).padStart(2, '0') + '-' + String(parsedDate.getDate()).padStart(2, '0');
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
    
    const categorySortedLevels = uiState.allLevels
      .filter(l => getNormalizedListType(l) === listCategory)
      .sort((a, b) => parseInt(a.rank || 999) - parseInt(b.rank || 999));

    const levelDateData = checkIsToday(lvl.createdDate || lvl.date || lvl.publishDate || lvl.added || lvl.timestamp);
    
    if (levelDateData.isToday) {
        const indexInSorted = categorySortedLevels.findIndex(item => String(item.name || item.levelName || "Unnamed Level").trim() === targetName);
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

        if (currentRank <= 75 && categorySortedLevels.length > 75) {
            const pushedExtended = escapeHTML(categorySortedLevels[75].name || categorySortedLevels[75].levelName || "Unnamed");
            placementText += `, this pushes <strong>${pushedExtended}</strong> into the <strong>Extended List</strong>`;
        } else if (currentRank > 75 && currentRank <= 150 && categorySortedLevels.length > 150) {
            const pushedLegacy = escapeHTML(categorySortedLevels[150].name || categorySortedLevels[150].levelName || "Unnamed");
            placementText += `, this pushes <strong>${pushedLegacy}</strong> into the <strong>Legacy List</strong>`;
        }

        validNews.push({ type: 'placement', title: escapeHTML(targetName), rank: currentRank, listType: listCategory, placementText: placementText, sortTime: levelDateData.sortTime });
    }

    const records = getRecordList(lvl);
    const verifierName = String(lvl.verifier || "Unknown").trim().toLowerCase();

    records.forEach(rec => {
        const rawUsername = String(rec.username || rec.name || rec.player || rec.user || "Someone").trim();
        if (rawUsername.toLowerCase() === verifierName) return;

        const recDateData = checkIsToday(rec.date || rec.timestamp || rec.achieved);
        if (recDateData.isToday) {
            validNews.push({ type: 'victor', title: escapeHTML(targetName), listType: listCategory, username: escapeHTML(rawUsername), sortTime: recDateData.sortTime });
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

    let itemDescriptionHtml = '';
    if (item.type === 'placement') {
        itemDescriptionHtml = `Placed at <strong class="news-rank">#${item.rank}</strong>, ${item.placementText}.`;
    } else if (item.type === 'victor') {
        itemDescriptionHtml = `Congratulations to <strong>${item.username}</strong> for beating <strong>${item.title}</strong> today! Huge GGS!`;
    }

    const safeTitle = escapeHTML(item.title).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    html += `
      <div class="changelog-item" onclick="openLevelFromNews('${safeTitle}')" style="cursor:pointer;" title="Click to view level">
        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:3px; gap:10px;">
          <span class="changelog-item-title">${item.title}</span>
          <span style="font-size:11px; white-space:nowrap; font-weight:700; color:${badgeColor};">
            ${badgeText}
          </span>
        </div>
        <div class="changelog-item-desc">${itemDescriptionHtml}</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  feed.appendChild(container);
}

export function openLevelFromNews(lvlName) {
  const lvl = uiState.allLevels.find(l => String(l.name || l.levelName).trim() === lvlName);
  if (!lvl) return;
  const cat = getNormalizedListType(lvl);
  switchMainListTab(cat);
  
  const rank = parseInt(lvl.rank || 999, 10);
  if (rank <= 75) switchListSubTab('main');
  else if (rank <= 150) switchListSubTab('extended');
  else switchListSubTab('legacy');
  
  showLevelDetailPage(lvl, rank);
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
  
  switchListSubTab('main');
}

export function switchListSubTab(tab) {
  uiState.currentSubTab = tab;
  ['subTabMain', 'subTabExtended', 'subTabLegacy'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  
  const tabMap = { 'main': 'subTabMain', 'extended': 'subTabExtended', 'legacy': 'subTabLegacy' };
  const target = document.getElementById(tabMap[tab]);
  if (target) target.classList.add('active');
  
  const descEl = document.getElementById('listDescriptionText');
  if (descEl) {
    if (tab === 'main') descEl.innerText = "The main section of the list. These levels are the hardest rated levels in the game. Records are accepted above a given threshold and award a large amount of points!";
    else if (tab === 'extended') descEl.innerText = "These are levels that don't quite make the cut for the Main List, but are still of extreme difficulty. They award a reduced amount of points.";
    else if (tab === 'legacy') descEl.innerText = "These levels were once on the list but have since fallen off. They no longer award points, but records can still be submitted for legacy purposes.";
  }
  
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
    
    const rank = parseInt(lvl.rank || 999, 10);
    if (uiState.currentSubTab === 'main' && rank > 75) return false;
    if (uiState.currentSubTab === 'extended' && (rank <= 75 || rank > 150)) return false;
    if (uiState.currentSubTab === 'legacy' && rank <= 150) return false;

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

// Global UI Attachments
window.openLevelFromNews = openLevelFromNews;
window.switchMainListTab = switchMainListTab;
window.switchListSubTab = switchListSubTab;

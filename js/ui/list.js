// js/ui/list.js
import { calculateLevelPoints, getNormalizedListType, getRecordList } from '../utils.js';
import { CONFIG } from '../config.js';
import { switchPage } from './modal.js';

let dashboardListEl = null;
let dashboardSearchEl = null;
let dashboardCampusFilterEl = null;

function isAllowedHttpUrl(value, allowedHosts = null) {
  if (!value || value === '#') return null;
  try {
    const parsed = new URL(String(value), window.location.origin);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    if (allowedHosts && !allowedHosts.includes(parsed.hostname.toLowerCase())) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

const VIDEO_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'player.vimeo.com',
  'vimeo.com'
];

function createSafeVideoFrame(url, borderRadius = '6px') {
  const safeUrl = isAllowedHttpUrl(url, VIDEO_HOSTS);
  if (!safeUrl) {
    const fallback = document.createElement('div');
    fallback.style.padding = '24px';
    fallback.style.textAlign = 'center';
    fallback.style.opacity = '0.5';
    fallback.textContent = 'No video available';
    return fallback;
  }

  const iframe = document.createElement('iframe');
  iframe.src = safeUrl;
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.borderRadius = borderRadius;
  return iframe;
}

function getDashboardElements() {
  if (!dashboardListEl) {
    dashboardListEl = document.getElementById('list');
    dashboardSearchEl = document.getElementById('search');
    dashboardCampusFilterEl = document.getElementById('dashboardCampusFilter');
  }

  return {
    list: dashboardListEl,
    search: dashboardSearchEl,
    campusFilter: dashboardCampusFilterEl
  };
}

export const uiState = {
  allLevels: [],
  currentMainTab: 'demon',
  currentSubTab: 'main',
  currentStatsTab: 'demon'
};

let detailCurrentLevel = null;
let detailListCategory = 'demon';

function detailField(level, keys, fallback = '—') {
  for (const key of keys) {
    const value = level?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return fallback;
}

function renderDetailLevelList() {
  const container = document.getElementById('detailLevelList');
  const search = document.getElementById('detailLevelSearch');
  if (!container) return;

  const query = (search?.value || '').trim().toLowerCase();

  const levels = uiState.allLevels
    .filter(level => getNormalizedListType(level) === detailListCategory)
    .filter(level => {
      if (!query) return true;

      return [
        level.name,
        level.levelName,
        level.creator,
        level.diff,
        level.difficulty,
        level.rank
      ].some(value => String(value ?? '').toLowerCase().includes(query));
    })
    .sort((a, b) =>
      parseInt(a.rank || 999, 10) - parseInt(b.rank || 999, 10)
    );

  container.replaceChildren();

  if (!levels.length) {
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.style.cssText = 'padding:16px 8px;text-align:center;';
    empty.textContent = 'No matching levels.';
    container.appendChild(empty);
    return;
  }

  levels.forEach(level => {
    const rank = parseInt(level.rank || 999, 10);

    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      'detail-level-item' +
      (detailCurrentLevel === level ? ' active' : '');

    const rankEl = document.createElement('span');
    rankEl.className = 'detail-level-rank';
    rankEl.textContent = `#${rank}`;

    const nameEl = document.createElement('span');
    nameEl.className = 'detail-level-name';
    nameEl.textContent = level.name || level.levelName || 'Unnamed';

    button.append(rankEl, nameEl);
    button.addEventListener('click', () =>
      showLevelDetailPage(level, rank)
    );

    container.appendChild(button);
  });
}

window.filterDetailLevelList = renderDetailLevelList;

window.setDetailListCategory = function(category) {
  detailListCategory = category === 'challenge' ? 'challenge' : 'demon';

  document.getElementById('detailTabDemons')
    ?.classList.toggle('active', detailListCategory === 'demon');

  document.getElementById('detailTabChallenges')
    ?.classList.toggle('active', detailListCategory === 'challenge');

  const search = document.getElementById('detailLevelSearch');
  if (search) search.value = '';

  renderDetailLevelList();
};

// --- URL ROUTING ENGINE ---
export function syncURL(replace = false) {
  // Use hash routing for GitHub Pages to prevent 404 errors on refresh
  const basePath = window.location.pathname;
  let newHash = '';

  if (uiState.currentMainTab === 'stats') {
    newHash = '#/stats-viewer/';
  } else {
    newHash = `#/${uiState.currentMainTab}/${uiState.currentSubTab}/`;
  }

  const queryEl = document.getElementById('search');

  if (queryEl && queryEl.value) {
    newHash += `?search=${encodeURIComponent(queryEl.value)}`;
  }

  const fullUrl = basePath + newHash;

  if (replace) {
    window.history.replaceState(
      {
        main: uiState.currentMainTab,
        sub: uiState.currentSubTab
      },
      '',
      fullUrl
    );
  } else {
    window.history.pushState(
      {
        main: uiState.currentMainTab,
        sub: uiState.currentSubTab
      },
      '',
      fullUrl
    );
  }
}

// Listen for Back/Forward buttons
window.addEventListener('popstate', (event) => {
  const hash = window.location.hash;

  if (hash.startsWith('#/stats-viewer/')) {
    uiState.currentMainTab = 'stats';
  } else {
    const parts = hash.replace('#/', '').split('/');
    if (parts[0]) uiState.currentMainTab = parts[0];
    if (parts[1]) uiState.currentSubTab = parts[1];
  }

  // Restore Search if present in URL
  const searchMatch = hash.match(/\?search=([^&]*)/);
  const queryEl = document.getElementById('search');

  if (queryEl) {
    queryEl.value = searchMatch ? decodeURIComponent(searchMatch[1]) : '';
  }

  // Update tabs visually without pushing to URL again
  const mainTabMap = {
    demon: 'tabDemons',
    challenge: 'tabChallenges',
    platformer: 'tabPlatformers'
  };

  ['tabDemons', 'tabChallenges', 'tabPlatformers'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', id === mainTabMap[uiState.currentMainTab]);
  });

  const subTabMap = {
    main: 'subTabMain',
    extended: 'subTabExtended',
    legacy: 'subTabLegacy'
  };

  ['subTabMain', 'subTabExtended', 'subTabLegacy'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', id === subTabMap[uiState.currentSubTab]);
  });

  renderLevelsDashboard();
});

export function processLiveDecayFilterAndNews() {
  const feed = document.getElementById('liveChangelogFeed');
  if (!feed) return;

  const now = new Date();
  const targetTodayStr =
    now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');

  let validNews = [];

  const checkIsToday = (dateStr) => {
    if (!dateStr) return { isToday: false, sortTime: 0 };

    let itemDayStr = '';
    const strMatch = String(dateStr).match(/(\d{4}-\d{2}-\d{2})/);

    if (strMatch) {
      itemDayStr = strMatch[1];
    } else {
      const parsedDate = new Date(dateStr);

      if (isNaN(parsedDate.getTime())) {
        return { isToday: false, sortTime: 0 };
      }

      itemDayStr =
        parsedDate.getFullYear() + '-' +
        String(parsedDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(parsedDate.getDate()).padStart(2, '0');
    }

    const cleanDateStr = String(dateStr).replace(/[A-Za-z]+$/, '').trim();
    const sortDateObj = new Date(cleanDateStr);
    const sortTimestamp = isNaN(sortDateObj.getTime())
      ? Date.now()
      : sortDateObj.getTime();

    return {
      isToday: itemDayStr === targetTodayStr,
      sortTime: sortTimestamp
    };
  };

  // DETECT REMOVED CHALLENGES

  const currentLevelSnapshot = uiState.allLevels
    .map(lvl => ({
      name: String(lvl.name || lvl.levelName || '').trim(),
      listType: getNormalizedListType(lvl)
    }))
    .filter(lvl => lvl.name);

  const snapshotStorageKey = 'pshsNewsPreviousLevelSnapshot';
  const removalsStorageKey = 'pshsNewsRemovedChallenges';

  let previousSnapshot = [];
  let storedRemovalData = {};

  try {
    previousSnapshot = JSON.parse(
      window.localStorage.getItem(snapshotStorageKey) || '[]'
    );

    if (!Array.isArray(previousSnapshot)) {
      previousSnapshot = [];
    }

    storedRemovalData = JSON.parse(
      window.localStorage.getItem(removalsStorageKey) || '{}'
    );

    if (
      !storedRemovalData ||
      typeof storedRemovalData !== 'object' ||
      Array.isArray(storedRemovalData)
    ) {
      storedRemovalData = {};
    }
  } catch (error) {
    previousSnapshot = [];
    storedRemovalData = {};
  }

  Object.keys(storedRemovalData).forEach(dateKey => {
    if (dateKey !== targetTodayStr) {
      delete storedRemovalData[dateKey];
    }
  });

  const currentChallengeNames = new Set(
    currentLevelSnapshot
      .filter(lvl => lvl.listType === 'challenge')
      .map(lvl => lvl.name.toLowerCase())
  );

  const todaysRemovedChallenges =
    Array.isArray(storedRemovalData[targetTodayStr])
      ? storedRemovalData[targetTodayStr]
      : [];

  const alreadyNotifiedRemoved = new Set(
    todaysRemovedChallenges.map(
      item => String(item.name || '').toLowerCase()
    )
  );

  if (previousSnapshot.length > 0) {
    previousSnapshot.forEach(oldLevel => {
      const oldName = String(
        oldLevel.name || oldLevel.levelName || ''
      ).trim();

      const oldType = oldLevel.listType || oldLevel.type;

      if (
        oldName &&
        String(oldType).toLowerCase() === 'challenge' &&
        !currentChallengeNames.has(oldName.toLowerCase()) &&
        !alreadyNotifiedRemoved.has(oldName.toLowerCase())
      ) {
        todaysRemovedChallenges.push({ name: oldName });
        alreadyNotifiedRemoved.add(oldName.toLowerCase());
      }
    });
  }

  storedRemovalData[targetTodayStr] = todaysRemovedChallenges;

  try {
    window.localStorage.setItem(
      snapshotStorageKey,
      JSON.stringify(currentLevelSnapshot)
    );

    window.localStorage.setItem(
      removalsStorageKey,
      JSON.stringify(storedRemovalData)
    );
  } catch (error) {
    // Keep rendering the feed if browser storage is unavailable.
  }

  todaysRemovedChallenges.forEach(item => {
    validNews.push({
      type: 'removed',
      title: String(item.name || 'Unnamed Challenge'),
      listType: 'challenge',
      sortTime: now.getTime()
    });
  });

  // EXISTING PLACEMENT NEWS LOGIC

  const categories = {};

  uiState.allLevels.forEach(lvl => {
    const cat = getNormalizedListType(lvl);

    if (!categories[cat]) {
      categories[cat] = [];
    }

    categories[cat].push({ ...lvl });
  });

  Object.keys(categories).forEach(cat => {
    categories[cat].sort(
      (a, b) => parseInt(a.rank || 999) - parseInt(b.rank || 999)
    );
  });

  const exactPushedExtendedMap = {};
  const exactPushedLegacyMap = {};

  Object.keys(categories).forEach(cat => {
    let currentSimList = [...categories[cat]];

    const indexMap = new Map(
      currentSimList.map((lvl, index) => [
        String(lvl.name || lvl.levelName || '')
          .trim()
          .toLowerCase(),
        index
      ])
    );

    const todaysAdditions = currentSimList
      .filter(lvl =>
        checkIsToday(
          lvl.createdDate ||
          lvl.date ||
          lvl.publishDate ||
          lvl.added ||
          lvl.timestamp
        ).isToday
      )
      .sort((a, b) => {
        const timeA = checkIsToday(
          a.createdDate ||
          a.date ||
          a.publishDate ||
          a.added ||
          a.timestamp
        ).sortTime;

        const timeB = checkIsToday(
          b.createdDate ||
          b.date ||
          b.publishDate ||
          b.added ||
          b.timestamp
        ).sortTime;

        return timeB - timeA;
      });

    todaysAdditions.forEach(addition => {
      const addName = String(
        addition.name || addition.levelName || ''
      ).trim().toLowerCase();

      const idx = indexMap.get(addName);
      if (idx === undefined) return;

      const placementRank = idx + 1;

      if (placementRank <= 75 && currentSimList.length > 75) {
        const pushedLvl = currentSimList[75];

        if (pushedLvl) {
          exactPushedExtendedMap[addName] =
            pushedLvl.name || pushedLvl.levelName || 'Unnamed';
        }
      } else if (
        placementRank > 75 &&
        placementRank <= 150 &&
        currentSimList.length > 150
      ) {
        const pushedLvl = currentSimList[150];

        if (pushedLvl) {
          exactPushedLegacyMap[addName] =
            pushedLvl.name || pushedLvl.levelName || 'Unnamed';
        }
      }

      currentSimList.splice(idx, 1);
      indexMap.delete(addName);

      for (let i = idx; i < currentSimList.length; i++) {
        indexMap.set(
          String(
            currentSimList[i].name ||
            currentSimList[i].levelName ||
            ''
          ).trim().toLowerCase(),
          i
        );
      }
    });
  });

  // BUILD PLACEMENT AND VICTOR NEWS

  uiState.allLevels.forEach(lvl => {
    const currentRank = parseInt(lvl.rank || 999, 10);

    const targetName = String(
      lvl.name || lvl.levelName || 'Unnamed Level'
    ).trim();

    const listCategory = getNormalizedListType(lvl);
    const categorySortedLevels = categories[listCategory];

    const levelDateData = checkIsToday(
      lvl.createdDate ||
      lvl.date ||
      lvl.publishDate ||
      lvl.added ||
      lvl.timestamp
    );

    if (levelDateData.isToday) {
      const indexInSorted = categorySortedLevels.findIndex(
        item =>
          String(
            item.name || item.levelName || 'Unnamed Level'
          ).trim() === targetName
      );

      let textHarder = 'None';
      let textEasier = 'None';

      if (indexInSorted > 0) {
        const harderLevel = categorySortedLevels[indexInSorted - 1];

        textHarder = String(
          harderLevel.name || harderLevel.levelName || 'Unnamed'
        );
      }

      if (
        indexInSorted !== -1 &&
        indexInSorted < categorySortedLevels.length - 1
      ) {
        const easierLevel = categorySortedLevels[indexInSorted + 1];

        textEasier = String(
          easierLevel.name || easierLevel.levelName || 'Unnamed'
        );
      }

      let placementText =
        `below ${textHarder} and above ${textEasier}`;

      if (textHarder === 'None' && textEasier === 'None') {
        placementText = 'as the only level in this category';
      } else if (textHarder === 'None') {
        placementText =
          `at the very top of the list, above ${textEasier}`;
      } else if (textEasier === 'None') {
        placementText =
          `below ${textHarder}, at the bottom of the list`;
      }

      const lookKey = targetName.toLowerCase();

      if (exactPushedExtendedMap[lookKey]) {
        placementText +=
          `, this pushes ${exactPushedExtendedMap[lookKey]} into the Extended List`;
      } else if (exactPushedLegacyMap[lookKey]) {
        placementText +=
          `, this pushes ${exactPushedLegacyMap[lookKey]} into the Legacy List`;
      }

      validNews.push({
        type: 'placement',
        title: targetName,
        rank: currentRank,
        listType: listCategory,
        placementText,
        sortTime: levelDateData.sortTime
      });
    }

    const records = getRecordList(lvl);
    const verifierName = String(
      lvl.verifier || 'Unknown'
    ).trim().toLowerCase();

    records.forEach(rec => {
      const rawUsername = String(
        rec.username ||
        rec.name ||
        rec.player ||
        rec.user ||
        'Someone'
      ).trim();

      if (rawUsername.toLowerCase() === verifierName) {
        return;
      }

      const recDateData = checkIsToday(
        rec.date || rec.timestamp || rec.achieved
      );

      if (recDateData.isToday) {
        validNews.push({
          type: 'victor',
          title: targetName,
          listType: listCategory,
          username: rawUsername,
          sortTime: recDateData.sortTime
        });
      }
    });
  });

  validNews.sort((a, b) => b.sortTime - a.sortTime);

  // RENDER NEWS FEED

  if (validNews.length === 0) {
    feed.replaceChildren();

    const empty = document.createElement('div');
    empty.style.color = '#64748b';
    empty.style.padding = '16px';
    empty.style.fontSize = '12px';
    empty.style.textAlign = 'center';
    empty.style.fontStyle = 'italic';
    empty.textContent =
      `No changes detected for today (${targetTodayStr}).`;

    feed.appendChild(empty);
    return;
  }

  feed.replaceChildren();

  const container = document.createElement('div');
  container.style.marginBottom = '14px';

  const displayDate = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const dateEl = document.createElement('div');
  dateEl.style.cssText =
    'font-size:11px; color:var(--accent); font-weight:700; ' +
    'text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;';

  dateEl.textContent = displayDate;
  container.appendChild(dateEl);

  validNews.forEach(item => {
    let badgeText = 'DEMON LIST';
    let badgeColor = 'var(--accent)';

    if (item.listType === 'challenge') {
      badgeText = 'CHALLENGE LIST';
      badgeColor = '#f59e0b';
    } else if (item.listType === 'platformer') {
      badgeText = 'PLATFORMER LIST';
      badgeColor = '#3b82f6';
    }

    const itemEl = document.createElement('div');
    itemEl.className = 'changelog-item';
    itemEl.style.cursor = 'pointer';
    itemEl.title = 'Click to view level';

    if (item.type !== 'removed') {
      itemEl.addEventListener('click', () => {
        openLevelFromNews(item.title);
      });
    } else {
      itemEl.style.cursor = 'default';
      itemEl.title = 'Challenge removed from the list';
    }

    const top = document.createElement('div');
    top.style.cssText =
      'display:flex; justify-content:space-between; font-size:13px; ' +
      'margin-bottom:3px; gap:10px;';

    const titleEl = document.createElement('span');
    titleEl.className = 'changelog-item-title';
    titleEl.textContent = item.title;

    const badge = document.createElement('span');
    badge.style.cssText =
      `font-size:11px; white-space:nowrap; font-weight:700; color:${badgeColor};`;

    badge.textContent = badgeText;
    top.append(titleEl, badge);

    const desc = document.createElement('div');
    desc.className = 'changelog-item-desc';

    if (item.type === 'placement') {
      desc.append(document.createTextNode('Placed at '));

      const rank = document.createElement('strong');
      rank.className = 'news-rank';
      rank.textContent = `#${item.rank}`;

      desc.append(rank, document.createTextNode(', '));
      appendPlacementDescription(desc, item.placementText);
    } else if (item.type === 'removed') {
      desc.textContent =
        `${item.title} was removed from the Challenge List by unanimous decision`;
    } else if (item.type === 'victor') {
      desc.append(document.createTextNode('Congratulations to '));

      const username = document.createElement('strong');
      username.textContent = item.username;

      const title = document.createElement('strong');
      title.textContent = item.title;

      desc.append(
        username,
        document.createTextNode(' for beating '),
        title,
        document.createTextNode(' today! Huge GGS!')
      );
    }

    itemEl.append(top, desc);
    container.appendChild(itemEl);
  });

  feed.appendChild(container);
}

function appendPlacementDescription(parent, text) {
  const value = String(text);

  if (value === 'as the only level in this category') {
    parent.textContent = value;
    return;
  }

  const top = value.match(/^at the very top of the list, above (.+)$/);

  if (top) {
    const strong = document.createElement('strong');
    strong.textContent = top[1];

    parent.append(
      document.createTextNode('at the very top of the list, above '),
      strong
    );
    return;
  }

  const bottom = value.match(/^below (.+), at the bottom of the list$/);

  if (bottom) {
    const strong = document.createElement('strong');
    strong.textContent = bottom[1];

    parent.append(
      document.createTextNode('below '),
      strong,
      document.createTextNode(', at the bottom of the list')
    );
    return;
  }

  const normal = value.match(
    /^below (.+) and above (.+?)(?:, this pushes (.+) into the (Extended List|Legacy List))?$/
  );

  if (normal) {
    const harder = document.createElement('strong');
    harder.textContent = normal[1];

    const easier = document.createElement('strong');
    easier.textContent = normal[2];

    parent.append(
      document.createTextNode('below '),
      harder,
      document.createTextNode(' and above '),
      easier
    );

    if (normal[3]) {
      const pushed = document.createElement('strong');
      pushed.textContent = normal[3];

      parent.append(
        document.createTextNode(', this pushes '),
        pushed,
        document.createTextNode(` into the ${normal[4]}`)
      );
    }

    return;
  }

  parent.textContent = value;
}

export function openLevelFromNews(lvlName) {
  const lvl = uiState.allLevels.find(
    l => String(l.name || l.levelName).trim() === lvlName
  );

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

export function switchMainListTab(tab, bypassUrlSync = false) {
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

  switchListSubTab('main', true);

  if (!bypassUrlSync) syncURL();
}

export function switchListSubTab(tab, bypassUrlSync = false) {
  uiState.currentSubTab = tab;

  ['subTabMain', 'subTabExtended', 'subTabLegacy'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  const tabMap = {
    main: 'subTabMain',
    extended: 'subTabExtended',
    legacy: 'subTabLegacy'
  };

  const target = document.getElementById(tabMap[tab]);
  if (target) target.classList.add('active');

  const descEl = document.getElementById('listDescriptionText');

  if (descEl) {
    if (tab === 'main') {
      descEl.innerText =
        'The main section of the list. These levels are the hardest rated levels in the game. Records are accepted above a given threshold and award a large amount of points.';
    } else if (tab === 'extended') {
      descEl.innerText =
        "These are levels that don't quite make the cut for the Main List, but are still of extreme difficulty. They award a reduced amount of points.";
    } else if (tab === 'legacy') {
      descEl.innerText =
        'These levels were once on the list but have since fallen off. They no longer award points, but records can still be submitted for legacy purposes.';
    }
  }

  renderLevelsDashboard();

  if (!bypassUrlSync) syncURL();
}

export function renderLevelsDashboard() {
  const { list, search, campusFilter } = getDashboardElements();
  if (!list) return;

  const query = search ? search.value.trim().toLowerCase() : '';
  const campusVal = campusFilter ? campusFilter.value : 'ALL';

  // A numeric query searches for that exact rank.
  // Examples: "1", "124", "#124".
  const numericRankMatch = query.match(/^#?(\d+)$/);
  const exactRank = numericRankMatch
    ? parseInt(numericRankMatch[1], 10)
    : null;

  const searching = query.length > 0;

  let displayedItems = uiState.allLevels.filter(lvl => {
    const rank = parseInt(lvl.rank || 999, 10);

    // Keep the original selected category.
    if (getNormalizedListType(lvl) !== uiState.currentMainTab) {
      return false;
    }

    // When searching, allow results from all three rank sections.
    // Without a query, preserve the original Main/Extended/Legacy tabs.
    if (!searching) {
      if (uiState.currentSubTab === 'main' && rank > 75) {
        return false;
      }

      if (
        uiState.currentSubTab === 'extended' &&
        (rank <= 75 || rank > 150)
      ) {
        return false;
      }

      if (uiState.currentSubTab === 'legacy' && rank <= 150) {
        return false;
      }
    }

    const lvlCampus = lvl._escapedCampus;
    const records = getRecordList(lvl);

    const campusMatch =
      campusVal === 'ALL' ||
      lvlCampus === campusVal ||
      records.some(record => record._escapedCampus === campusVal);

    if (!campusMatch) return false;

    // Exact numeric rank search.
    if (exactRank !== null) {
      return rank === exactRank;
    }

    if (!searching) return true;

    const name = String(
      lvl.name || lvl.levelName || ''
    ).toLowerCase();

    const creator = String(lvl.creator || '').toLowerCase();
    const difficulty = String(
      lvl.diff || lvl.difficulty || ''
    ).toLowerCase();

    const verifier = String(lvl.verifier || '').toLowerCase();

    return (
      name.includes(query) ||
      creator.includes(query) ||
      difficulty.includes(query) ||
      verifier.includes(query)
    );
  });

  displayedItems.sort(
    (a, b) =>
      parseInt(a.rank || 999, 10) -
      parseInt(b.rank || 999, 10)
  );

  if (displayedItems.length === 0) {
    const empty = document.createElement('div');

    empty.style.textAlign = 'center';
    empty.style.padding = '24px';
    empty.style.opacity = '0.5';
    empty.style.fontSize = '13px';
    empty.textContent =
      'No tier entries match these filtering criteria.';

    list.replaceChildren(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  displayedItems.forEach(lvl => {
    const rank = parseInt(lvl.rank || 999, 10);
    const pts = calculateLevelPoints(rank);

    let thumb = lvl.img || lvl.thumbnail;

    if (!thumb && lvl.video?.includes('embed/')) {
      try {
        thumb = `https://img.youtube.com/vi/${
          lvl.video.split('embed/')[1].split('?')[0]
        }/maxdefault.jpg`;
      } catch {}
    }

    thumb ||= CONFIG.IMAGES.FALLBACK_THUMBNAIL;

    const row = document.createElement('div');
    row.className = 'row';
    row.addEventListener('click', () => {
      showLevelDetailPage(lvl, rank);
    });

    // Rank
    const rankDiv = document.createElement('div');
    rankDiv.className = 'rank';
    rankDiv.textContent = `#${rank}`;

    // Thumbnail
    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'thumb';

    const img = document.createElement('img');
    const safeThumb = isAllowedHttpUrl(thumb);

    img.src = safeThumb || CONFIG.IMAGES.FALLBACK_THUMBNAIL;

    img.onerror = function () {
      this.onerror = null;
      this.src = CONFIG.IMAGES.FALLBACK_THUMBNAIL;
    };

    thumbDiv.appendChild(img);

    // Level information
    const info = document.createElement('div');
    info.className = 'info';

    const title = document.createElement('div');
    title.className = 'title';

    title.append(
      document.createTextNode(lvl.name || lvl.levelName || 'Unnamed')
    );

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.style.fontSize = '10px';
    badge.textContent = lvl.diff || lvl.difficulty || 'Demon';

    title.append(' ', badge);

    const creator = document.createElement('div');
    creator.className = 'sub';
    creator.textContent =
      `By ${lvl.creator || 'Unknown'} | Verified by ${lvl.verifier || 'Unknown'}`;

    const points = document.createElement('div');
    points.className = 'points';
    points.textContent = `${pts.toFixed(2)} Points`;

    const campus = document.createElement('div');
    campus.className = 'sub';
    campus.style.color = 'var(--accent)';
    campus.style.fontWeight = 'bold';
    campus.style.marginTop = '2px';
    campus.style.fontSize = '11px';
    campus.textContent = `Campus: ${lvl.campus || 'Main Campus'}`;

    info.append(title, creator, points, campus);
    row.append(rankDiv, thumbDiv, info);

    fragment.appendChild(row);
  });

  list.replaceChildren(fragment);
}

let searchRenderTimer = null;

export function scheduleRenderLevelsDashboard() {
  clearTimeout(searchRenderTimer);

  searchRenderTimer = setTimeout(() => {
    renderLevelsDashboard();
  }, 150);
}
export function showLevelDetailPage(lvl, forceRank) {
  if (!lvl) return;

  detailCurrentLevel = lvl;
  detailListCategory =
    getNormalizedListType(lvl) === 'challenge' ? 'challenge' : 'demon';

  switchPage('detail');

  const finalRank = forceRank || lvl.rank || 999;
  const records = getRecordList(lvl);

  const title = document.getElementById('dTitle');
  const info = document.getElementById('dInfo');
  const video = document.getElementById('video');
  const recordsContainer = document.getElementById('dRecordsContainer');
  const tagsContainer = document.getElementById('detailTags');
  const metadata = document.getElementById('detailMetadata');
  const extra = document.getElementById('detailExtra');

  document.getElementById('detailTabDemons')
    ?.classList.toggle('active', detailListCategory === 'demon');

  document.getElementById('detailTabChallenges')
    ?.classList.toggle('active', detailListCategory === 'challenge');

  if (title) {
    title.textContent = lvl.name || lvl.levelName || 'Unnamed Level';
  }

  if (info) {
    info.replaceChildren();

    const description = detailField(
      lvl,
      ['description', 'desc', 'shortDescription'],
      ''
    );

    info.textContent =
      description ||
      `${lvl.name || lvl.levelName || 'This level'} is ranked #${finalRank} on the PSHS list.`;
  }

  if (video) {
    video.replaceChildren(createSafeVideoFrame(lvl.video, '10px'));
  }

  // Tags
  if (tagsContainer) {
    tagsContainer.replaceChildren();

    let tags = lvl.tags || lvl.features || lvl.gimmicks || [];

    if (typeof tags === 'string') {
      tags = tags
        .split(/[,|]/)
        .map(tag => tag.trim())
        .filter(Boolean);
    }

    if (!Array.isArray(tags)) tags = [];

    const defaults = [
      detailField(lvl, ['version'], ''),
      detailField(lvl, ['difficulty', 'diff'], '')
    ];

    tags = [
      ...new Set(
        [...defaults, ...tags.map(String)].filter(Boolean)
      )
    ].slice(0, 12);

    tags.forEach(tag => {
      const pill = document.createElement('span');
      pill.className = 'detail-tag';
      pill.textContent = tag;
      tagsContainer.appendChild(pill);
    });
  }

  // Only show Level ID and List Points as metadata metrics.
  if (metadata) {
    metadata.replaceChildren();

    const metrics = [
      [
        'Level ID',
        detailField(lvl, ['id', 'levelId', 'levelID'])
      ],
      [
        'List Points',
        calculateLevelPoints(parseInt(finalRank, 10)).toFixed(2)
      ]
    ];

    metrics.forEach(([label, value]) => {
      const cell = document.createElement('div');
      cell.className = 'detail-metric';

      const heading = document.createElement('div');
      heading.className = 'detail-metric-label';
      heading.textContent = label;

      const val = document.createElement('div');
      val.className = 'detail-metric-value';
      val.textContent = value;

      cell.append(heading, val);
      metadata.appendChild(cell);
    });
  }

  // Additional level information.
  if (extra) {
    extra.replaceChildren();

    const rows = [
      ['Publisher', detailField(lvl, ['publisher', 'songPublisher'], '')],
      ['Verifier', detailField(lvl, ['verifier'], 'Unknown')],
      ['Creator(s)', detailField(lvl, ['creators', 'creator'], 'Unknown')]
    ].filter(([, value]) => value);

    rows.forEach(([label, value]) => {
      const row = document.createElement('div');

      const strong = document.createElement('strong');
      strong.textContent = `${label}: `;

      row.append(strong, document.createTextNode(value));
      extra.appendChild(row);
    });
  }

  // Records table.
  if (recordsContainer) {
    recordsContainer.replaceChildren();

    if (!records.length) {
      const empty = document.createElement('div');
      empty.style.cssText =
        'padding:12px 2px;opacity:.7;font-size:13px;';
      empty.textContent = 'No records';

      recordsContainer.appendChild(empty);
    } else {
      const table = document.createElement('table');
      table.className = 'records-table';
      table.style.width = '100%';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');

      ['Player', 'Campus', 'Proof'].forEach((label, index) => {
        const th = document.createElement('th');
        th.textContent = label;
        th.style.textAlign = index === 2 ? 'right' : 'left';
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);

      const tbody = document.createElement('tbody');

      records.forEach(record => {
        const row = document.createElement('tr');

        const player = document.createElement('td');
        player.textContent =
          `${String(
            record.username ||
            record.name ||
            record.player ||
            record.user ||
            'Unknown'
          ).trim()} (${record.percent || 100}%)`;

        const campus = document.createElement('td');
        campus.textContent = record.campus || 'Main Campus';

        const proofCell = document.createElement('td');
        proofCell.style.textAlign = 'right';

        const proof = document.createElement('a');
        proof.className = 'proof-btn';
        proof.target = '_blank';
        proof.rel = 'noopener noreferrer';

        const safeProofUrl = isAllowedHttpUrl(record.video);

        if (safeProofUrl) {
          proof.href = safeProofUrl;
          proof.textContent = 'Proof';
        } else {
          proof.textContent = '—';
          proof.setAttribute('aria-disabled', 'true');
        }

        proofCell.appendChild(proof);
        row.append(player, campus, proofCell);
        tbody.appendChild(row);
      });

      table.append(thead, tbody);
      recordsContainer.appendChild(table);
    }
  }

  renderDetailLevelList();
}

// Global UI attachments.
window.openLevelFromNews = openLevelFromNews;
window.switchMainListTab = switchMainListTab;
window.switchListSubTab = switchListSubTab;

// Route hook used by the hash router to open a level detail by ID, rank,
// or exact name.
window.routeToDetail = function(levelParam, params) {
  if (!levelParam) return;

  const key = String(levelParam).trim();

  let lvl = uiState.allLevels.find(
    level => String(level.id) === key || String(level.rank) === key
  );

  if (!lvl) {
    lvl = uiState.allLevels.find(
      level => String(level.name || level.levelName || '').trim() === key
    );

    if (!lvl) {
      let decoded = key;

      try {
        decoded = decodeURIComponent(key);
      } catch {
        // Keep the original key if it is not valid encoded text.
      }

      lvl = uiState.allLevels.find(
        level =>
          String(level.name || level.levelName || '').trim() === decoded
      );
    }
  }

  if (lvl) {
    const rank = parseInt(lvl.rank || 999, 10);
    showLevelDetailPage(lvl, rank);
  }
};

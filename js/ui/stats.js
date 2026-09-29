// js/ui/stats.js
import { calculateLevelPoints, getNormalizedListType, getRecordList } from '../utils.js';
import { switchPage } from './modal.js';
import { uiState } from './list.js';

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
  targetBody.replaceChildren();
  
  const players = new Map();

  // Pass 1: Group all records by player
  for (const lvl of uiState.allLevels) {
    const cat = getNormalizedListType(lvl);
    const rank = parseInt(lvl.rank || 999, 10);

    for (const r of getRecordList(lvl)) {
      const name = String(
        r.username || r.name || r.player || r.user || ''
      ).trim();

      if (!name) continue;

      const campus = String(r.campus || 'Main Campus').trim();

      if (campusFilter !== 'ALL' && campus !== campusFilter) 
        continue;

      let player = players.get(name);

      if (!player) {
        player = {
          name,
          campus,
          records: []
        };
        players.set(name, player);
      }

      player.records.push({
        level: lvl,
        record: r,
        category: cat,
        rank,
        levelPoints: calculateLevelPoints(rank)
      });
    }
  }

  const processedPlayers = new Map();

  for (const player of players.values()) {

    const stats = {
      name: player.name,
      campus: player.campus,
      points: 0,
      completions: [],
      demons: 0,
      challenges: 0,
      platformers: 0
    };

    for (const entry of player.records) {

      const pct = parseInt(entry.record.percent || 100, 10);

      if (entry.category === uiState.currentStatsTab) {
        stats.points += entry.levelPoints * (pct / 100);
      }

      if (pct === 100) {
        switch (entry.category) {
          case 'demon':
            stats.demons++;
            break;
          case 'challenge':
            stats.challenges++;
            break;
          case 'platformer':
            stats.platformers++;
            break;
        }
      }

      stats.completions.push({
        levelName: String(entry.level.name || entry.level.levelName || 'Unnamed Level'),
        rank: entry.rank,
        category: entry.category,
        percent: pct,
        video: String(entry.record.video || entry.record.recordLink || '')
      });
    }

    processedPlayers.set(player.name, stats);
  }

  let leaderboardData = [...processedPlayers.values() ]
    .filter(p => p.completions.some(c => c.category === uiState.currentStatsTab));
  leaderboardData.sort((a, b) => b.points - a.points);

  if (leaderboardData.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:16px; font-size:12px; opacity:0.5; text-align:center;';
    empty.textContent = 'No records match conditions.';
    targetBody.replaceChildren(empty);
    return;
  }

  leaderboardData.forEach((player, idx) => {
    const row = document.createElement('div');
    row.className = 'sv-row';
    row.onclick = () => displayPlayerProfile(player, idx);
    
    let subLabel = `${player.demons} Demons`;
    if (uiState.currentStatsTab === 'challenge') subLabel = `${player.challenges} Challenges`;
    if (uiState.currentStatsTab === 'platformer') subLabel = `${player.platformers} Platformers`;

    const left = document.createElement('div');
    left.className = 'sv-left';

    const rankEl = document.createElement('span');
    rankEl.className = 'sv-rank';
    rankEl.textContent = `#${idx + 1}`;

    const nameEl = document.createElement('span');
    nameEl.className = 'sv-name';
    nameEl.textContent = player.name;

    const sub = document.createElement('small');
    sub.style.cssText = 'display:block; opacity:0.4; font-size:10px;';
    sub.textContent = subLabel;
    nameEl.appendChild(sub);
    left.append(rankEl, nameEl);

    const pointsEl = document.createElement('span');
    pointsEl.className = 'sv-points';
    pointsEl.style.fontWeight = 'bold';
    pointsEl.textContent = `${player.points.toFixed(2)} pts`;

    row.append(left, pointsEl);
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

  const groups = { main: [], extended: [], legacy: [] };

  player.completions
    .filter(c => c.category === uiState.currentStatsTab)
    .forEach(c => {
      if (c.percent < 100 || c.rank > 150) groups.legacy.push(c);
      else if (c.rank <= 75) groups.main.push(c);
      else groups.extended.push(c);
    });

  canvas.replaceChildren();

  const header = document.createElement('div');
  header.style.cssText = 'border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px; margin-bottom:10px;';

  const h3 = document.createElement('h3');
  h3.style.cssText = 'margin:0; font-size:18px;';
  h3.textContent = `#${activeIdx + 1} ${player.name}`;

  const score = document.createElement('p');
  score.style.cssText = 'margin:4px 0; font-size:14px; color:var(--accent); font-weight:bold;';
  score.textContent = `Total Score: ${player.points.toFixed(2)} Points`;

  const campus = document.createElement('span');
  campus.className = 'badge';
  campus.style.cssText = 'background:var(--line); font-size:10px; padding:2px 6px; color:var(--text); display:inline-block; margin-top:3px;';
  campus.textContent = `Campus: ${player.campus}`;

  header.append(h3, score, campus);
  canvas.appendChild(header);

  const contextHeader = uiState.currentStatsTab.charAt(0).toUpperCase() + uiState.currentStatsTab.slice(1);

  const buildCloud = (arr, typeClass) => {
    const wrapper = document.createElement('div');
    if (arr.length === 0) {
      const empty = document.createElement('span');
      empty.style.cssText = 'opacity:0.3; font-size:11px; font-style:italic;';
      empty.textContent = 'None verified';
      wrapper.appendChild(empty);
      return wrapper;
    }

    arr.forEach(c => {
      const item = document.createElement('span');
      item.className = `demon-click ${typeClass}`;
      item.style.cssText = 'display:inline-block; margin:2px; padding:3px 6px; background:rgba(255,255,255,0.04); border-radius:4px; font-size:11px; cursor:pointer;';
      item.textContent = `${c.levelName} (${c.percent}%)`;
      item.addEventListener('click', () => viewPlayerVideo(c.levelName, c.video));
      wrapper.appendChild(item);
    });
    return wrapper;
  };

  [
    ['Main', groups.main, 'cloud-main'],
    ['Extended', groups.extended, 'cloud-extended'],
    ['Legacy & Progress', groups.legacy, 'cloud-legacy']
  ].forEach(([label, entries, className]) => {
    const h4 = document.createElement('h4');
    h4.style.cssText = 'margin:12px 0 2px 0; font-size:11px; color:#94a3b8; text-transform:uppercase;';
    h4.textContent = `${label} ${contextHeader} Completions`;
    canvas.appendChild(h4);
    canvas.appendChild(buildCloud(entries, className));
  });
}

export function viewPlayerVideo(lvlName, link) {
  switchPage('playerVideo');
  const title = document.getElementById('pvTitle');
  const targetFrame = document.getElementById('pvVideo');
  if (title) title.textContent = `Record Run: ${lvlName}`;
  if (targetFrame) {
    targetFrame.replaceChildren();

    let safeUrl = null;
    if (link && link !== '#') {
      try {
        const parsed = new URL(link, window.location.origin);
        const isHttp = parsed.protocol === 'https:' || parsed.protocol === 'http:';
        const allowedHosts = ['www.youtube.com', 'youtube.com', 'youtu.be', 'player.vimeo.com', 'vimeo.com'];
        const isAllowedHost = allowedHosts.includes(parsed.hostname);
        if (isHttp && isAllowedHost) safeUrl = parsed.href;
      } catch (e) {
        safeUrl = null;
      }
    }

    if (safeUrl) {
      const iframe = document.createElement('iframe');
      iframe.src = safeUrl;
      iframe.setAttribute('allowfullscreen', '');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '4px';
      targetFrame.appendChild(iframe);
    } else {
      const fallback = document.createElement('div');
      fallback.style.padding = '24px';
      fallback.style.textAlign = 'center';
      fallback.style.opacity = '0.6';
      fallback.textContent = 'No video available';
      targetFrame.appendChild(fallback);
    }
  }
}

// Global UI Attachments
window.switchStatsPageListTab = switchStatsPageListTab;
window.viewPlayerVideo = viewPlayerVideo;

// Route hook for the player video page. Expects the embed URL under the `videoLink` query param.
// Example: #playerVideo?level=PlayerName&videoLink=https%3A%2F%2Fwww.youtube.com%2Fembed%2Fabcd1234
window.routeToPlayerVideo = function(levelParam, videoLink) {
  const title = levelParam || 'Record';
  const link = videoLink || '#';
  try {
    viewPlayerVideo(title, link);
  } catch (err) {
    console.error('routeToPlayerVideo failed', err);
  }
};

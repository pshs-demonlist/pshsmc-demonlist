// js/ui/stats.js
import { escapeHTML, calculateLevelPoints, getNormalizedListType, getRecordList } from '../utils.js';
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
  targetBody.innerHTML = '';
  
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
          name: escapeHTML(name),
          campus: escapeHTML(campus),
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
        levelName: escapeHTML(
          entry.level.name || entry.level.levelName || 'Unnamed'
        ),
        rank: entry.rank,
        category: entry.category,
        percent: pct,
        video: escapeHTML(entry.record.video || '#')
      });
    }

    processedPlayers.set(player.name, stats);
  }

  let leaderboardData = [...processedPlayers.values() ]
    .filter(p => p.completions.some(c => c.category === uiState.currentStatsTab));
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
    if (c.percent < 100) legacy.push(c);
    else if (c.rank <= 75) main.push(c);
    else if (c.rank <= 150) extended.push(c);
    else legacy.push(c);
  });

  const buildCloud = (arr, typeClass) => {
    if (arr.length === 0) return '<span style="opacity:0.3; font-size:11px; font-style:italic;">None verified</span>';
    return arr.map(c => `<span class="demon-click ${typeClass}" style="display:inline-block; margin:2px; padding:3px 6px; background:rgba(255,255,255,0.04); border-radius:4px; font-size:11px; cur[...]`,
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
    targetFrame.innerHTML = (link && link !== '#') ? `<iframe src="${link}" allowfullscreen style="width:100%; height:100%; border:none; border-radius:4px;"></iframe>` : '<div style="padding:24px; text-align:center; opacity:0.6;">No video available</div>';
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

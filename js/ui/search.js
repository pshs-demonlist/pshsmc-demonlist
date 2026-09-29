// js/ui/search.js
import { getRecordList } from '../utils.js';
import { uiState } from './list.js';

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
      const name = String(rec.username || rec.name || rec.player || rec.user || '').trim();
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
  const campuses = new Set();
  uiState.allLevels.forEach(lvl => {
    if (lvl.campus) campuses.add(String(lvl.campus).trim());
    getRecordList(lvl).forEach(rec => {
      if (rec.campus) campuses.add(String(rec.campus).trim());
    });
  });

  const sorted = Array.from(campuses).sort();
  const populate = (select) => {
    if (!select) return;
    select.replaceChildren();

    const all = document.createElement('option');
    all.value = 'ALL';
    all.textContent = 'All Campuses';
    select.appendChild(all);

    sorted.forEach(campus => {
      const option = document.createElement('option');
      option.value = campus;
      option.textContent = campus;
      select.appendChild(option);
    });
  };

  populate(document.getElementById('dashboardCampusFilter'));
  populate(document.getElementById('statsCampusFilter'));
}

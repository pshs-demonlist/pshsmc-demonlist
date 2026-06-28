// js/ui/search.js
import { escapeHTML, getRecordList } from '../utils.js';
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

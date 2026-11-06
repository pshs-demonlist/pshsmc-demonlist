// js/ui/roulette.js
// Original local implementation of the Extreme Demon Roulette progression
// challenge. It does not place wagers or use any external gambling service.

import { uiState } from './list.js';
import { getNormalizedListType } from '../utils.js';

const STORAGE_KEY = 'pshsmc_extreme_demon_roulette_v1';
let currentRun = null;
let handlersBound = false;

function getClassicLevels() {
  return (uiState.allLevels || [])
    .filter(level => getNormalizedListType(level) === 'demon')
    .filter(level => Number.isFinite(Number(level.rank)) && Number(level.rank) > 0)
    .slice()
    .sort((a, b) => Number(a.rank) - Number(b.rank));
}

function shuffle(items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function findLevel(id) {
  return getClassicLevels().find(level => String(level.id) === String(id)) || null;
}

function saveRun() {
  try {
    if (currentRun) localStorage.setItem(STORAGE_KEY, JSON.stringify(currentRun));
    else localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[Roulette] Unable to save the current run.', error);
  }
}

function validateRunState(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.poolIds) || !Array.isArray(data.remainingIds) || !Array.isArray(data.history)) {
    return null;
  }
  const validIds = new Set(getClassicLevels().map(level => String(level.id)));
  if (!data.poolIds.every(id => validIds.has(String(id)))) return null;
  if (!data.remainingIds.every(id => validIds.has(String(id)))) return null;
  if (data.currentLevelId && !validIds.has(String(data.currentLevelId))) return null;
  if (!['active', 'failed', 'won'].includes(data.status)) return null;
  const target = Number(data.requiredPercent);
  if (!Number.isFinite(target) || target < 1 || target > 100) return null;
  if (!data.history.every(entry => entry && typeof entry === 'object' && ['cleared', 'failed'].includes(entry.result))) return null;
  return data;
}

function loadRun() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? validateRunState(JSON.parse(saved)) : null;
  } catch (error) {
    console.warn('[Roulette] Saved run could not be restored.', error);
    return null;
  }
}

function setMessage(message, isError = false) {
  const element = document.getElementById('rouletteMessage');
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('error', Boolean(isError));
}

function getRemainingLabel() {
  return `${currentRun?.remainingIds?.length || 0} levels remaining`;
}

function renderHistory() {
  const container = document.getElementById('rouletteHistory');
  const progress = document.getElementById('rouletteProgressLabel');
  if (!container) return;
  container.replaceChildren();

  if (!currentRun || currentRun.history.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'previous-empty';
    empty.textContent = 'No Roulette attempts yet.';
    container.appendChild(empty);
  } else {
    currentRun.history.slice().reverse().forEach(entry => {
      const row = document.createElement('div');
      row.className = 'roulette-history-row';
      const title = document.createElement('span');
      title.className = 'roulette-history-title';
      title.textContent = `#${entry.rank} ${entry.name}`;
      const detail = document.createElement('span');
      detail.className = 'roulette-history-detail';
      detail.textContent = `Needed ${entry.required}% · Got ${entry.percent}%`;
      const status = document.createElement('span');
      status.className = `roulette-history-status ${entry.result}`;
      status.textContent = entry.result === 'cleared' ? 'CLEARED' : 'FAILED';
      row.append(title, detail, status);
      container.appendChild(row);
    });
  }

  if (progress) {
    if (!currentRun) progress.textContent = 'No active run';
    else progress.textContent = `${currentRun.history.length} cleared · ${getRemainingLabel()}`;
  }
}

function renderCurrentLevel() {
  const panel = document.getElementById('rouletteCurrentPanel');
  if (!panel) return;
  panel.replaceChildren();

  if (!currentRun) {
    const empty = document.createElement('div');
    empty.className = 'roulette-empty';
    empty.textContent = 'Choose a placement range and start a run.';
    panel.appendChild(empty);
    renderHistory();
    return;
  }

  if (currentRun.status !== 'active') {
    const result = document.createElement('div');
    result.className = `roulette-result ${currentRun.status}`;
    const heading = document.createElement('h3');
    heading.textContent = currentRun.status === 'won' ? 'Roulette completed!' : 'Run over';
    const detail = document.createElement('p');
    detail.textContent = currentRun.status === 'won'
      ? 'You cleared the final level. GG!'
      : `You needed ${currentRun.lastRequired || currentRun.requiredPercent}% but reported ${currentRun.lastPercent ?? 0}%. Start a new run to try again.`;
    result.append(heading, detail);
    panel.appendChild(result);
    renderHistory();
    return;
  }

  const level = findLevel(currentRun.currentLevelId);
  if (!level) {
    currentRun = null;
    saveRun();
    renderCurrentLevel();
    setMessage('The saved current level is no longer available. Start a new run.', true);
    return;
  }

  const card = document.createElement('div');
  card.className = 'roulette-level-card';
  const artwork = document.createElement('img');
  artwork.className = 'roulette-level-image';
  artwork.alt = '';
  artwork.loading = 'lazy';
  artwork.src = level.img || 'https://img.youtube.com/vi/a83hV1_3B88/maxdefault.jpg';
  artwork.onerror = () => {
    artwork.onerror = null;
    artwork.src = 'https://img.youtube.com/vi/a83hV1_3B88/maxdefault.jpg';
  };

  const content = document.createElement('div');
  content.className = 'roulette-level-content';
  const rank = document.createElement('p');
  rank.className = 'roulette-level-rank';
  rank.textContent = `PLACEMENT #${level.rank}`;
  const name = document.createElement('h3');
  name.textContent = level.name || 'Unknown level';
  const creator = document.createElement('p');
  creator.className = 'roulette-level-creator';
  creator.textContent = level.creator ? `by ${level.creator}` : '';
  const required = document.createElement('div');
  required.className = 'roulette-required-percent';
  required.textContent = `${currentRun.requiredPercent}% required`;
  content.append(rank, name, creator, required);
  card.append(artwork, content);

  const controls = document.createElement('div');
  controls.className = 'roulette-percent-controls';
  const label = document.createElement('label');
  label.htmlFor = 'roulettePercentInput';
  label.textContent = 'Your achieved percentage';
  const input = document.createElement('input');
  input.id = 'roulettePercentInput';
  input.className = 'input';
  input.type = 'number';
  input.min = '0';
  input.max = '100';
  input.step = '1';
  input.placeholder = '0–100';
  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'btn btn-primary';
  submit.textContent = 'Submit Percentage';
  submit.addEventListener('click', () => submitPercent(input.value));
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') submitPercent(input.value);
  });
  controls.append(label, input, submit);

  panel.append(card, controls);
  renderHistory();
}

function startRun() {
  const levels = getClassicLevels();
  if (levels.length === 0) {
    setMessage('The Classic list could not be loaded yet. Refresh the page and try again.', true);
    return;
  }

  const startInput = document.getElementById('rouletteRangeStart');
  const endInput = document.getElementById('rouletteRangeEnd');
  let start = Number(startInput?.value || 1);
  let end = Number(endInput?.value || levels[levels.length - 1].rank);

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1) {
    setMessage('Enter valid whole-number placement ranges.', true);
    return;
  }
  if (start > end) {
    setMessage('Range Start cannot be greater than Range End.', true);
    return;
  }

  const eligible = levels.filter(level => Number(level.rank) >= start && Number(level.rank) <= end);
  if (eligible.length === 0) {
    setMessage('No Classic levels were found in that placement range.', true);
    return;
  }

  const poolIds = shuffle(eligible.map(level => String(level.id)));
  currentRun = {
    version: 1,
    status: 'active',
    rangeStart: start,
    rangeEnd: end,
    poolIds: poolIds.slice(),
    remainingIds: poolIds.slice(1),
    currentLevelId: poolIds[0],
    requiredPercent: 1,
    history: [],
    lastRequired: null,
    lastPercent: null,
    startedAt: new Date().toISOString()
  };
  saveRun();
  setMessage(`Roulette started with ${eligible.length} levels. Your first target is 1%.`);
  renderCurrentLevel();
}

function submitPercent(rawValue) {
  if (!currentRun || currentRun.status !== 'active') return;
  const percent = Number(rawValue);
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    setMessage('Enter a whole-number percentage from 0 to 100.', true);
    return;
  }

  const level = findLevel(currentRun.currentLevelId);
  if (!level) {
    setMessage('The current level could not be found. Reset and start again.', true);
    return;
  }

  const required = currentRun.requiredPercent;
  const cleared = percent >= required;
  currentRun.history.push({
    id: String(level.id),
    name: String(level.name || 'Unknown level'),
    rank: Number(level.rank) || 0,
    required,
    percent,
    result: cleared ? 'cleared' : 'failed',
    date: new Date().toISOString()
  });
  currentRun.lastRequired = required;
  currentRun.lastPercent = percent;

  if (!cleared) {
    currentRun.status = 'failed';
    currentRun.currentLevelId = '';
    saveRun();
    setMessage(`Run ended. ${percent}% was below the required ${required}%.`, true);
    renderCurrentLevel();
    return;
  }

  if (percent >= 100) {
    currentRun.status = 'won';
    currentRun.currentLevelId = '';
    saveRun();
    setMessage('Congratulations! You completed the Roulette run.');
    renderCurrentLevel();
    return;
  }

  if (currentRun.remainingIds.length === 0) {
    currentRun.status = 'won';
    currentRun.currentLevelId = '';
    saveRun();
    setMessage('You cleared every level in the selected range. GG!');
    renderCurrentLevel();
    return;
  }

  currentRun.requiredPercent = Math.min(100, percent + 1);
  currentRun.currentLevelId = currentRun.remainingIds.shift();
  saveRun();
  setMessage(`Level cleared! Next target: ${currentRun.requiredPercent}%.`);
  renderCurrentLevel();
}

function resetRun() {
  currentRun = null;
  saveRun();
  setMessage('Roulette run reset. Choose a range to start again.');
  renderCurrentLevel();
}

function exportRun() {
  if (!currentRun) {
    setMessage('There is no Roulette run to export.', true);
    return;
  }
  const blob = new Blob([JSON.stringify(currentRun, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pshs-demonlist-roulette-run.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setMessage('Roulette run exported.');
}

function importRunFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = validateRunState(JSON.parse(String(reader.result || '')));
      if (!imported) throw new Error('The imported file is not a valid run for the current Classic list.');
      currentRun = imported;
      saveRun();
      setMessage('Roulette run imported successfully.');
      renderCurrentLevel();
    } catch (error) {
      setMessage(error.message || 'Could not import that file.', true);
    }
  };
  reader.onerror = () => setMessage('Could not read the selected file.', true);
  reader.readAsText(file);
}

export function initializeRoulette() {
  const levels = getClassicLevels();
  const start = document.getElementById('rouletteRangeStart');
  const end = document.getElementById('rouletteRangeEnd');
  if (levels.length && start && end) {
    const ranks = levels.map(level => Number(level.rank));
    start.min = String(Math.min(...ranks));
    start.max = String(Math.max(...ranks));
    end.min = String(Math.min(...ranks));
    end.max = String(Math.max(...ranks));
    if (!start.value || Number(start.value) < Number(start.min)) start.value = start.min;
    if (!end.value || Number(end.value) > Number(end.max)) end.value = end.max;
  }

  currentRun = loadRun();
  renderCurrentLevel();
  if (currentRun?.status === 'active') {
    setMessage(`Restored your saved run. Current target: ${currentRun.requiredPercent}%.`);
  }
}

export function bindRouletteControls() {
  if (handlersBound) return;
  handlersBound = true;
  document.getElementById('rouletteStartBtn')?.addEventListener('click', startRun);
  document.getElementById('rouletteResetBtn')?.addEventListener('click', resetRun);
  document.getElementById('rouletteExportBtn')?.addEventListener('click', exportRun);
  document.getElementById('rouletteImportBtn')?.addEventListener('click', () => {
    document.getElementById('rouletteImportFile')?.click();
  });
  document.getElementById('rouletteImportFile')?.addEventListener('change', event => {
    importRunFile(event.target.files?.[0]);
    event.target.value = '';
  });
}

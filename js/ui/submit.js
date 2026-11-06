// js/ui/submit.js
import { getNormalizedListType } from '../utils.js';
import { submitRecordData, fetchPreviousSubmissions } from '../api.js';
import { uiState } from './list.js';
import { CONFIG } from '../config.js';

let activeSubmissionList = 'demon';

export function populateExistingLevelsDropdown() {
  const select = document.getElementById('existingLevel');
  if (!select) return;

  const previousValue = select.value;
  select.replaceChildren();

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select a level';
  select.appendChild(placeholder);

  const filtered = (uiState.allLevels || [])
    .filter(level => getNormalizedListType(level) === activeSubmissionList)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

  filtered.forEach(level => {
    const option = document.createElement('option');
    option.value = String(level.name || level.levelName || '');
    option.dataset.id = String(level.id || '');
    option.dataset.creator = String(level.creator || '');
    option.textContent = `${level.name || level.levelName || 'Unnamed'}${level.creator ? ` — ${level.creator}` : ''}`;
    select.appendChild(option);
  });

  if ([...select.options].some(option => option.value === previousValue)) {
    select.value = previousValue;
  }
  if (filtered.length === 0) {
    placeholder.textContent = 'No levels are currently available in this list';
  }
}

export function setSubmissionListType(type) {
  activeSubmissionList = type === 'challenge' ? 'challenge' : 'demon';

  const classicTab = document.getElementById('submitTabDemon');
  const challengeTab = document.getElementById('submitTabChallenge');
  classicTab?.classList.toggle('active', activeSubmissionList === 'demon');
  challengeTab?.classList.toggle('active', activeSubmissionList === 'challenge');
  classicTab?.setAttribute('aria-selected', String(activeSubmissionList === 'demon'));
  challengeTab?.setAttribute('aria-selected', String(activeSubmissionList === 'challenge'));

  populateExistingLevelsDropdown();
}

export function handleListTypeChange() {
  const select = document.getElementById('listType');
  if (select) setSubmissionListType(select.value);
}

export function toggleFormFields() {
  // Kept as a no-op so older inline handlers do not break.
}

function updateNotesCounter() {
  const notes = document.getElementById('additionalNotes');
  const counter = document.getElementById('notesCounter');
  if (notes && counter) counter.textContent = `${notes.value.length.toLocaleString()} / 2,000`;
}

function getSubmissionLevel(item) {
  const expectedType = item.listType === 'challenge' ? 'challenge' : 'demon';
  const matchingList = (uiState.allLevels || []).filter(level =>
    getNormalizedListType(level) === expectedType
  );

  const wantedId = String(item.levelId || '').trim();
  if (wantedId) {
    const byId = matchingList.find(level => String(level.id || '').trim() === wantedId);
    if (byId) return byId;
  }

  const wantedName = String(item.levelName || '').trim().toLowerCase();
  return matchingList.find(level =>
    String(level.name || level.levelName || '').trim().toLowerCase() === wantedName
  ) || null;
}

function setPreviousMessage(container, message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'previous-empty';
  messageElement.textContent = message;
  container.replaceChildren(messageElement);
}

function renderPreviousSubmissions(items) {
  const container = document.getElementById('previousSubmissionsList');
  if (!container) return;
  container.replaceChildren();

  if (!items.length) {
    setPreviousMessage(container, 'No previous submissions were found for that username and campus.');
    return;
  }

  items.forEach(item => {
    const level = getSubmissionLevel(item);
    const row = document.createElement('div');
    row.className = 'previous-submission-row';

    const thumb = document.createElement('img');
    thumb.className = 'previous-submission-thumb';
    thumb.alt = '';
    thumb.loading = 'lazy';
    thumb.src = level?.img || CONFIG.IMAGES.FALLBACK_THUMBNAIL;
    thumb.onerror = () => {
      thumb.onerror = null;
      thumb.src = CONFIG.IMAGES.FALLBACK_THUMBNAIL;
    };

    const info = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'previous-submission-name';
    name.textContent = item.levelName || 'Unknown level';

    const rank = document.createElement('div');
    rank.className = 'previous-submission-rank';
    const placement = Number(level?.rank) > 0 ? `#${level.rank}` : 'Placement unavailable';
    rank.textContent = `${placement} · ${item.listType === 'challenge' ? 'Challenge List' : 'Classic'}`;
    info.append(name, rank);

    const statusKey = ['accepted', 'rejected', 'pending'].includes(String(item.status || '').toLowerCase())
      ? String(item.status).toLowerCase()
      : 'pending';
    const status = document.createElement('span');
    status.className = `submission-status ${statusKey}`;
    status.textContent = statusKey.toUpperCase();

    row.append(thumb, info, status);
    container.appendChild(row);
  });
}

export async function refreshPreviousSubmissions() {
  const username = document.getElementById('username')?.value.trim();
  const campus = document.getElementById('campus')?.value.trim();
  const container = document.getElementById('previousSubmissionsList');
  if (!container) return;

  if (!username || !campus) {
    setPreviousMessage(container, 'Enter your Geometry Dash username and campus first.');
    return;
  }

  setPreviousMessage(container, 'Loading your submissions…');
  try {
    const items = await fetchPreviousSubmissions(username, campus);
    renderPreviousSubmissions(items);
  } catch (error) {
    console.error('Previous submissions error:', error);
    setPreviousMessage(container, error.message || 'Could not load previous submissions. Please try again.');
  }
}

export function bindSubmitHandler() {
  const button = document.getElementById('submitBtn');
  if (!button || button.dataset.bound === 'true') return;
  button.dataset.bound = 'true';

  const notesField = document.getElementById('additionalNotes');
  notesField?.addEventListener('input', updateNotesCounter);
  document.getElementById('refreshSubmissionsBtn')?.addEventListener('click', refreshPreviousSubmissions);
  updateNotesCounter();

  button.addEventListener('click', async () => {
    const originalText = button.textContent;
    try {
      const usernameField = document.getElementById('username');
      const campusField = document.getElementById('campus');
      const recordLinkField = document.getElementById('recordLink');
      const deviceField = document.getElementById('device');
      const modMenuField = document.getElementById('modMenu');
      const customIdField = document.getElementById('customId');
      const levelSelect = document.getElementById('existingLevel');

      const username = usernameField?.value.trim() || '';
      const campus = campusField?.value.trim() || '';
      const recordLink = recordLinkField?.value.trim() || '';
      const device = deviceField?.value || '';
      const modMenu = modMenuField?.value || '';
      const notes = notesField?.value.trim() || '';
      const customId = customIdField?.value.trim() || '';
      const selectedOption = levelSelect?.options[levelSelect.selectedIndex];
      const levelName = levelSelect?.value || '';

      if (!username || !campus || !recordLink || !device || !modMenu || !levelName) {
        throw new Error('Please complete all required fields.');
      }
      if (notes.length > 2000) throw new Error('Additional Notes cannot exceed 2,000 characters.');
      if (modMenu === 'Other' && !notes) {
        throw new Error('Please specify your mod menu in Additional Notes.');
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(recordLink);
      } catch (_) {
        throw new Error('Please enter a valid completion link.');
      }
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Please enter a valid completion link.');
      }

      button.disabled = true;
      button.textContent = 'Submitting…';

      await submitRecordData({
        type: 'record',
        listType: activeSubmissionList,
        username,
        campus,
        recordLink,
        levelName,
        id: customId || selectedOption?.dataset.id || '',
        creator: selectedOption?.dataset.creator || '',
        device,
        modMenu,
        notes
      });

      window.alert('Your record has been submitted for moderator review.');
      if (recordLinkField) recordLinkField.value = '';
      if (customIdField) customIdField.value = '';
      if (notesField) notesField.value = '';
      updateNotesCounter();
      await refreshPreviousSubmissions();
    } catch (error) {
      console.error('[Submission Error]', error);
      window.alert(`Submission Error: ${error.message}`);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
}

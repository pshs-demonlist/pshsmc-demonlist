// js/ui/submit.js
import { getNormalizedListType } from '../utils.js';
import { submitRecordData, fetchPreviousSubmissions } from '../api.js';
import { uiState } from './list.js';
import { CONFIG } from '../config.js';

const LEVEL_LENGTHS = ['tiny', 'short', 'medium', 'long', 'xl'];
const NEW_LEVEL_OPTION = '__add_new_level__';
let activeSubmissionList = 'demon';

function getLevelName(level) {
  return String(level?.name || level?.levelName || 'Unnamed').trim();
}

function getLevelPlacement(level) {
  const rank = Number(level?.rank);
  return Number.isFinite(rank) && rank > 0 ? rank : Number.POSITIVE_INFINITY;
}

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
    .filter(level => {
      const id = String(level?.id || '').trim();
      return getNormalizedListType(level) === activeSubmissionList && /^\d+$/.test(id);
    })
    .slice()
    .sort((a, b) => {
      const rankDifference = getLevelPlacement(a) - getLevelPlacement(b);
      if (rankDifference !== 0) return rankDifference;
      return getLevelName(a).localeCompare(getLevelName(b));
    });

  filtered.forEach(level => {
    const option = document.createElement('option');
    const rank = getLevelPlacement(level);
    const rankText = Number.isFinite(rank) ? `#${rank} ` : '';

    option.value = String(level.id || '').trim();
    option.dataset.id = option.value;
    option.dataset.name = getLevelName(level);
    option.dataset.creator = String(level.creator || '').trim();
    option.textContent = `${rankText}${getLevelName(level)}${level.creator ? ` — ${level.creator}` : ''}`;

    select.appendChild(option);
  });

  const addNewOption = document.createElement('option');
  addNewOption.value = NEW_LEVEL_OPTION;
  addNewOption.textContent = '＋ Add a new level…';
  select.appendChild(addNewOption);

  if ([...select.options].some(option => option.value === previousValue)) {
    select.value = previousValue;
  }

  if (filtered.length === 0) {
    placeholder.textContent = 'No existing levels available — add a new one';
  }

  updateNewLevelVisibility();
}

function updateNewLevelVisibility() {
  const select = document.getElementById('existingLevel');
  const wrapper = document.getElementById('newLevelFields');
  const nameField = document.getElementById('newLevelName');
  const creatorField = document.getElementById('newCreator');
  const customIdField = document.getElementById('customId');
  const customIdLabel = document.getElementById('customIdLabel');
  const customIdHelp = document.getElementById('customIdHelp');

  const isNewLevel = select?.value === NEW_LEVEL_OPTION;

  if (wrapper) wrapper.hidden = !isNewLevel;
  if (nameField) nameField.required = Boolean(isNewLevel);
  if (creatorField) creatorField.required = Boolean(isNewLevel);

  if (customIdField) {
    customIdField.required = Boolean(isNewLevel);
    customIdField.placeholder = isNewLevel
      ? 'Required: numeric Geometry Dash level ID'
      : 'Only if needed';
  }

  if (customIdLabel) {
    customIdLabel.innerHTML = isNewLevel
      ? 'Level ID <span class="optional-label">Required</span>'
      : 'Custom ID <span class="optional-label">Optional</span>';
  }

  if (customIdHelp) {
    customIdHelp.textContent = isNewLevel
      ? 'Enter the numeric Geometry Dash level ID. The new level is added only after moderator approval.'
      : 'Optional ID override for an existing level.';
  }
}

function updateChallengeLengthVisibility() {
  const wrapper = document.getElementById('challengeLengthField');
  const select = document.getElementById('levelLength');
  const visible = activeSubmissionList === 'challenge';

  if (wrapper) wrapper.hidden = !visible;

  if (select) {
    select.required = visible;
    if (!visible) select.value = '';
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

  updateChallengeLengthVisibility();
  populateExistingLevelsDropdown();
}

export function handleListTypeChange() {
  const select = document.getElementById('listType');
  if (select) setSubmissionListType(select.value);
}

export function toggleFormFields() {
  // Kept as a no-op for compatibility with old inline references.
}

function updateNotesCounter() {
  const notes = document.getElementById('additionalNotes');
  const counter = document.getElementById('notesCounter');

  if (notes && counter) {
    counter.textContent = `${notes.value.length.toLocaleString()} / 2,000`;
  }
}

function getSubmissionLevel(item) {
  const expectedType = item.listType === 'challenge' ? 'challenge' : 'demon';

  const matchingList = (uiState.allLevels || []).filter(level =>
    getNormalizedListType(level) === expectedType
  );

  const wantedId = String(item.levelId || '').trim();

  if (wantedId) {
    const byId = matchingList.find(
      level => String(level.id || '').trim() === wantedId
    );

    if (byId) return byId;
  }

  const wantedName = String(item.levelName || '').trim().toLowerCase();
  const wantedCreator = String(item.creator || '').trim().toLowerCase();

  const byNameAndCreator = matchingList.find(level =>
    getLevelName(level).toLowerCase() === wantedName &&
    String(level.creator || '').trim().toLowerCase() === wantedCreator
  );

  if (byNameAndCreator) return byNameAndCreator;

  return matchingList.find(level =>
    getLevelName(level).toLowerCase() === wantedName
  ) || null;
}

function setPreviousMessage(container, message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'previous-empty';
  messageElement.textContent = message;
  container.replaceChildren(messageElement);
}

function formatSubmissionDate(value, fallbackValue) {
  const parsed = value ? new Date(value) : null;
  const fallback = fallbackValue ? new Date(fallbackValue) : null;

  const date = parsed && !Number.isNaN(parsed.getTime())
    ? parsed
    : fallback && !Number.isNaN(fallback.getTime())
      ? fallback
      : null;

  if (!date) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Manila'
  }).format(date);
}

function getRecordThumbnail(recordLink) {
  const value = String(recordLink || '').trim();

  const match = value.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i
  );

  return match?.[1]
    ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
    : '';
}

function createPreviousSubmissionBar(item) {
  const level = getSubmissionLevel(item);

  const row = document.createElement('article');
  row.className = 'previous-level-bar';

  const background = document.createElement('img');
  background.className = 'previous-level-bar-image';
  background.alt = '';
  background.loading = 'lazy';
  background.src =
    level?.img ||
    getRecordThumbnail(item.recordLink) ||
    CONFIG.IMAGES.FALLBACK_THUMBNAIL;

  background.onerror = () => {
    background.onerror = null;
    background.src = CONFIG.IMAGES.FALLBACK_THUMBNAIL;
  };

  const overlay = document.createElement('div');
  overlay.className = 'previous-level-bar-overlay';

  const left = document.createElement('div');
  left.className = 'previous-level-bar-title';

  const rank = document.createElement('span');
  rank.className = 'previous-level-bar-rank';

  const placement = Number(level?.rank);
  rank.textContent =
    Number.isFinite(placement) && placement > 0
      ? `#${placement}`
      : '#—';

  const name = document.createElement('span');
  name.className = 'previous-level-bar-name';
  name.textContent = item.levelName || 'Unknown level';

  left.append(rank, name);

  const statusKey = ['accepted', 'rejected', 'pending'].includes(
    String(item.status || '').toLowerCase()
  )
    ? String(item.status).toLowerCase()
    : 'pending';

  const status = document.createElement('span');
  status.className = `previous-level-bar-status ${statusKey}`;
  status.textContent = statusKey.toUpperCase();

  const dateBlock = document.createElement('div');
  dateBlock.className = 'previous-level-bar-date';

  const dateLabel = document.createElement('span');
  dateLabel.textContent = 'Last updated on:';

  const dateValue = document.createElement('time');
  dateValue.textContent = formatSubmissionDate(level?.date, item.date);

  dateBlock.append(dateLabel, dateValue);

  overlay.append(left, status, dateBlock);
  row.append(background, overlay);

  row.setAttribute(
    'aria-label',
    `${rank.textContent} ${name.textContent}, ${status.textContent}`
  );

  return row;
}

function renderPreviousSubmissions(items) {
  const container = document.getElementById('previousSubmissionsList');
  if (!container) return;

  container.replaceChildren();

  if (!items.length) {
    setPreviousMessage(
      container,
      'No previous submissions were found for that username and campus.'
    );
    return;
  }

  items.forEach(item => {
    container.appendChild(createPreviousSubmissionBar(item));
  });
}

export async function refreshPreviousSubmissions() {
  const username = document.getElementById('username')?.value.trim();

  const campus = String(
    document.getElementById('campus')?.value || ''
  ).trim().replace(/\s+/g, ' ');

  const container = document.getElementById('previousSubmissionsList');

  if (!container) return;

  if (!username || !campus) {
    setPreviousMessage(
      container,
      'Enter your Geometry Dash username and campus first.'
    );
    return;
  }

  setPreviousMessage(container, 'Loading your submissions…');

  try {
    const items = await fetchPreviousSubmissions(username, campus);
    renderPreviousSubmissions(items);
  } catch (error) {
    console.error('Previous submissions error:', error);

    setPreviousMessage(
      container,
      error.message || 'Could not load previous submissions. Please try again.'
    );
  }
}

export function bindSubmitHandler() {
  const button = document.getElementById('submitBtn');

  if (!button || button.dataset.bound === 'true') return;

  button.dataset.bound = 'true';

  const notesField = document.getElementById('additionalNotes');
  const levelSelectForEvents = document.getElementById('existingLevel');

  notesField?.addEventListener('input', updateNotesCounter);
  levelSelectForEvents?.addEventListener('change', updateNewLevelVisibility);

  document
    .getElementById('refreshSubmissionsBtn')
    ?.addEventListener('click', refreshPreviousSubmissions);

  updateNotesCounter();
  updateChallengeLengthVisibility();
  updateNewLevelVisibility();

  button.addEventListener('click', async () => {
    const originalText = button.textContent;

    if (button.disabled) return;

    button.disabled = true;
    button.textContent = 'Submitting…';

    try {
      const usernameField = document.getElementById('username');
      const campusField = document.getElementById('campus');
      const recordLinkField = document.getElementById('recordLink');
      const deviceField = document.getElementById('device');
      const modMenuField = document.getElementById('modMenu');
      const customIdField = document.getElementById('customId');
      const levelSelect = document.getElementById('existingLevel');
      const levelLengthField = document.getElementById('levelLength');
      const newLevelNameField = document.getElementById('newLevelName');
      const newCreatorField = document.getElementById('newCreator');

      const username = usernameField?.value.trim() || '';

      const campus = String(campusField?.value || '')
        .trim()
        .replace(/\s+/g, ' ');

      const recordLink = recordLinkField?.value.trim() || '';
      const device = deviceField?.value.trim() || '';
      const modMenu = modMenuField?.value.trim() || '';
      const notes = notesField?.value || '';
      const customId = customIdField?.value.trim() || '';

      const selectedOption =
        levelSelect?.options[levelSelect.selectedIndex];

      const isNewLevel = levelSelect?.value === NEW_LEVEL_OPTION;

      const levelName = isNewLevel
        ? String(newLevelNameField?.value || '').trim()
        : String(selectedOption?.dataset.name || '').trim();

      const creator = isNewLevel
        ? String(newCreatorField?.value || '').trim()
        : String(selectedOption?.dataset.creator || '').trim();

      const selectedLevelId = isNewLevel
        ? ''
        : String(selectedOption?.dataset.id || '').trim();

      const levelLength = activeSubmissionList === 'challenge'
        ? String(levelLengthField?.value || '').trim().toLowerCase()
        : '';

      // Validation
      if (
        !username ||
        !campus ||
        !recordLink ||
        !device ||
        !modMenu ||
        !levelName
      ) {
        throw new Error('Please complete all required fields.');
      }

      if (isNewLevel && (!creator || !/^\d+$/.test(customId))) {
        throw new Error(
          'For a new level, enter its creator and numeric Geometry Dash Level ID.'
        );
      }

      if (!isNewLevel && !selectedLevelId) {
        throw new Error(
          'The selected level is missing its database ID. Please refresh the page.'
        );
      }

      if (customId && !/^\d+$/.test(customId)) {
        throw new Error(
          'The Level ID / Custom ID must contain numbers only.'
        );
      }

      if (
        activeSubmissionList === 'challenge' &&
        !LEVEL_LENGTHS.includes(levelLength)
      ) {
        throw new Error(
          'Please select a Level Length for your Challenge List submission.'
        );
      }

      if (notes.length > 2000) {
        throw new Error('Additional Notes cannot exceed 2,000 characters.');
      }

      if (modMenu === 'Other' && !notes.trim()) {
        throw new Error(
          'Please specify your mod menu in Additional Notes.'
        );
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

      const payload = {
        type: 'record',
        listType: activeSubmissionList,
        username,
        campus,
        recordLink,
        levelName,
        id: customId || selectedLevelId,
        selectedLevelId,
        creator,
        isNewLevel,
        device,
        modMenu,
        notes,
        additionalNotes: notes,
        levelLength
      };

      // Submit once. Never automatically retry an uncertain submission.
      const result = await submitRecordData(payload);

      if (result?.status === 'error') {
        throw new Error(
          result.message || 'The server rejected the submission.'
        );
      }

      if (result?.status === 'unconfirmed') {
        window.alert(
          'Submission status unconfirmed.\n\n' +
          (result.message || 'The website could not verify the server response.') +
          '\n\nCheck Previous Submissions before trying again to avoid duplicates.'
        );

        await refreshPreviousSubmissions();
        return;
      }

      if (result?.status !== 'ok') {
        throw new Error(
          'The server returned an unexpected response. Check Previous Submissions before trying again.'
        );
      }

      window.alert('Your record has been submitted for moderator review.');

      // Clear the form only after confirmation.
      if (recordLinkField) recordLinkField.value = '';
      if (customIdField) customIdField.value = '';
      if (notesField) notesField.value = '';
      if (levelLengthField) levelLengthField.value = '';
      if (newLevelNameField) newLevelNameField.value = '';
      if (newCreatorField) newCreatorField.value = '';
      if (levelSelect) levelSelect.value = '';

      updateNotesCounter();
      updateNewLevelVisibility();

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

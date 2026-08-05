import { uiState } from './list.js';
import { submitRecordData } from '../api.js';

export function toggleFormFields() {
  const s = document.getElementById('submissionType');
  if (!s) return;

  const eWrap = document.getElementById('existingLevelWrap');
  const nFields = document.getElementById('newLevelFields');

  if (s.value === 'newLevel') {
    if (eWrap) eWrap.style.display = 'none';
    if (nFields) nFields.style.display = 'block';
  } else {
    if (eWrap) eWrap.style.display = 'block';
    if (nFields) nFields.style.display = 'none';
  }
}

export function populateExistingLevelsDropdown() {
  const selectEl = document.getElementById('existingLevel');
  if (!selectEl) return;

  // Clear existing options
  selectEl.innerHTML = '';

  // Populate from uiState.allLevels (safe-guarded)
  const levels = Array.isArray(uiState.allLevels) ? uiState.allLevels : [];
  // Add a default empty option
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '-- Select Level --';
  selectEl.appendChild(defaultOpt);

  levels.forEach(lvl => {
    try {
      const opt = document.createElement('option');
      const name = String(lvl.name || lvl.levelName || lvl.id || '').trim();
      opt.value = name;
      opt.textContent = name || (lvl.id ? String(lvl.id) : 'Unnamed');
      if (lvl.id) opt.dataset.id = String(lvl.id);
      if (lvl.creator) opt.dataset.creator = String(lvl.creator);
      selectEl.appendChild(opt);
    } catch (e) {
      // ignore malformed level entries
    }
  });
}

export function handleListTypeChange() {
  populateExistingLevelsDropdown();
  toggleFormFields();
}

export function bindSubmitHandler() {
  const btn = document.getElementById('submitBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const ogText = btn.textContent;
    try {
      // If auth subsystem is available, require sign-in before submitting.
      // If it's not available (e.g., removed/disabled), allow anonymous submission.
      if (window.pshsmcAuth && typeof window.pshsmcAuth.isAuthenticated === 'function') {
        if (!window.pshsmcAuth.isAuthenticated()) {
          try {
            await window.pshsmcAuth.openAuthModalAndWaitForSuccess({ message: "Oops — you need to sign up/sign in first. Don't worry — we will only ask for your GD Username and ask you to set a password stored locally." });
          } catch (authErr) {
            // user cancelled or sign-in failed; abort submission
            console.warn('User did not authenticate or cancelled auth:', authErr);
            return;
          }
        }
      } else {
        // Auth not present: proceed but log so maintainers know anonymous submissions happened
        console.info('Auth subsystem not available; proceeding anonymously.');
      }

      const userEl = document.getElementById('username');
      const linkEl = document.getElementById('recordLink');
      const campusEl = document.getElementById('campus');
      const subtypeEl = document.getElementById('submissionType');
      const listTypeEl = document.getElementById('listType');

      const user = userEl ? userEl.value.trim() : '';
      const link = linkEl ? linkEl.value.trim() : '';
      const campus = campusEl ? campusEl.value.trim() : '';
      const subType = subtypeEl ? subtypeEl.value : 'record';
      const listType = listTypeEl ? listTypeEl.value : '';

      if (!user || !link || !campus) {
        throw new Error('Missing required fields. Please fill in Username, Record Link, and Campus.');
      }

      const urlRegex = /^(https?:\/\/)?([a-z\d-]+\.)+[a-z]{2,63}(\/[^\n\s]*)?$/i;
      if (!urlRegex.test(link)) {
        throw new Error('Invalid Record Link format. Please provide a valid URL.');
      }

      btn.textContent = 'Submitting...';
      btn.disabled = true;

      const payload = { username: user, recordLink: link, campus: campus, type: subType, listType: listType };

      if (subType === 'record') {
        const selectEl = document.getElementById('existingLevel');
        if (!selectEl) throw new Error('Existing level element registry missing.');
        if (!selectEl.value) throw new Error('Please select an existing level from the dropdown.');

        const activeOpt = selectEl.options[selectEl.selectedIndex];
        payload.levelName = selectEl.value;
        payload.id = activeOpt ? (activeOpt.dataset.id || '') : '';
        payload.creator = activeOpt ? (activeOpt.dataset.creator || '') : '';
      } else {
        const newNameEl = document.getElementById('newName');
        const newCreatorEl = document.getElementById('newCreator');
        const newLevelIdEl = document.getElementById('newLevelId');
        payload.newName = newNameEl ? newNameEl.value.trim() : '';
        payload.newCreator = newCreatorEl ? newCreatorEl.value.trim() : '';
        payload.newLevelId = newLevelIdEl ? newLevelIdEl.value.trim() : '';

        if (!payload.newName || !payload.newCreator) {
          throw new Error('Name and Creator are required when submitting a new level.');
        }
        const diffEl = document.getElementById('newDifficulty');
        if (diffEl) payload.difficulty = diffEl.value;
      }

      // send to server
      await submitRecordData(payload);
      await new Promise(r => setTimeout(r, 600));
      alert('Success! Your submission has been sent for staff review.');

      if (userEl) userEl.value = '';
      if (linkEl) linkEl.value = '';
      if (document.getElementById('newName')) document.getElementById('newName').value = '';
      if (document.getElementById('newCreator')) document.getElementById('newCreator').value = '';
      if (document.getElementById('newLevelId')) document.getElementById('newLevelId').value = '';

    } catch (err) {
      console.error('[Submission Error Detail]:', err);
      alert('Submission Error: ' + (err && err.message ? err.message : String(err)));
    } finally {
      btn.textContent = ogText;
      btn.disabled = false;
    }
  });
}

// js/ui/submit.js
import { escapeHTML, getNormalizedListType } from '../utils.js';
import { submitRecordData } from '../api.js';
import { uiState } from './list.js';

// --- SUBMISSIONS & FORMS ---
export function populateExistingLevelsDropdown() {
  const d = document.getElementById('existingLevel');
  const t = document.getElementById('listType');
  if (!d || !t) return;
  d.innerHTML = '';
  const filtered = uiState.allLevels.filter(l => getNormalizedListType(l) === t.value);
  filtered.forEach(l => {
    const opt = document.createElement('option');
    opt.value = escapeHTML(l.name || l.levelName);
    opt.dataset.id = escapeHTML(String(l.id || ''));
    opt.dataset.creator = escapeHTML(l.creator || '');
    opt.textContent = `${escapeHTML(l.name || l.levelName)} (by ${escapeHTML(l.creator || 'Unknown')})`;
    d.appendChild(opt);
  });
}

export function toggleFormFields() {
  const t = document.getElementById("listType");
  const s = document.getElementById("submissionType");
  if (!t || !s) return;
  
  const eWrap = document.getElementById("existingLevelWrap");
  const nFields = document.getElementById("newLevelFields");
  
  if (s.value === "newLevel") {
    if (eWrap) eWrap.style.display = "none";
    if (nFields) nFields.style.display = "block";
  } else {
    if (eWrap) eWrap.style.display = "block";
    if (nFields) nFields.style.display = "none";
  }
}

export function handleListTypeChange() {
  populateExistingLevelsDropdown();
  toggleFormFields();
}

export function bindSubmitHandler() {
  const btn = document.getElementById('submitBtn');
  if(!btn) return;

  btn.addEventListener('click', async () => {
    const ogText = btn.textContent;
    try {
      const user = document.getElementById('username').value.trim();
      const link = document.getElementById('recordLink').value.trim();
      const campus = document.getElementById('campus').value.trim();
      const subType = document.getElementById('submissionType').value;
      const listType = document.getElementById('listType').value;

      if (!user || !link || !campus) {
        throw new Error("Missing required fields. Please fill in Username, Record Link, and Campus.");
      }

      const urlRegex = /^(https?:\/\/)?([a-z\d-]+\.)+[a-z]{2,63}(\/[^\s]*)?$/i;
      if (!urlRegex.test(link)) {
        throw new Error("Invalid Record Link format. Please provide a valid URL.");
      }

      btn.textContent = "Submitting...";
      btn.disabled = true;

      let payload = { username: user, recordLink: link, campus: campus, type: subType, listType: listType };

      if (subType === 'record') {
        const selectEl = document.getElementById('existingLevel');
        if (!selectEl) throw new Error("Existing level element registry missing.");
        if (!selectEl.value) throw new Error("Please select an existing level from the dropdown.");
        
        const activeOpt = selectEl.options[selectEl.selectedIndex];
        payload.levelName = selectEl.value;
        payload.id = activeOpt ? (activeOpt.dataset.id || '') : '';
        payload.creator = activeOpt ? (activeOpt.dataset.creator || '') : '';
      } else {
        payload.newName = document.getElementById('newName').value.trim();
        payload.newCreator = document.getElementById('newCreator').value.trim();
        payload.newLevelId = document.getElementById('newLevelId').value.trim();
        
        if (!payload.newName || !payload.newCreator) {
          throw new Error("Name and Creator are required when submitting a new level.");
        }
        const diffEl = document.getElementById('newDifficulty');
        if (diffEl) payload.difficulty = diffEl.value;
      }

      await submitRecordData(payload);
      await new Promise(r => setTimeout(r, 600));
      alert("Success! Your submission has been sent for staff review.");
      
      document.getElementById('username').value = '';
      document.getElementById('recordLink').value = '';
      if(document.getElementById('newName')) document.getElementById('newName').value = '';
      if(document.getElementById('newCreator')) document.getElementById('newCreator').value = '';
      if(document.getElementById('newLevelId')) document.getElementById('newLevelId').value = '';
      
    } catch (err) {
      console.error("[Submission Error Detail]:", err);
      alert("Submission Error: " + err.message);
    } finally {
      btn.textContent = ogText;
      btn.disabled = false;
    }
  });
}

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
      // If user is not authenticated, prompt them to sign in / sign up first
      try {
        if (!window.pshsmcAuth || !window.pshsmcAuth.isAuthenticated || !window.pshsmcAuth.isAuthenticated()) {
          await window.pshsmcAuth.openAuthModalAndWaitForSuccess({ message: "Oops — you need to sign up/sign in first. Don't worry — we will only ask for your GD Username and ask you to set a password to help verify it's actually you." });
        }
      } catch (authErr) {
        // user cancelled or auth not available
        console.warn('User did not authenticate:', authErr);
        return;
      }

      const user = document.getElementById('username').value.trim();
      const link = document.getElementById('recordLink').value.trim();
      const campus = document.getElementById('campus').value.trim();
      const subType = document.getElementById('submissionType').value;
      const listType = document.getElementById('listType').value;

      if (!user || !link || !campus) {
        throw new Error("Missing required fields. Please fill in Username, Record Link, and Campus.");
      }

      const urlRegex = /^(https?:\/\/)?([a-z\d-]+\.)+[a-z]{2,63}(\/[^\n\s]*)?$/i;
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

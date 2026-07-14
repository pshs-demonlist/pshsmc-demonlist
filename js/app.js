// js/app.js
import { loadDatabase } from './api.js';
import * as UI from './ui/index.js';
import { handleHashRouteOnLoad } from './ui/modal.js';

function safeExecute(fn, context) {
  try {
    fn();
  } catch (err) {
    console.error(`[Runtime Guard] Error during execution of ${context}:`, err);
  }
}

async function initApp() {
  UI.clearUIFieldsToZero();
  
  const result = await loadDatabase();
  const fetchedLevels = result.levels;
  
  if (result.fromCache) {
  console.warn("[Offline] Using cached database.");
  }
  
  if (!fetchedLevels || fetchedLevels.length === 0) {
    console.error("[Critical] Master database array is completely empty or failed to load.");
    UI.displayFallbackUIMessage("list", "Failed to sync remote data. Verify your GitHub levels.json structure.");
    UI.displayFallbackUIMessage("liveChangelogFeed", "Offline. Could not fetch recent changes.");
    UI.displayFallbackUIMessage("leaderboardBody", "Offline. No stats available.");
    return;
  }
  
  // Inject the fetched data into our UI State
  UI.uiState.allLevels = fetchedLevels;
  
  safeExecute(UI.processLiveDecayFilterAndNews, "Changelog Pipeline");
  safeExecute(UI.calculateCounterMetrics, "Global Metrics");
  safeExecute(UI.populateCampusDropdownFilters, "Campus Filters");
  safeExecute(UI.renderLevelsDashboard, "Main Dashboard View");
  safeExecute(UI.populateExistingLevelsDropdown, "Form Dropdowns");
  safeExecute(UI.renderStatsLeaderboard, "Stats Viewer View");
}

// --- DOM INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
  console.log("[Demonlist] DOM mounted. Initializing modular application engine...");
  
  if (localStorage.getItem('pshsmc_theme') === 'light') {
  document.body.classList.add('light-theme');
  }

  UI.updateThemeToggleText();

  // Initialize app and then bind handlers and handle any incoming hash route
  initApp().then(() => {
    UI.bindSubmitHandler();
    // After data and UI are ready, let the hash router show the initial route if present
    try { handleHashRouteOnLoad(); } catch (err) { console.error('Error during initial route handling', err); }
  });
});

// --- GLOBAL BINDINGS FOR HTML ONCLICK ATTRIBUTES ---
// Because we are using ES Modules, we must explicitly attach UI functions 
// to the window object so your HTML inline onclick attributes still work.
window.toggleNavMenu = UI.toggleNavMenu;
window.closeNavMenu = UI.closeNavMenu;
window.switchPage = UI.switchPage;
window.goToLevelsDashboard = UI.goToLevelsDashboard;
window.goToSubmissionBox = UI.goToSubmissionBox;
window.openGuidelinesModal = UI.openGuidelinesModal;
window.closeGuidelinesModal = UI.closeGuidelinesModal;
window.toggleThemeMode = UI.toggleThemeMode;
window.switchMainListTab = UI.switchMainListTab;
window.renderLevelsDashboard = UI.renderLevelsDashboard;
window.switchStatsPageListTab = UI.switchStatsPageListTab;
window.renderStatsLeaderboard = UI.renderStatsLeaderboard;
window.viewPlayerVideo = UI.viewPlayerVideo;
window.toggleFormFields = UI.toggleFormFields;
window.handleListTypeChange = UI.handleListTypeChange;

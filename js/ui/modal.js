// js/ui/modal.js
import { renderLevelsDashboard } from './list.js';

// --- NAVIGATION & CORE UI ---
export function toggleNavMenu() {
  const menu = document.getElementById("navMenu");
  if (menu) menu.classList.toggle("open");
}

export function closeNavMenu() {
  const menu = document.getElementById("navMenu");
  if (menu) menu.classList.remove("open");
}

export function switchPage(pageId) {
  closeNavMenu();
  const mainVid = document.getElementById('video');
  const playerVid = document.getElementById('pvVideo');
  if (mainVid) mainVid.innerHTML = '';
  if (playerVid) playerVid.innerHTML = '';

  const corePages = ['landingPage', 'levelsPage', 'statsPage', 'detailPage', 'playerVideoPage'];
  corePages.forEach(id => {
    const pageEl = document.getElementById(id);
    if (pageEl) {
      pageEl.style.display = 'none';
      pageEl.classList.remove('active-page');
    }
  });

  const targetPage = document.getElementById(pageId + 'Page');
  if (targetPage) {
    targetPage.style.display = 'block';
    targetPage.classList.add('active-page');
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

export function goToLevelsDashboard() {
  switchPage('levels');
  const sBox = document.getElementById('submissionBox');
  if (sBox) sBox.style.display = 'block';
  renderLevelsDashboard();
}

export function goToSubmissionBox() {
  switchPage('levels');
  setTimeout(() => {
    const sBox = document.getElementById('submissionBox');
    if (sBox) sBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 80);
}

export function openGuidelinesModal() {
  closeNavMenu();
  const modal = document.getElementById("guidelinesModal");
  if (modal) modal.style.display = "flex";
}

export function closeGuidelinesModal() {
  const modal = document.getElementById("guidelinesModal");
  if (modal) modal.style.display = "none";
}

export function updateThemeToggleText() {
  const toggleButton = document.getElementById('themeToggle');
  if (!toggleButton) return;

  toggleButton.textContent = document.body.classList.contains('light-theme') ? 'Toggle Dark Mode' : 'Toggle Light Mode';
}

export function toggleThemeMode() {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  localStorage.setItem('pshsmc_theme', isLight ? 'light' : 'dark');
  updateThemeToggleText();
  closeNavMenu();
}

export function displayFallbackUIMessage(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = `<div style="color:var(--accent); text-align:center; padding:20px; font-size:13px;">${message}</div>`;
}

export function showOfflineBanner(message) {
  const banner = document.getElementById("offlineBanner");
  if (!banner) return;
  banner.textContent = message;
  banner.hidden = false;
}

// Global UI Attachments
window.switchPage = switchPage;
window.goToLevelsDashboard = goToLevelsDashboard;
window.goToSubmissionBox = goToSubmissionBox;
window.toggleNavMenu = toggleNavMenu;
window.closeNavMenu = closeNavMenu;
window.openGuidelinesModal = openGuidelinesModal;
window.closeGuidelinesModal = closeGuidelinesModal;
window.toggleThemeMode = toggleThemeMode;
window.showOfflineBanner = showOfflineBanner;

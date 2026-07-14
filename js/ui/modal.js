// js/ui/modal.js
import { renderLevelsDashboard } from './list.js';

// --- NAVIGATION & CORE UI with hash-based routing ---
const CORE_PAGES = ['landingPage', 'levelsPage', 'statsPage', 'detailPage', 'playerVideoPage'];
let ignoreNextHashChange = false;

function parseHashHash(h) {
  // Accept formats like "page" or "page?key=val&x=y"
  if (!h) return { page: 'landing', params: {} };
  const raw = h.replace(/^#/, '');
  const [pagePart, queryPart] = raw.split('?');
  const page = (pagePart || 'landing') || 'landing';
  const params = {};
  if (queryPart) {
    queryPart.split('&').forEach(kv => {
      const [k, v] = kv.split('=');
      if (k) params[k] = decodeURIComponent(v || '');
    });
  }
  return { page, params };
}

function buildHash(page, params = {}) {
  const qs = Object.keys(params || {})
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
  return `#${page}${qs ? '?' + qs : ''}`;
}

export function showPage(pageId, params = {}, push = true) {
  // Clear video containers
  const mainVid = document.getElementById('video');
  const playerVid = document.getElementById('pvVideo');
  if (mainVid) mainVid.innerHTML = '';
  if (playerVid) playerVid.innerHTML = '';

  // Hide all core pages
  CORE_PAGES.forEach(id => {
    const pageEl = document.getElementById(id);
    if (pageEl) {
      pageEl.style.display = 'none';
      pageEl.classList.remove('active-page');
    }
  });

  // Show target page
  const targetPage = document.getElementById(pageId + 'Page');
  if (targetPage) {
    targetPage.style.display = 'block';
    targetPage.classList.add('active-page');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // Update hash (push) when requested
  if (push) {
    const newHash = buildHash(pageId, params);
    // Setting location.hash will trigger hashchange — that's desired to create a history entry.
    // We set a short lived flag to avoid double-processing if we just handled it here.
    ignoreNextHashChange = true;
    location.hash = newHash;
    // Allow the upcoming hashchange to be ignored once
    setTimeout(() => { ignoreNextHashChange = false; }, 50);
  }

  // After showing the page, call optional route hooks so pages can render based on params
  // These hooks are implemented in other modules and attached to window if available.
  if (pageId === 'detail' && params.level && typeof window.routeToDetail === 'function') {
    try { window.routeToDetail(params.level, params); } catch (err) { console.error(err); }
  }
  if (pageId === 'playerVideo' && typeof window.routeToPlayerVideo === 'function') {
    try { window.routeToPlayerVideo(params.level || '', params.link || ''); } catch (err) { console.error(err); }
  }
}

export function switchPage(pageId, params = {}) {
  // Convenience wrapper that pushes a new hash/state
  showPage(pageId, params, true);
}

export function handleHashChangeEvent() {
  if (ignoreNextHashChange) return;
  const { page, params } = parseHashHash(location.hash);
  showPage(page, params, false);
}

export function handleHashRouteOnLoad() {
  // Called after app data is initialized so route hooks can access uiState
  const { page, params } = parseHashHash(location.hash);
  // If there's no hash or it's empty, default to landing
  showPage(page || 'landing', params || {}, false);
}

export function toggleNavMenu() {
  const menu = document.getElementById('navMenu');
  if (menu) menu.classList.toggle('open');
}

export function closeNavMenu() {
  const menu = document.getElementById('navMenu');
  if (menu) menu.classList.remove('open');
}

export function goToLevelsDashboard() {
  // Show levels page and ensure submission box is visible
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
  const modal = document.getElementById('guidelinesModal');
  if (modal) modal.style.display = 'flex';
}

export function closeGuidelinesModal() {
  const modal = document.getElementById('guidelinesModal');
  if (modal) modal.style.display = 'none';
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
  const banner = document.getElementById('offlineBanner');
  if (!banner) return;
  banner.textContent = message;
  banner.hidden = false;
}

// Hash change listener
window.addEventListener('hashchange', handleHashChangeEvent);

// Global UI Attachments (preserve previous global names)
window.switchPage = switchPage;
window.goToLevelsDashboard = goToLevelsDashboard;
window.goToSubmissionBox = goToSubmissionBox;
window.toggleNavMenu = toggleNavMenu;
window.closeNavMenu = closeNavMenu;
window.openGuidelinesModal = openGuidelinesModal;
window.closeGuidelinesModal = closeGuidelinesModal;
window.toggleThemeMode = toggleThemeMode;
window.showOfflineBanner = showOfflineBanner;

// Export selected functions for module users
export { switchPage as switchPageExport };
// js/ui/modal.js
import { renderLevelsDashboard } from './list.js';

// --- ROUTING & PAGE NAVIGATION ---
const CORE_PAGES = ['landingPage', 'levelsPage', 'statsPage', 'detailPage', 'playerVideoPage'];
let ignoreNextHashChange = false;

function parseHashHash(h) {
  if (!h) return { page: 'landing', params: {} };
  const raw = h.replace(/^#/, '');
  const [pagePart, queryPart] = raw.split('?');
  const page = pagePart || 'landing';
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
  // Reset media elements
  ['video', 'pvVideo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.replaceChildren();
  });

  // Hide all core page containers
  CORE_PAGES.forEach(id => {
    const pageEl = document.getElementById(id);
    if (pageEl) {
      pageEl.style.display = 'none';
      pageEl.classList.remove('active-page');
    }
  });

  // Show target page (fallback to landing if non-existent route)
  const targetPage = document.getElementById(pageId + 'Page') || document.getElementById('landingPage');
  if (targetPage) {
    targetPage.style.display = 'block';
    targetPage.classList.add('active-page');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // Update URL hash state
  if (push) {
    const newHash = buildHash(pageId, params);
    ignoreNextHashChange = true;
    location.hash = newHash;
    setTimeout(() => { ignoreNextHashChange = false; }, 50);
  }

  // Execute deep-link route hooks if registered on window
  if (pageId === 'detail' && params.level && typeof window.routeToDetail === 'function') {
    try { window.routeToDetail(params.level, params); } catch (err) { console.error(err); }
  }
  if (pageId === 'playerVideo' && typeof window.routeToPlayerVideo === 'function') {
    try { window.routeToPlayerVideo(params.level || '', params.videoLink || ''); } catch (err) { console.error(err); }
  }
}

export function switchPage(pageId, params = {}) {
  showPage(pageId, params, true);
}

export function handleHashChangeEvent() {
  if (ignoreNextHashChange) return;
  const { page, params } = parseHashHash(location.hash);
  showPage(page, params, false);
}

export function handleHashRouteOnLoad() {
  // If hash is missing or blank, set default #landing hash which fires hashchange automatically
  if (!location.hash || location.hash === '#') {
    location.hash = '#landing';
    return;
  }
  const { page, params } = parseHashHash(location.hash);
  showPage(page || 'landing', params || {}, false);
}

// --- NAVIGATION MENU & SHORTCUTS ---
export function toggleNavMenu() {
  const menu = document.getElementById('navMenu');
  if (menu) menu.classList.toggle('open');
}

export function closeNavMenu() {
  const menu = document.getElementById('navMenu');
  if (menu) menu.classList.remove('open');
}

export function goToLevelsDashboard() {
  switchPage('levels');
  const sBox = document.getElementById('submissionBox');
  if (sBox) sBox.style.display = 'block';
  if (typeof renderLevelsDashboard === 'function') renderLevelsDashboard();
}

export function goToSubmissionBox() {
  switchPage('levels');
  setTimeout(() => {
    const sBox = document.getElementById('submissionBox');
    if (sBox) sBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 80);
}

// --- MODAL DIALOGS ---
export function openGuidelinesModal() {
  closeNavMenu();
  const modal = document.getElementById('guidelinesModal');
  if (modal) modal.style.display = 'flex';
}

export function closeGuidelinesModal() {
  const modal = document.getElementById('guidelinesModal');
  if (modal) modal.style.display = 'none';
}

// --- THEME & UI HELPERS ---
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
  if (!el) return;
  const box = document.createElement('div');
  box.style.cssText = 'color:var(--accent); text-align:center; padding:20px; font-size:13px;';
  box.textContent = String(message ?? '');
  el.replaceChildren(box);
}

export function showOfflineBanner(message) {
  const banner = document.getElementById('offlineBanner');
  if (!banner) return;
  banner.textContent = message;
  banner.hidden = false;
}

// Attach hashchange event listener
window.addEventListener('hashchange', handleHashChangeEvent);

// Global attachments for HTML inline handlers
window.switchPage = switchPage;
window.goToLevelsDashboard = goToLevelsDashboard;
window.goToSubmissionBox = goToSubmissionBox;
window.toggleNavMenu = toggleNavMenu;
window.closeNavMenu = closeNavMenu;
window.openGuidelinesModal = openGuidelinesModal;
window.closeGuidelinesModal = closeGuidelinesModal;
window.toggleThemeMode = toggleThemeMode;
window.showOfflineBanner = showOfflineBanner;
window.handleHashRouteOnLoad = handleHashRouteOnLoad;

export { switchPage as switchPageExport };

// js/config.js

const DEFAULT_CONFIG = {
  API: {
    APPS_SCRIPT_URL:
      "https://script.google.com/macros/s/AKfycbyq373Puku6D14WhdN0lL7Z7_CdBJ8pycTgIGEUEJFBAzsnpNbQ17Nx6hOtfPHJRd5ASA/exec",

    GITHUB_PRIMARY_URL:
      "https://raw.githubusercontent.com/pshs-demonlist/pshsmc-demonlist/main/levels.json",

    GITHUB_CDN_URL:
      "https://cdn.jsdelivr.net/gh/pshs-demonlist/pshsmc-demonlist@main/levels.json",

    FETCH_TIMEOUT_MS: 8000
  },

  IMAGES: {
    FALLBACK_THUMBNAIL:
      "https://img.youtube.com/vi/a83hV1_3B88/maxdefault.jpg"
  }
};

// Allow runtime overrides.
// Example:
// window.PSHS_CONFIG = {
//     API: {
//         GITHUB_PRIMARY_URL: "..."
//     }
// };

const overrides = window.PSHS_CONFIG || {};

export const CONFIG = {
  ...DEFAULT_CONFIG,

  API: {
    ...DEFAULT_CONFIG.API,
    ...(overrides.API || {})
  },

  IMAGES: {
    ...DEFAULT_CONFIG.IMAGES,
    ...(overrides.IMAGES || {})
  }
};
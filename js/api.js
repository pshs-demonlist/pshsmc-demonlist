// js/api.js
import { CONFIG } from './config.js';
import * as UI from './ui.js';

const DATABASE_CACHE_KEY = "pshs-demonlist-cache";

export async function loadDatabase() {
  let rawData = null;
  const fetchPayload = async (url) => {
    const cacheBusterUrl = url + (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.FETCH_TIMEOUT_MS); 
    
    try {
      const res = await fetch(cacheBusterUrl, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    rawData = await fetchPayload(CONFIG.API.GITHUB_PRIMARY_URL);
  } catch (err) {
    console.warn("Primary fetch failed. Falling back to CDN...", err);

    try {
      rawData = await fetchPayload(CONFIG.API.GITHUB_CDN_URL);
    } catch (e) {
      console.error("CDN fetch also failed.", e);

      try {
          const cached = localStorage.getItem(DATABASE_CACHE_KEY);

          if (cached) {
              const parsed = JSON.parse(cached);

              let cachedLevels = [];

              if (Array.isArray(parsed.data)) {
                cachedLevels = parsed.data;
              } else if (parsed.data && typeof parsed.data === 'object') {
                cachedLevels =
                  parsed.data.levels ??
                  parsed.data.list ??
                  parsed.data.data ??
                  parsed.data.records ??
                  [];
              }

              console.warn("Using cached database.");

              return {
                success: true,
                levels: cachedLevels.filter(
                  item =>
                    item &&
                    typeof item === "object"
                ),
                fromCache: true
              };
          }
      } catch (cacheErr) {
          console.error("Cached database is invalid.", cacheErr);
      }

      return {
        success: false,
        levels: [],
        fromCache: false
      };
    }
  }

  if (!rawData) return false;

  let levels = [];
  if (Array.isArray(rawData)) { 
    levels = rawData; 
  } else if (typeof rawData === 'object') { 
    levels = rawData.levels || rawData.list || rawData.data || rawData.records || [];
    if (levels.length === 0) {
      for (let key in rawData) {
        if (Array.isArray(rawData[key])) {
          levels = rawData[key];
          break;
        }
      }
    }
  }
  
  const filteredLevels = levels.filter(
  item => typeof item === "object" && item !== null
  );

  try {
    localStorage.setItem(
      DATABASE_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data: rawData
      })
    );
  } catch (err) {
    console.warn("Unable to cache database.", err);
  }

  return {
    success: true,
    levels: filteredLevels,
    fromCache: false
  };
};

export async function submitRecordData(payload) {
  const res = await fetch(CONFIG.API.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  if (!res.ok && res.type !== 'opaque') {
    throw new Error(`Server connection failed (HTTP ${res.status}). Please try again later.`);
  }

  if (res.type !== 'opaque') {
    try {
      const data = await res.json();
      if (data && data.status === 'error') {
        throw new Error(data.message || "The server rejected your submission.");
      }
    } catch {
      UI.showOfflineBanner("Offline (using cached data)");
    }
  }

  return true;
}

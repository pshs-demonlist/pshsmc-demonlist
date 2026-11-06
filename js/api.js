// js/api.js
import { CONFIG } from './config.js';
import * as UI from './ui/index.js';

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

  if (!rawData) return { success: false, levels: [], fromCache: false };

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
  let response;
  try {
    response = await fetch(CONFIG.API.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
  } catch (error) {
    // A cross-origin Apps Script request can be processed even when the browser
    // cannot read Google's redirected response. Do not automatically retry:
    // that could create a duplicate record. Ask the player to check Previous Submissions.
    if (error instanceof TypeError || error?.name === 'AbortError') {
      throw new Error(
        'The browser could not confirm the server response. Your submission may have reached the sheet. ' +
        'Refresh Previous Submissions before trying again so you do not send a duplicate.'
      );
    }
    throw error;
  }

  if (response.type === 'opaque') {
    throw new Error(
      'The server response could not be verified. Refresh Previous Submissions before trying again.'
    );
  }

  let data;
  let responseText = '';
  try {
    responseText = await response.text();
    data = JSON.parse(responseText);
  } catch (error) {
    const detail = responseText
      ? ` Response received: ${responseText.slice(0, 160)}`
      : '';
    throw new Error(
      `The server returned an unreadable response. Your submission may have reached the sheet. ` +
      `Refresh Previous Submissions before trying again to avoid a duplicate.${detail}`
    );
  }

  if (!response.ok) {
    throw new Error(data?.message || `Submission failed with HTTP ${response.status}.`);
  }
  if (!data || data.status !== 'ok') {
    throw new Error(data?.message || 'The server did not confirm the submission.');
  }

  return data;
}

export async function fetchPreviousSubmissions(username, campus) {
  const url = new URL(CONFIG.API.APPS_SCRIPT_URL);
  url.searchParams.set('action', 'previousSubmissions');
  url.searchParams.set('username', username);
  url.searchParams.set('campus', campus);

  let response;
  try {
    response = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
  } catch (error) {
    throw new Error(
      'The browser could not reach the submission history endpoint. Check the Apps Script deployment and try again.'
    );
  }

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  let data;
  try {
    data = await response.json();
  } catch (_) {
    throw new Error('The submission history endpoint returned unreadable data.');
  }

  if (!data || data.status !== 'ok') {
    throw new Error(data?.message || 'Unable to retrieve submissions.');
  }

  return Array.isArray(data.submissions) ? data.submissions : [];
}

// js/api.js
import { CONFIG } from './config.js';

export async function loadDatabase() {
  let rawData = null;
  const fetchPayload = async (url) => {
    const cacheBusterUrl = url + (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.FETCH_TIMEOUT_MS); 
    
    try {
      const res = await fetch(cacheBusterUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
      return await res.json();
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  };

  try { 
    rawData = await fetchPayload(CONFIG.API.GITHUB_PRIMARY_URL); 
  } catch (err) {
    console.warn("Primary fetch failed. Falling back to CDN channel target...");
    try { 
      rawData = await fetchPayload(CONFIG.API.GITHUB_CDN_URL); 
    } catch (e) { 
      return false; 
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
  
  return levels.filter(item => typeof item === 'object' && item !== null);
}

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
    } catch (jsonErr) {
      console.warn("[Submission] Non-JSON response received. Assuming success based on HTTP status.", jsonErr);
    }
  }
  return true;
}

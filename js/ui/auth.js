// js/ui/auth.js
// Lightweight client-only auth module for pshsmc-demonlist (ES module)
// Prototype: stores account credentials in IndexedDB (salt + iterations + derivedKey).
// Uses PBKDF2 with SHA-256, 16-byte random salt, 150000 iterations.
// WARNING: This is a prototype. Do NOT treat this as production authentication.

const DB_NAME = 'pshsmc-auth';
const DB_VERSION = 1;
const STORE_NAME = 'users';
const CURRENT_USER_KEY = 'pshsmc-current-user';
const PBKDF2_ITERATIONS = 150000; // >= 100k as required
const DERIVED_KEY_BITS = 256; // 32 bytes

// ---- IndexedDB helpers ----
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'username' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putUser(userObj) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const r = store.put(userObj);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function getUser(username) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const r = store.get(username);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  });
}

// ---- crypto helpers ----
function toBase64(buf) {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function fromBase64(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function randomSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt.buffer;
}

async function deriveKey(password, salt, iterations = PBKDF2_ITERATIONS) {
  const enc = new TextEncoder();
  const passKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const params = {
    name: 'PBKDF2',
    salt: salt,
    iterations: iterations,
    hash: 'SHA-256'
  };
  const bits = await crypto.subtle.deriveBits(params, passKey, DERIVED_KEY_BITS);
  return bits; // ArrayBuffer
}

// ---- current user helpers ----
function setCurrentUser(username) {
  if (username) localStorage.setItem(CURRENT_USER_KEY, username);
  else localStorage.removeItem(CURRENT_USER_KEY);
}
function getCurrentUsername() {
  return localStorage.getItem(CURRENT_USER_KEY) || null;
}

// ---- auth API ----
export async function signUp({ username, password }) {
  if (!username || !password) throw new Error('username and password required');
  const existing = await getUser(username);
  if (existing) throw new Error('username already exists');

  const saltBuf = randomSalt();
  const derived = await deriveKey(password, saltBuf, PBKDF2_ITERATIONS);
  const record = {
    username,
    salt: toBase64(saltBuf),
    iterations: PBKDF2_ITERATIONS,
    derivedKey: toBase64(derived),
    createdAt: new Date().toISOString()
  };
  await putUser(record);
  setCurrentUser(username);
  updateHamburgerAuth();
  return { username };
}

export async function signIn(username, password) {
  if (!username || !password) throw new Error('username and password required');
  const record = await getUser(username);
  if (!record) throw new Error('account not found');
  const saltBuf = fromBase64(record.salt);
  const derived = await deriveKey(password, saltBuf, record.iterations);
  const derivedB64 = toBase64(derived);
  if (derivedB64 !== record.derivedKey) {
    throw new Error('invalid credentials');
  }
  setCurrentUser(username);
  updateHamburgerAuth();
  return { username };
}

export function signOut() {
  setCurrentUser(null);
  updateHamburgerAuth();
}

export function isAuthenticated() {
  return !!getCurrentUsername();
}

export function getCurrentUser() {
  const u = getCurrentUsername();
  return u ? { username: u } : null;
}

// ---- UI helpers (auth modal + nav updates) ----
function findAuthElements() {
  return {
    modal: document.getElementById('authModal'),
    info: document.getElementById('pshsmc-auth-info'),
    action: document.getElementById('pshsmc-auth-action'),
    messageEl: document.getElementById('authModalMessage'),
    usernameInput: document.getElementById('authUsername'),
    passwordInput: document.getElementById('authPassword'),
    signinBtn: document.getElementById('authSignInBtn'),
    signupBtn: document.getElementById('authSignUpBtn'),
    cancelBtn: document.getElementById('authCancelBtn')
  };
}

export function updateHamburgerAuth() {
  const els = findAuthElements();
  if (!els) return;
  const info = els.info;
  const action = els.action;
  const user = getCurrentUser();
  if (info) info.textContent = user ? `Signed in as ${user.username}` : 'Not signed in';
  if (action) {
    action.textContent = user ? 'Sign out' : 'Sign in / Sign up';
    action.onclick = () => {
      if (user) {
        signOut();
      } else {
        openAuthModalAndWaitForSuccess();
      }
    };
  }
}

// open the modal and return a Promise that resolves when user successfully signs in/up
export function openAuthModalAndWaitForSuccess({ message } = {}) {
  return new Promise((resolve, reject) => {
    const els = findAuthElements();
    if (!els || !els.modal) {
      // fallback: use prompt
      const ok = confirm((message || '') + '\n\nOpen auth modal?');
      if (!ok) return reject(new Error('auth cancelled'));
      return resolve();
    }

    const { modal, messageEl, usernameInput, passwordInput, signinBtn, signupBtn, cancelBtn } = els;
    if (messageEl && message) messageEl.textContent = message;
    modal.style.display = 'flex';

    function cleanup() {
      modal.style.display = 'none';
      signinBtn.removeEventListener('click', onSignIn);
      signupBtn.removeEventListener('click', onSignUp);
      cancelBtn.removeEventListener('click', onCancel);
    }

    async function onSignIn(e) {
      try {
        const user = usernameInput.value.trim();
        const pass = passwordInput.value;
        await signIn(user, pass);
        cleanup();
        resolve({ username: user });
      } catch (err) {
        alert('Sign in failed: ' + err.message);
      }
    }
    async function onSignUp(e) {
      try {
        const user = usernameInput.value.trim();
        const pass = passwordInput.value;
        await signUp({ username: user, password: pass });
        cleanup();
        resolve({ username: user });
      } catch (err) {
        alert('Sign up failed: ' + err.message);
      }
    }
    function onCancel(e) {
      cleanup();
      reject(new Error('auth cancelled'));
    }

    signinBtn.addEventListener('click', onSignIn);
    signupBtn.addEventListener('click', onSignUp);
    cancelBtn.addEventListener('click', onCancel);
  });
}

// set global for non-module consumers
export default {
  getCurrentUser,
  signUp,
  signIn,
  signOut,
  isAuthenticated,
  openAuthModalAndWaitForSuccess,
  updateHamburgerAuth
};

// expose to window for inline handlers
window.pshsmcAuth = {
  getCurrentUser,
  signUp,
  signIn,
  signOut,
  isAuthenticated,
  openAuthModalAndWaitForSuccess,
  updateHamburgerAuth
};

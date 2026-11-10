import {
  saveSessionToFirestore,
  getSessionsFromFirestore,
  getStreakFromFirestore,
  saveStreakToFirestore,
  getAchievementsFromFirestore,
  saveAchievementsToFirestore,
  deleteUserDataFromFirestore,
} from '../firebase/firestore';

const STORAGE_PREFIX = 'alinea_';

let currentUid = null;

export function setCurrentUser(uid) {
  currentUid = uid;
}

export function getCurrentUser() {
  return currentUid;
}

function lsGet(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PREFIX + key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function lsSet(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

// --- Sessions ---

export async function saveSession(sessionData) {
  const data = { ...sessionData, date: new Date().toISOString() };
  if (currentUid) {
    try {
      await saveSessionToFirestore(currentUid, data);
      return;
    } catch (e) {
      console.warn('Firestore offline, guardando localmente');
    }
  }
  const sessions = lsGet('sessions', []);
  sessions.push(data);
  lsSet('sessions', sessions);
}

export async function getSessions() {
  if (currentUid) {
    try {
      const sessions = await getSessionsFromFirestore(currentUid);
      return sessions.map(s => ({
        ...s,
        date: s.date?.toDate ? s.date.toDate().toISOString() : s.date,
      }));
    } catch (e) {
      console.warn('Firestore offline, usando localStorage');
    }
  }
  return lsGet('sessions', []);
}

// --- Streak ---

export async function getStreak() {
  if (currentUid) {
    try {
      return await getStreakFromFirestore(currentUid);
    } catch (e) {
      console.warn('Firestore offline, usando localStorage');
    }
  }
  return lsGet('streak', { days: 0, lastDate: null });
}

export async function saveStreak(streak) {
  if (currentUid) {
    try {
      await saveStreakToFirestore(currentUid, streak);
      return;
    } catch (e) {
      console.warn('Firestore offline, guardando localmente');
    }
  }
  lsSet('streak', streak);
}

// --- Achievements ---

export async function getAchievements() {
  if (currentUid) {
    try {
      return await getAchievementsFromFirestore(currentUid);
    } catch (e) {
      console.warn('Firestore offline, usando localStorage');
    }
  }
  return lsGet('achievements', []);
}

export async function saveAchievements(achievements) {
  if (currentUid) {
    try {
      await saveAchievementsToFirestore(currentUid, achievements);
      return;
    } catch (e) {
      console.warn('Firestore offline, guardando localmente');
    }
  }
  lsSet('achievements', achievements);
}

// --- Settings (siempre local, es preferencia del dispositivo) ---

export function saveSettings(settings) {
  lsSet('settings', settings);
}

export function getSettings() {
  return lsGet('settings', null);
}

// --- Calibración personal (local: es propia de la cámara y del puesto) ---

export function saveBaseline(baseline) {
  if (baseline) lsSet('baseline', baseline);
  else localStorage.removeItem(STORAGE_PREFIX + 'baseline');
}

export function getBaseline() {
  return lsGet('baseline', null);
}

// --- Consentimiento informado (RF02) ---

export const CONSENT_VERSION = 1;

export function hasConsent() {
  const c = lsGet('consent', null);
  return Boolean(c && c.version === CONSENT_VERSION);
}

export function saveConsent() {
  lsSet('consent', { version: CONSENT_VERSION, acceptedAt: new Date().toISOString() });
}

// --- Derecho de eliminación (RF08, Ley 21.719) ---

export async function deleteAllUserData() {
  if (currentUid) {
    await deleteUserDataFromFirestore(currentUid);
  }
  Object.keys(localStorage)
    .filter(k => k.startsWith(STORAGE_PREFIX))
    .forEach(k => localStorage.removeItem(k));
}

// --- Helpers de filtrado ---

export async function getTodaySessions() {
  const today = new Date().toISOString().split('T')[0];
  const sessions = await getSessions();
  return sessions.filter(s => {
    const d = typeof s.date === 'string' ? s.date : new Date(s.date).toISOString();
    return d.startsWith(today);
  });
}

export async function getWeekSessions() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sessions = await getSessions();
  return sessions.filter(s => new Date(s.date) >= weekAgo);
}

export async function getMonthSessions() {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sessions = await getSessions();
  return sessions.filter(s => new Date(s.date) >= monthAgo);
}

// --- Sync getters for components that need immediate data ---

export function getStreakSync() {
  return lsGet('streak', { days: 0, lastDate: null });
}

export function getAchievementsSync() {
  return lsGet('achievements', []);
}

export function getSessionsSync() {
  return lsGet('sessions', []);
}

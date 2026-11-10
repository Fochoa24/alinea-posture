import {
  collection, doc, getDocs, addDoc, setDoc, getDoc, deleteDoc,
  query, orderBy, Timestamp, writeBatch
} from 'firebase/firestore';
import { db } from './config';

const USERS = 'users';

function userDoc(uid) {
  return doc(db, USERS, uid);
}

function sessionsCol(uid) {
  return collection(db, USERS, uid, 'sessions');
}

export async function saveSessionToFirestore(uid, sessionData) {
  try {
    await addDoc(sessionsCol(uid), {
      ...sessionData,
      date: Timestamp.now(),
    });
  } catch (e) {
    console.error('Error guardando sesión en Firestore:', e);
    throw e;
  }
}

export async function getSessionsFromFirestore(uid) {
  try {
    const q = query(sessionsCol(uid), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Error leyendo sesiones de Firestore:', e);
    return [];
  }
}

export async function getStreakFromFirestore(uid) {
  try {
    const snap = await getDoc(userDoc(uid));
    if (snap.exists() && snap.data().streak) {
      return snap.data().streak;
    }
    return { days: 0, lastDate: null };
  } catch (e) {
    console.error('Error leyendo racha:', e);
    return { days: 0, lastDate: null };
  }
}

export async function saveStreakToFirestore(uid, streak) {
  try {
    await setDoc(userDoc(uid), { streak }, { merge: true });
  } catch (e) {
    console.error('Error guardando racha:', e);
  }
}

export async function getAchievementsFromFirestore(uid) {
  try {
    const snap = await getDoc(userDoc(uid));
    if (snap.exists() && snap.data().achievements) {
      return snap.data().achievements;
    }
    return [];
  } catch (e) {
    console.error('Error leyendo logros:', e);
    return [];
  }
}

export async function saveAchievementsToFirestore(uid, achievements) {
  try {
    await setDoc(userDoc(uid), { achievements }, { merge: true });
  } catch (e) {
    console.error('Error guardando logros:', e);
  }
}

export async function migrateLocalStorageToFirestore(uid) {
  try {
    const localSessions = JSON.parse(localStorage.getItem('alinea_sessions') || '[]');
    if (localSessions.length > 0) {
      for (const s of localSessions) {
        await addDoc(sessionsCol(uid), {
          elapsed: s.elapsed || 0,
          headForwardCount: s.headForwardCount || 0,
          shoulderImbalanceCount: s.shoulderImbalanceCount || 0,
          goodPostureTime: s.goodPostureTime || 0,
          badPostureTime: s.badPostureTime || 0,
          pomodoroCycles: s.pomodoroCycles || 0,
          date: s.date ? Timestamp.fromDate(new Date(s.date)) : Timestamp.now(),
        });
      }
      localStorage.removeItem('alinea_sessions');
    }

    const localStreak = JSON.parse(localStorage.getItem('alinea_streak') || 'null');
    if (localStreak && localStreak.days > 0) {
      const existingStreak = await getStreakFromFirestore(uid);
      if (existingStreak.days < localStreak.days) {
        await saveStreakToFirestore(uid, localStreak);
      }
      localStorage.removeItem('alinea_streak');
    }

    const localAchievements = JSON.parse(localStorage.getItem('alinea_achievements') || '[]');
    if (localAchievements.length > 0) {
      const existing = await getAchievementsFromFirestore(uid);
      const merged = [...new Set([...existing, ...localAchievements])];
      await saveAchievementsToFirestore(uid, merged);
      localStorage.removeItem('alinea_achievements');
    }
  } catch (e) {
    console.error('Error migrando datos locales:', e);
  }
}

/**
 * Elimina todas las sesiones del usuario y su documento (racha y logros).
 * Implementa el derecho de supresión del titular (RF08).
 */
export async function deleteUserDataFromFirestore(uid) {
  const snapshot = await getDocs(sessionsCol(uid));
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db);
    docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  await deleteDoc(userDoc(uid));
}

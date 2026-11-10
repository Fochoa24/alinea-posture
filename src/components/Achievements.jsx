import { useState, useEffect } from 'react';
import { getAchievementsSync } from '../utils/storage';
import { getAchievementsFromFirestore } from '../firebase/firestore';
import { getCurrentUser } from '../utils/storage';

const ACHIEVEMENT_DEFS = [
  { id: 'first_session', name: 'Primera sesion', desc: 'Completaste tu primera sesion', icon: '\u{1F3AF}' },
  { id: 'streak_3', name: 'Racha de 3', desc: '3 dias seguidos entrenando', icon: '\u{1F525}' },
  { id: 'streak_7', name: 'Racha de 7', desc: '7 dias seguidos entrenando', icon: '\u{1F31F}' },
  { id: 'good_posture_90', name: 'Postura perfecta', desc: '90%+ buena postura en una sesion', icon: '\u{2B50}' },
  // Reemplaza a "Maraton" (premiaba >1 h continua frente a pantalla, lo contrario del objetivo).
  { id: 'eye_breaks_3', name: 'Ojos descansados', desc: '3 pausas visuales cumplidas en una sesion', icon: '\u{1F441}' },
  { id: 'no_alerts', name: 'Ingeniero de postura', desc: 'Sesion completa sin alertas', icon: '\u{1F60E}' },
  { id: 'pomodoro_4', name: 'Productivo', desc: '4 ciclos pomodoro en una sesion', icon: '\u{2615}' },
  { id: 'streak_30', name: 'Maestro del bienestar', desc: '30 dias seguidos', icon: '\u{1F3C6}' },
];

export function checkAchievements(sessionData, streakDays, existingAchievements) {
  const existing = existingAchievements || [];
  const newOnes = [];

  const has = (id) => existing.includes(id);
  const add = (id) => { if (!has(id)) newOnes.push(id); };

  add('first_session');

  if (streakDays >= 3) add('streak_3');
  if (streakDays >= 7) add('streak_7');
  if (streakDays >= 30) add('streak_30');

  const total = (sessionData.goodPostureTime || 0) + (sessionData.badPostureTime || 0);
  if (total > 0) {
    const goodPct = (sessionData.goodPostureTime / total) * 100;
    if (goodPct >= 90) add('good_posture_90');
  }

  if ((sessionData.eyeBreaksDone || 0) >= 3) add('eye_breaks_3');

  if ((sessionData.alertsCount ?? ((sessionData.headForwardCount || 0) + (sessionData.shoulderImbalanceCount || 0))) === 0
    && total > 600 && !sessionData.observationMode) {
    add('no_alerts');
  }

  if ((sessionData.pomodoroCycles || 0) >= 4) add('pomodoro_4');

  return { newAchievements: newOnes, allDefs: ACHIEVEMENT_DEFS, existing };
}

export default function Achievements({ onClose }) {
  const [unlocked, setUnlocked] = useState(() => getAchievementsSync());

  useEffect(() => {
    const uid = getCurrentUser();
    if (uid) {
      getAchievementsFromFirestore(uid)
        .then(data => setUnlocked(data))
        .catch(() => {});
    }
  }, []);

  return (
    <div className="achievements-overlay">
      <div className="achievements-card">
        <div className="achievements-header">
          <h2>Logros</h2>
          <button className="summary-close" onClick={onClose}>&#x2715;</button>
        </div>
        <div className="achievements-grid">
          {ACHIEVEMENT_DEFS.map(a => (
            <div key={a.id} className={`achievement ${unlocked.includes(a.id) ? 'unlocked' : 'locked'}`}>
              <span className="achievement-icon">{a.icon}</span>
              <span className="achievement-name">{a.name}</span>
              <span className="achievement-desc">{a.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

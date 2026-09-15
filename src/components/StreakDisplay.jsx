import { useState, useEffect } from 'react';
import { getStreakSync } from '../utils/storage';

export default function StreakDisplay() {
  const [streak, setStreak] = useState(() => getStreakSync());

  useEffect(() => {
    const interval = setInterval(() => {
      setStreak(getStreakSync());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (streak.days === 0) return null;

  return (
    <div className="streak-display">
      <span className="streak-fire">{'\u{1F525}'}</span>
      <span className="streak-count">{streak.days}</span>
      <span className="streak-label">dias seguidos</span>
    </div>
  );
}

import { useState, useCallback, useEffect } from 'react';
import { getStreak, saveStreak } from '../utils/storage';

export function useStreak() {
  const [streak, setStreak] = useState({ days: 0, lastDate: null });

  useEffect(() => {
    getStreak().then(s => setStreak(s));
  }, []);

  const updateStreak = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const current = await getStreak();

    if (current.lastDate === today) return current;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak;

    if (current.lastDate === yesterday) {
      newStreak = { days: current.days + 1, lastDate: today };
    } else {
      newStreak = { days: 1, lastDate: today };
    }

    await saveStreak(newStreak);
    setStreak(newStreak);
    return newStreak;
  }, []);

  return { streak, updateStreak };
}

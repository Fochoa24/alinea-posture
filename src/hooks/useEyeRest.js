import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Recordatorio de descanso visual 20-20-20 con intervalo configurable (minutos).
 * Registra pausas mostradas y pausas completadas (indicador I3b de adherencia).
 */
export function useEyeRest(intervalMinutes = 20) {
  const totalSeconds = Math.max(1, Math.round(intervalMinutes * 60));
  const [eyeReminder, setEyeReminder] = useState(false);
  const [eyeCountdown, setEyeCountdown] = useState(totalSeconds);
  const [eyeBreaks, setEyeBreaks] = useState({ shown: 0, done: 0 });
  const intervalRef = useRef(null);
  const totalRef = useRef(totalSeconds);
  totalRef.current = totalSeconds;

  const start = useCallback(() => {
    clearInterval(intervalRef.current);
    setEyeCountdown(totalRef.current);
    intervalRef.current = setInterval(() => {
      setEyeCountdown(prev => {
        if (prev <= 1) {
          setEyeReminder(true);
          setEyeBreaks(b => ({ ...b, shown: b.shown + 1 }));
          return totalRef.current;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
  }, []);

  const dismissEye = useCallback((completed = true) => {
    setEyeReminder(false);
    if (completed) setEyeBreaks(b => ({ ...b, done: b.done + 1 }));
    setEyeCountdown(totalRef.current);
  }, []);

  const resetBreaks = useCallback(() => setEyeBreaks({ shown: 0, done: 0 }), []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { eyeReminder, eyeCountdown, eyeTotal: totalSeconds, eyeBreaks, dismissEye, resetBreaks, start, stop };
}

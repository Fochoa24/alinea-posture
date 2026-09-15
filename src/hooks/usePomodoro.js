import { useState, useRef, useCallback, useEffect } from 'react';

export function usePomodoro(settings, onBreakStart, onWorkStart) {
  const [phase, setPhase] = useState('work');
  const [countdown, setCountdown] = useState(settings.workMinutes * 60);
  const [cycles, setCycles] = useState(0);
  const [active, setActive] = useState(false);
  const intervalRef = useRef(null);

  const workSec = settings.workMinutes * 60;
  const breakSec = settings.breakMinutes * 60;

  const start = useCallback(() => {
    setActive(true);
  }, []);

  const pause = useCallback(() => {
    setActive(false);
    clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setPhase('work');
    setCountdown(workSec);
    setCycles(0);
    setActive(false);
  }, [workSec]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!active) return;

    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (phase === 'work') {
            const newCycles = cycles + 1;
            setCycles(newCycles);
            setPhase('break');
            setCountdown(breakSec);
            if (onBreakStart) onBreakStart();
          } else {
            setPhase('work');
            setCountdown(workSec);
            if (onWorkStart) onWorkStart();
          }
          return prev;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [active, phase, cycles, breakSec, workSec, onBreakStart, onWorkStart]);

  return { phase, countdown, cycles, active, start, pause, reset };
}

import { useState, useRef, useCallback, useEffect } from 'react';

export function useEyeRest() {
  const [eyeReminder, setEyeReminder] = useState(false);
  const [eyeCountdown, setEyeCountdown] = useState(20 * 60);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    setEyeCountdown(20 * 60);
    intervalRef.current = setInterval(() => {
      setEyeCountdown(prev => {
        if (prev <= 1) {
          setEyeReminder(true);
          return 20 * 60;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
  }, []);

  const dismissEye = useCallback(() => {
    setEyeReminder(false);
    setEyeCountdown(20 * 60);
  }, []);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return { eyeReminder, eyeCountdown, dismissEye, start, stop };
}

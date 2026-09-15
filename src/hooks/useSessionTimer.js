import { useState, useRef, useCallback, useEffect } from 'react';

export function useSessionTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [stretchReminder, setStretchReminder] = useState(false);
  const intervalRef = useRef(null);
  const startRef = useRef(null);
  const stretchIntervalRef = useRef(null);

  const start = useCallback(() => {
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    stretchIntervalRef.current = setInterval(() => {
      setStretchReminder(true);
    }, 25 * 60 * 1000);
  }, []);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    clearInterval(stretchIntervalRef.current);
  }, []);

  const dismissStretch = useCallback(() => {
    setStretchReminder(false);
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(stretchIntervalRef.current);
    };
  }, []);

  return { elapsed, stretchReminder, dismissStretch, start, stop };
}

import { useState, useRef, useCallback } from 'react';
import { analyzePosture } from '../utils/postureAnalyzer';
import { POSTURE_THRESHOLDS } from '../utils/constants';

export function usePostureDetection() {
  const [postureState, setPostureState] = useState('good');
  const [stats, setStats] = useState({
    headForwardCount: 0,
    shoulderImbalanceCount: 0,
    goodPostureTime: 0,
    badPostureTime: 0,
  });

  const badFramesRef = useRef(0);
  const goodFramesRef = useRef(0);
  const lastWarningTimeRef = useRef(0);
  const lastStateRef = useRef('good');

  const processResults = useCallback((results) => {
    if (!results.poseLandmarks) {
      setPostureState('no_person');
      return;
    }

    const { isBadPosture, headForward, shoulderImbalance } = analyzePosture(results.poseLandmarks);

    if (isBadPosture) {
      badFramesRef.current++;
      goodFramesRef.current = 0;
    } else {
      goodFramesRef.current++;
      badFramesRef.current = Math.max(0, badFramesRef.current - 2);
    }

    const now = Date.now();
    let newState = 'good';

    if (badFramesRef.current >= POSTURE_THRESHOLDS.postureHoldFrames) {
      const sinceLastWarning = now - lastWarningTimeRef.current;
      if (sinceLastWarning > POSTURE_THRESHOLDS.warningCooldownMs || lastStateRef.current === 'good') {
        newState = 'bad';
        lastWarningTimeRef.current = now;
      } else {
        newState = lastStateRef.current;
      }
    }

    lastStateRef.current = newState;
    setPostureState(newState);

    setStats(prev => ({
      headForwardCount: prev.headForwardCount + (headForward ? 1 : 0),
      shoulderImbalanceCount: prev.shoulderImbalanceCount + (shoulderImbalance ? 1 : 0),
      goodPostureTime: prev.goodPostureTime + (newState === 'good' ? 1 : 0),
      badPostureTime: prev.badPostureTime + (newState === 'bad' ? 1 : 0),
    }));

    return results.poseLandmarks;
  }, []);

  const resetStats = useCallback(() => {
    badFramesRef.current = 0;
    goodFramesRef.current = 0;
    lastWarningTimeRef.current = 0;
    lastStateRef.current = 'good';
    setPostureState('good');
    setStats({
      headForwardCount: 0,
      shoulderImbalanceCount: 0,
      goodPostureTime: 0,
      badPostureTime: 0,
    });
  }, []);

  return { postureState, stats, processResults, resetStats };
}

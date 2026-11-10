import { useState, useRef, useCallback } from 'react';
import { analyzePosture, extractFeatures, buildBaseline } from '../utils/postureAnalyzer';
import { createPostureTracker } from '../utils/postureTracker';
import { POSTURE_THRESHOLDS } from '../utils/constants';
import { getBaseline, saveBaseline } from '../utils/storage';

const EMPTY_STATS = {
  headForwardCount: 0,
  shoulderImbalanceCount: 0,
  alertsCount: 0,
  goodPostureTime: 0,
  badPostureTime: 0,
  observedTime: 0,
};

/**
 * Detección postural con calibración personal y tiempo medido en segundos reales.
 * settingsRef.current debe contener { sensitivity }.
 */
export function usePostureDetection(settingsRef, onAlert) {
  const [postureState, setPostureState] = useState('good');
  const [stats, setStats] = useState(EMPTY_STATS);
  const [baseline, setBaselineState] = useState(() => getBaseline());
  const [calibration, setCalibration] = useState({ active: false, progress: 0 });

  const baselineRef = useRef(baseline);
  const trackerRef = useRef(createPostureTracker());
  const calibRef = useRef(null); // { startedAt, samples }
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;

  const startCalibration = useCallback(() => {
    calibRef.current = { startedAt: performance.now(), samples: [] };
    setCalibration({ active: true, progress: 0 });
  }, []);

  const clearCalibration = useCallback(() => {
    baselineRef.current = null;
    setBaselineState(null);
    saveBaseline(null);
  }, []);

  const processResults = useCallback((results) => {
    const now = performance.now();

    // Fase de calibración: se registran rasgos de la postura neutra durante 10 s.
    if (calibRef.current) {
      const c = calibRef.current;
      const f = results.poseLandmarks ? extractFeatures(results.poseLandmarks) : null;
      if (f) c.samples.push(f);
      const progress = Math.min(1, (now - c.startedAt) / POSTURE_THRESHOLDS.calibrationMs);
      setCalibration({ active: progress < 1, progress });
      if (progress >= 1) {
        const b = buildBaseline(c.samples);
        calibRef.current = null;
        if (b) {
          baselineRef.current = b;
          setBaselineState(b);
          saveBaseline(b);
        }
        setCalibration({ active: false, progress: 1, failed: !b });
      }
      setPostureState(results.poseLandmarks ? 'good' : 'no_person');
      return results.poseLandmarks;
    }

    const detected = Boolean(results.poseLandmarks);
    const analysis = detected
      ? analyzePosture(results.poseLandmarks, {
        baseline: baselineRef.current,
        sensitivity: settingsRef?.current?.sensitivity || 'medium',
      })
      : null;

    const out = trackerRef.current.update(
      {
        detected: detected && Boolean(analysis.features),
        isBadPosture: analysis?.isBadPosture,
        headForward: analysis?.headForward,
        shoulderImbalance: analysis?.shoulderImbalance,
      },
      now,
    );

    setPostureState(out.state);
    setStats(out.stats);
    if (out.alertFired && onAlertRef.current) onAlertRef.current();

    return results.poseLandmarks;
  }, [settingsRef]);

  const resetStats = useCallback(() => {
    trackerRef.current.reset();
    setPostureState('good');
    setStats(EMPTY_STATS);
  }, []);

  return {
    postureState,
    stats,
    processResults,
    resetStats,
    baseline,
    calibration,
    startCalibration,
    clearCalibration,
  };
}

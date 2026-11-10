import { POSTURE_THRESHOLDS } from './constants';

/**
 * Máquina de estados de la alerta postural, basada en tiempo real (ms).
 * Es pura (no depende de React) para poder probarla y simularla.
 *
 * update(frame, nowMs) recibe { detected, isBadPosture, headForward, shoulderImbalance }
 * y devuelve { state, alertFired, stats }.
 * state: 'good' | 'bad' | 'no_person'
 * stats: segundos reales en buena/mala postura y número de alertas por tipo.
 */
export function createPostureTracker(options = {}) {
  const cfg = { ...POSTURE_THRESHOLDS, ...options };
  let badSince = null;
  let goodSince = null;
  let lastAlertAt = -Infinity;
  let lastFrameAt = null;
  let state = 'good';
  const stats = {
    goodPostureTime: 0, // segundos
    badPostureTime: 0, // segundos
    observedTime: 0, // segundos con persona detectada
    alertsCount: 0,
    headForwardCount: 0, // alertas por cabeza adelantada
    shoulderImbalanceCount: 0, // alertas por desbalance de hombros
  };

  function accumulate(nowMs) {
    if (lastFrameAt === null) return 0;
    const dt = nowMs - lastFrameAt;
    if (dt <= 0 || dt > cfg.maxFrameGapMs) return 0;
    return dt / 1000;
  }

  function update(frame, nowMs) {
    const dt = accumulate(nowMs);
    lastFrameAt = nowMs;
    let alertFired = false;

    if (!frame.detected) {
      badSince = null;
      goodSince = null;
      state = 'no_person';
      return { state, alertFired, stats: { ...stats } };
    }

    stats.observedTime += dt;

    if (frame.isBadPosture) {
      goodSince = null;
      if (badSince === null) badSince = nowMs;
      const sustained = nowMs - badSince >= cfg.holdMs;
      if (sustained && state !== 'bad') {
        // El estado refleja la postura real; el cooldown solo limita las alertas.
        state = 'bad';
        if (nowMs - lastAlertAt >= cfg.cooldownMs) {
          alertFired = true;
          lastAlertAt = nowMs;
          stats.alertsCount += 1;
          if (frame.headForward) stats.headForwardCount += 1;
          if (frame.shoulderImbalance) stats.shoulderImbalanceCount += 1;
        }
      }
    } else {
      if (goodSince === null) goodSince = nowMs;
      if (nowMs - goodSince >= cfg.recoveryMs) {
        badSince = null;
        state = 'good';
      }
    }

    if (state === 'bad') stats.badPostureTime += dt;
    else stats.goodPostureTime += dt;

    return { state, alertFired, stats: { ...stats } };
  }

  function reset() {
    badSince = null;
    goodSince = null;
    lastAlertAt = -Infinity;
    lastFrameAt = null;
    state = 'good';
    Object.keys(stats).forEach(k => { stats[k] = 0; });
  }

  return { update, reset };
}

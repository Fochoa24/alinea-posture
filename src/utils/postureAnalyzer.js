import { LANDMARKS, POSTURE_THRESHOLDS, SENSITIVITY_PRESETS } from './constants';

function isVisible(landmark) {
  return Boolean(landmark) &&
    (landmark.visibility === undefined || landmark.visibility >= POSTURE_THRESHOLDS.minLandmarkVisibility);
}

/**
 * Extrae rasgos posturales invariantes a la escala (distancia a la cámara)
 * a partir de los 33 puntos de MediaPipe Pose.
 *
 * - neckRatio: distancia vertical nariz→línea de hombros dividida por el ancho de hombros.
 *   Al adelantar o bajar la cabeza (o acercarse encorvado a la pantalla) este valor baja.
 * - tilt: |Δy| / |Δx| de los hombros. Al inclinar un hombro este valor sube.
 *
 * Devuelve null si los puntos necesarios no son visibles.
 */
export function extractFeatures(landmarks) {
  if (!landmarks || landmarks.length < 25) return null;
  const nose = landmarks[LANDMARKS.NOSE];
  const ls = landmarks[LANDMARKS.LEFT_SHOULDER];
  const rs = landmarks[LANDMARKS.RIGHT_SHOULDER];
  if (!isVisible(nose) || !isVisible(ls) || !isVisible(rs)) return null;

  const shoulderWidth = Math.hypot(ls.x - rs.x, ls.y - rs.y);
  if (shoulderWidth < 1e-3) return null;

  const shoulderMidY = (ls.y + rs.y) / 2;
  const neckRatio = (shoulderMidY - nose.y) / shoulderWidth;
  const dx = Math.abs(ls.x - rs.x);
  const tilt = dx > 1e-3 ? Math.abs(ls.y - rs.y) / dx : 0;

  return { neckRatio, tilt };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Construye la postura de referencia del usuario a partir de las muestras
 * recolectadas durante la calibración. Usa la mediana para ignorar movimientos puntuales.
 */
export function buildBaseline(samples) {
  const valid = samples.filter(Boolean);
  if (valid.length < POSTURE_THRESHOLDS.minCalibrationSamples) return null;
  return {
    neckRatio: median(valid.map(s => s.neckRatio)),
    tilt: median(valid.map(s => s.tilt)),
    samples: valid.length,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Evalúa un fotograma.
 * - Con baseline: compara contra la postura neutra del propio usuario (calibración personal).
 * - Sin baseline: usa umbrales poblacionales conservadores.
 * La sensibilidad (low/medium/high) define cuánta desviación se tolera.
 */
export function analyzePosture(landmarks, { baseline = null, sensitivity = 'medium' } = {}) {
  const features = extractFeatures(landmarks);
  if (!features) {
    return { isBadPosture: false, headForward: false, shoulderImbalance: false, features: null };
  }

  const preset = SENSITIVITY_PRESETS[sensitivity] || SENSITIVITY_PRESETS.medium;
  let headForward;
  let shoulderImbalance;

  if (baseline) {
    headForward = features.neckRatio < baseline.neckRatio * (1 - preset.neckDrop);
    shoulderImbalance = features.tilt > baseline.tilt + preset.tiltDelta;
  } else {
    headForward = features.neckRatio < preset.absoluteNeckRatio;
    shoulderImbalance = features.tilt > preset.absoluteTilt;
  }

  return {
    isBadPosture: headForward || shoulderImbalance,
    headForward,
    shoulderImbalance,
    features,
  };
}

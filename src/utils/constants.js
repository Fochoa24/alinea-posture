export const POSTURE_THRESHOLDS = {
  minLandmarkVisibility: 0.5,
  // La mala postura debe sostenerse este tiempo (en ms reales, no en fotogramas)
  // para emitir una alerta. Así el comportamiento no depende de los FPS del equipo.
  holdMs: 3000,
  // Tiempo mínimo entre dos alertas consecutivas.
  cooldownMs: 10000,
  // Una buena postura breve (< recoveryMs) no reinicia el conteo de mala postura.
  recoveryMs: 700,
  // Saltos mayores entre fotogramas (pestaña en segundo plano) no se suman al tiempo.
  maxFrameGapMs: 1000,
  calibrationMs: 10000,
  minCalibrationSamples: 30,
};

/**
 * Presets de sensibilidad. Con calibración se usa la desviación relativa a la
 * postura neutra del usuario; sin calibración, umbrales absolutos conservadores.
 */
export const SENSITIVITY_PRESETS = {
  low: { neckDrop: 0.25, tiltDelta: 0.10, absoluteNeckRatio: 0.45, absoluteTilt: 0.14 },
  medium: { neckDrop: 0.18, tiltDelta: 0.07, absoluteNeckRatio: 0.55, absoluteTilt: 0.11 },
  high: { neckDrop: 0.12, tiltDelta: 0.05, absoluteNeckRatio: 0.65, absoluteTilt: 0.08 },
};

export const LANDMARKS = {
  NOSE: 0,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
};

export const COLORS = {
  primary: '#2d6a4f',
  primaryLight: '#40916c',
  primaryDark: '#1b4332',
  accent: '#95d5b2',
  accentLight: '#b7e4c7',
  background: '#f8faf9',
  surface: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  warning: '#e76f51',
  warningLight: '#fce4e0',
  success: '#2d6a4f',
  successLight: '#d8f3dc',
  info: '#457b9d',
  infoLight: '#d4e8f5',
};

// Genera 33 puntos MediaPipe sintéticos para un cuerpo frente a la cámara.
// neckRatio: (y_hombros - y_nariz) / ancho_hombros ; tilt: |Δy|/|Δx| de hombros.
export function makeLandmarks({ neckRatio = 0.8, tilt = 0.02, shoulderWidth = 0.3, cx = 0.5, shoulderY = 0.7, visibility = 0.99 } = {}) {
  const lm = Array.from({ length: 33 }, () => ({ x: cx, y: 0.9, z: 0, visibility }));
  const half = shoulderWidth / 2;
  const dy = tilt * shoulderWidth;
  lm[11] = { x: cx + half, y: shoulderY - dy / 2, z: 0, visibility };
  lm[12] = { x: cx - half, y: shoulderY + dy / 2, z: 0, visibility };
  lm[0] = { x: cx, y: shoulderY - neckRatio * shoulderWidth, z: -0.3, visibility };
  lm[7] = { x: cx + 0.06, y: lm[0].y + 0.01, z: 0, visibility };
  lm[8] = { x: cx - 0.06, y: lm[0].y + 0.01, z: 0, visibility };
  return lm;
}

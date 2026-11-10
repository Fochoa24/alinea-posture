import { describe, it, expect } from 'vitest';
import { analyzePosture, extractFeatures, buildBaseline } from '../src/utils/postureAnalyzer';
import { makeLandmarks } from './landmarks';

describe('extractFeatures', () => {
  it('es invariante a la distancia a la cámara (escala)', () => {
    const near = extractFeatures(makeLandmarks({ shoulderWidth: 0.45 }));
    const far = extractFeatures(makeLandmarks({ shoulderWidth: 0.2 }));
    expect(near.neckRatio).toBeCloseTo(far.neckRatio, 5);
  });
  it('devuelve null si los hombros no son visibles', () => {
    const lm = makeLandmarks();
    lm[11].visibility = 0.1;
    expect(extractFeatures(lm)).toBeNull();
  });
});

describe('analyzePosture con calibración', () => {
  const baseline = buildBaseline(Array.from({ length: 40 }, () => extractFeatures(makeLandmarks({ neckRatio: 0.7, tilt: 0.02 }))));

  it('la postura de referencia es buena', () => {
    expect(analyzePosture(makeLandmarks({ neckRatio: 0.7 }), { baseline }).isBadPosture).toBe(false);
  });
  it('detecta cabeza adelantada respecto de la referencia del propio usuario', () => {
    const r = analyzePosture(makeLandmarks({ neckRatio: 0.5 }), { baseline });
    expect(r.headForward).toBe(true);
  });
  it('detecta desbalance de hombros', () => {
    expect(analyzePosture(makeLandmarks({ neckRatio: 0.7, tilt: 0.15 }), { baseline }).shoulderImbalance).toBe(true);
  });
  it('la sensibilidad cambia el umbral (alta detecta más que baja)', () => {
    const lm = makeLandmarks({ neckRatio: 0.58 }); // 17 % bajo la referencia
    expect(analyzePosture(lm, { baseline, sensitivity: 'high' }).headForward).toBe(true);
    expect(analyzePosture(lm, { baseline, sensitivity: 'low' }).headForward).toBe(false);
  });
  it('un usuario con cuello corto calibrado no recibe falsas alertas', () => {
    const shortNeck = buildBaseline(Array.from({ length: 40 }, () => extractFeatures(makeLandmarks({ neckRatio: 0.5 }))));
    expect(analyzePosture(makeLandmarks({ neckRatio: 0.5 }), { baseline: shortNeck }).isBadPosture).toBe(false);
  });
});

describe('buildBaseline', () => {
  it('rechaza calibraciones con pocas muestras', () => {
    expect(buildBaseline([extractFeatures(makeLandmarks())])).toBeNull();
  });
});

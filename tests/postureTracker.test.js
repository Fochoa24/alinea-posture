import { describe, it, expect } from 'vitest';
import { createPostureTracker } from '../src/utils/postureTracker';

function run(tracker, fps, seconds, frame, t0 = 0) {
  const dt = 1000 / fps;
  let out; let t = t0; let alerts = 0;
  for (let i = 0; i < seconds * fps; i++) {
    t = t0 + i * dt;
    out = tracker.update({ detected: true, ...frame }, t);
    if (out.alertFired) alerts++;
  }
  return { out, t: t + dt, alerts };
}

describe('createPostureTracker', () => {
  it('alerta tras 3 s sostenidos, con el mismo retardo a 10 y a 30 FPS', () => {
    for (const fps of [10, 30]) {
      const tr = createPostureTracker();
      const dt = 1000 / fps;
      let firedAt = null;
      for (let i = 0; i < fps * 6; i++) {
        const o = tr.update({ detected: true, isBadPosture: true, headForward: true }, i * dt);
        if (o.alertFired && firedAt === null) firedAt = i * dt;
      }
      expect(firedAt).toBeGreaterThanOrEqual(3000);
      expect(firedAt).toBeLessThan(3000 + 2 * dt);
    }
  });

  it('mide segundos reales independientemente de los FPS', () => {
    const a = run(createPostureTracker(), 10, 60, { isBadPosture: false }).out.stats.goodPostureTime;
    const b = run(createPostureTracker(), 30, 60, { isBadPosture: false }).out.stats.goodPostureTime;
    expect(a).toBeCloseTo(60, 0);
    expect(b).toBeCloseTo(60, 0);
  });

  it('no alerta por movimientos breves (< 3 s)', () => {
    const tr = createPostureTracker();
    const r1 = run(tr, 30, 2, { isBadPosture: true });
    const r2 = run(tr, 30, 2, { isBadPosture: false }, r1.t);
    const r3 = run(tr, 30, 2, { isBadPosture: true }, r2.t);
    expect(r1.alerts + r2.alerts + r3.alerts).toBe(0);
  });

  it('respeta 10 s entre alertas', () => {
    const tr = createPostureTracker();
    let t = 0; let alerts = 0;
    for (let k = 0; k < 4; k++) {
      const bad = run(tr, 30, 3.5, { isBadPosture: true }, t); alerts += bad.alerts; t = bad.t;
      const good = run(tr, 30, 1, { isBadPosture: false }, t); t = good.t;
    }
    // 4 episodios en ~18 s → como máximo 2 alertas
    expect(alerts).toBeLessThanOrEqual(2);
    expect(alerts).toBeGreaterThanOrEqual(1);
  });

  it('un fotograma sin detección no reinicia la mala postura sostenida', () => {
    const tr = createPostureTracker();
    let fired = false;
    for (let i = 0; i < 30 * 5; i++) {
      const detected = i % 20 !== 10; // pierde 1 de cada 20 fotogramas
      const o = tr.update({ detected, isBadPosture: true, headForward: true }, i * (1000 / 30));
      if (o.alertFired) fired = true;
    }
    expect(fired).toBe(true);
  });

  it('ignora huecos largos (pestaña en segundo plano)', () => {
    const tr = createPostureTracker();
    tr.update({ detected: true, isBadPosture: false }, 0);
    const o = tr.update({ detected: true, isBadPosture: false }, 60000);
    expect(o.stats.goodPostureTime).toBe(0);
  });
});

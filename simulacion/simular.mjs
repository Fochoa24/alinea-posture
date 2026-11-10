// Simulación Monte Carlo del analizador postural de Alinea (v1 vs v2).
// Datos 100 % sintéticos: sirve para comparar algoritmos, no reemplaza la validación con personas.
import { analyzePosture as legacyAnalyze } from './analizador_v1.mjs';
import { analyzePosture, extractFeatures, buildBaseline } from '../src/utils/postureAnalyzer.js';
import { createPostureTracker } from '../src/utils/postureTracker.js';
import fs from 'node:fs';

// PRNG determinista (semilla fija => resultados reproducibles)
let seed = 20261116;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const U = (a, b) => a + (b - a) * rnd();
const N = (m, s) => { const u = 1 - rnd(), v = rnd(); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const USERS = 200, SESSION_S = 600, HOLD_MS = 3000;

function makeUser(i) {
  const asym = rnd() < 0.12;
  return {
    id: i,
    fps: pick([10, 15, 30]),
    sw: U(0.26, 0.42),                    // ancho de hombros en la imagen (distancia a la cámara)
    shoulderY: U(0.68, 0.9),              // dónde queda sentado en el encuadre
    neck0: Math.min(1.15, Math.max(0.45, N(0.78, 0.12))), // postura neutra individual
    tilt0: asym ? U(0.05, 0.09) : Math.abs(N(0.015, 0.012)),
    asym,
    noise: U(0.002, 0.012),               // ruido de la cámara/luz (incluye mala iluminación)
    calibErr: N(0, 0.05),                 // la postura durante la calibración no es perfecta
    drift: 0,                             // deriva lenta de la postura neutra durante la sesión
  };
}

// Guion de la sesión: periodos buenos, episodios malos (5–40 s) y movimientos breves (1–2,5 s)
function makeScript() {
  const segs = []; let t = 10; // los primeros 10 s: postura neutra (calibración)
  segs.push({ from: 0, to: 10, kind: 'good' });
  while (t < SESSION_S) {
    const good = Math.min(SESSION_S - t, -Math.log(1 - rnd()) * 45 + 5);
    segs.push({ from: t, to: t + good, kind: 'good' }); t += good;
    if (t >= SESSION_S) break;
    const r = rnd();
    if (r < 0.3) { const d = U(1, 2.5); segs.push({ from: t, to: t + d, kind: 'blip', drop: U(0.25, 0.35) }); t += d; }
    else { const d = U(5, 40); const isHead = r < 0.75;
      const drop = U(0.08, 0.4), dtilt = U(0.03, 0.18);
      // Verdad de terreno: solo cuenta como mala postura una desviación clínicamente relevante
      const relevant = isHead ? drop >= 0.15 : dtilt >= 0.06;
      const kind = relevant ? (isHead ? 'head' : 'shoulder') : (isHead ? 'subhead' : 'subshoulder');
      segs.push({ from: t, to: Math.min(SESSION_S, t + d), kind, drop, dtilt }); t += d; }
  }
  return segs;
}

function landmarksAt(u, seg, calib = false) {
  const base = u.neck0 * (1 + (calib ? u.calibErr : u.drift));
  let neck = base, tilt = u.tilt0, fwd = 0;
  if (['head', 'blip', 'subhead'].includes(seg.kind)) { neck = base * (1 - seg.drop); fwd = seg.drop > 0.15 ? 1 : 0.5; }
  if (['shoulder', 'subshoulder'].includes(seg.kind)) tilt = u.tilt0 + seg.dtilt;
  const cx = 0.5, half = u.sw / 2, dy = tilt * u.sw;
  const j = () => N(0, u.noise);
  const lm = Array.from({ length: 33 }, () => ({ x: cx, y: 0.95, z: 0, visibility: 0.9 }));
  lm[11] = { x: cx + half + j(), y: u.shoulderY - dy / 2 + j(), z: 0, visibility: 0.98 };
  lm[12] = { x: cx - half + j(), y: u.shoulderY + dy / 2 + j(), z: 0, visibility: 0.98 };
  const noseY = u.shoulderY - neck * u.sw;
  lm[0] = { x: cx + j(), y: noseY + j(), z: -0.35 - 0.25 * fwd + N(0, 0.03), visibility: rnd() < 0.02 ? 0.3 : 0.99 };
  lm[7] = { x: cx + 0.07 + j(), y: noseY - 0.02 + j(), z: -0.15 + N(0, 0.03), visibility: 0.95 };
  lm[8] = { x: cx - 0.07 + j(), y: noseY - 0.02 + j(), z: -0.15 + N(0, 0.03), visibility: 0.95 };
  return lm;
}

// Sistema v1 (código desplegado): umbrales fijos, 30 fotogramas, cooldown 10 s, decaimiento -2 por fotograma bueno
function legacySystem() {
  let bad = 0, lastWarn = 0, last = 'good', good = 0, badT = 0;
  return {
    step(lm, tMs) {
      const r = legacyAnalyze(lm);
      if (r.isBadPosture) bad++; else bad = Math.max(0, bad - 2);
      let s = 'good', fired = false;
      if (bad >= 30) {
        if (tMs - lastWarn > 10000 || last === 'good') { s = 'bad'; lastWarn = tMs; fired = true; } else s = last;
      }
      last = s; if (s === 'good') good++; else badT++;
      return { fired, state: s };
    },
    timeUnits: () => ({ good, bad: badT }),
  };
}

function v2System(baseline, sensitivity = 'medium') {
  const tr = createPostureTracker(); let last;
  return {
    step(lm, tMs) {
      const a = analyzePosture(lm, { baseline, sensitivity });
      last = tr.update({ detected: Boolean(a.features), ...a }, tMs);
      return { fired: last.alertFired, state: last.state };
    },
    timeUnits: () => ({ good: last.stats.goodPostureTime, bad: last.stats.badPostureTime }),
  };
}

const systems = ['v1', 'v2_sin_calibrar', 'v2_calibrado'];
const agg = Object.fromEntries(systems.map(s => [s, { events: 0, detected: 0, latencies: [], falseAlerts: 0, blipAlerts: 0, blips: 0,
  byFps: {}, asymFalse: 0, asymHours: 0, hours: 0, pctErr: [], timeScale: [] }]));

for (let i = 0; i < USERS; i++) {
  const u = makeUser(i), script = makeScript(), dt = 1000 / u.fps;
  // Calibración: 10 s neutros
  const calSamples = [];
  for (let t = 0; t < 10000; t += dt) calSamples.push(extractFeatures(landmarksAt(u, script[0], true)));
  const baseline = buildBaseline(calSamples);
  const sys = { v1: legacySystem(), v2_sin_calibrar: v2System(null), v2_calibrado: v2System(baseline) };
  const ep = script.map(() => Object.fromEntries(systems.map(s => [s, null])));
  let segIdx = 0, trueGood = 0, trueBad = 0;
  const startMs = 10000; // la sesión evaluada empieza tras la calibración
  for (let t = startMs; t < SESSION_S * 1000; t += dt) {
    while (script[segIdx].to * 1000 <= t) segIdx++;
    u.drift = Math.max(-0.12, Math.min(0.12, u.drift + N(0, 0.0015 * Math.sqrt(dt / 1000)))); // deriva lenta (silla, respaldo)
    const seg = script[segIdx];
    const lm = landmarksAt(u, seg);
    const isBadTruth = seg.kind === 'head' || seg.kind === 'shoulder';
    const sustainedTruth = isBadTruth && t - seg.from * 1000 >= HOLD_MS;
    if (sustainedTruth) trueBad += dt; else trueGood += dt;
    for (const s of systems) {
      const o = sys[s].step(lm, t);
      if (!o.fired) continue;
      if (isBadTruth) { if (ep[segIdx][s] === null) ep[segIdx][s] = (t - seg.from * 1000) / 1000; }
      else {
        // alerta tardía de un episodio que terminó hace < 1 s no cuenta como falsa
        const prev = script[segIdx - 1];
        const lateOk = prev && (prev.kind === 'head' || prev.kind === 'shoulder') && t - prev.to * 1000 < 1000;
        if (!lateOk) { agg[s].falseAlerts++; if (u.asym) agg[s].asymFalse++; if (seg.kind === 'blip') agg[s].blipAlerts++; }
      }
    }
  }
  const hours = (SESSION_S - 10) / 3600;
  script.forEach((seg, k) => {
    if (seg.kind === 'blip') systems.forEach(s => agg[s].blips++);
    if (seg.kind !== 'head' && seg.kind !== 'shoulder') return;
    if (seg.to - seg.from < 4) return; // episodios truncados al final
    for (const s of systems) {
      agg[s].events++;
      const f = (agg[s].byFps[u.fps] ||= { events: 0, detected: 0, lat: [] });
      f.events++;
      if (ep[k][s] !== null) { agg[s].detected++; agg[s].latencies.push(ep[k][s]); f.detected++; f.lat.push(ep[k][s]); }
    }
  });
  const truePct = trueGood / (trueGood + trueBad);
  for (const s of systems) {
    agg[s].hours += hours; if (u.asym) agg[s].asymHours += hours;
    const tu = sys[s].timeUnits();
    agg[s].pctErr.push(Math.abs(tu.good / (tu.good + tu.bad) - truePct) * 100);
    agg[s].timeScale.push({ fps: u.fps, ratio: (tu.good + tu.bad) / ((SESSION_S - 10)) });
  }
}

const med = (a) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const r1 = (x) => Math.round(x * 10) / 10;
const out = {};
for (const s of systems) {
  const a = agg[s];
  out[s] = {
    episodios: a.events,
    recall_pct: r1(100 * a.detected / a.events),
    latencia_mediana_s: r1(med(a.latencies)),
    falsas_alertas_por_hora: r1(a.falseAlerts / a.hours),
    falsas_alertas_por_hora_cuerpos_asimetricos: r1(a.asymFalse / a.asymHours),
    alertas_por_movimientos_breves_pct: r1(100 * a.blipAlerts / a.blips),
    error_pct_tiempo_buena_postura: r1(mean(a.pctErr)),
    unidades_de_tiempo_por_segundo_real: Object.fromEntries([10, 15, 30].map(f => [f + 'fps', r1(mean(a.timeScale.filter(x => x.fps === f).map(x => x.ratio)))])),
    por_fps: Object.fromEntries(Object.entries(a.byFps).map(([f, v]) => [f + 'fps', { recall_pct: r1(100 * v.detected / v.events), latencia_mediana_s: r1(med(v.lat)) }])),
  };
}
const meta = { usuarios: USERS, minutos_por_sesion: SESSION_S / 60, horas_simuladas: r1(agg.v1.hours), asimetricos: null, semilla: 20261116 };
fs.writeFileSync(new URL('./resultados.json', import.meta.url), JSON.stringify({ meta, out }, null, 2));
console.log(JSON.stringify({ meta, out }, null, 2));

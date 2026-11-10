// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('../src/firebase/config', () => ({ db: {}, auth: {}, googleProvider: {} }));
vi.mock('../src/firebase/firestore', () => ({
  saveSessionToFirestore: vi.fn(), getSessionsFromFirestore: vi.fn(async () => []),
  getStreakFromFirestore: vi.fn(async () => ({ days: 0 })), saveStreakToFirestore: vi.fn(),
  getAchievementsFromFirestore: vi.fn(async () => []), saveAchievementsToFirestore: vi.fn(),
  deleteUserDataFromFirestore: vi.fn(),
}));

import ConsentScreen from '../src/components/ConsentScreen';
import PoseDetector from '../src/components/PoseDetector';
import SessionSummary from '../src/components/SessionSummary';
import SettingsPanel from '../src/components/SettingsPanel';

describe('UI smoke', () => {
  it('el consentimiento exige marcar la casilla', () => {
    const onAccept = vi.fn();
    render(<ConsentScreen onAccept={onAccept} onCancel={() => {}} />);
    const btn = screen.getByText('Aceptar y continuar');
    expect(btn.disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(btn);
    expect(onAccept).toHaveBeenCalled();
  });

  it('PoseDetector monta, pide calibración y la ejecuta', async () => {
    let onResults;
    window.Pose = class { setOptions() {} onResults(cb) { onResults = cb; } close() {} send() {} };
    window.Camera = class { start() { return Promise.resolve(); } stop() {} };
    HTMLCanvasElement.prototype.getContext = () => ({ clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, arc() {}, fill() {} });
    await act(async () => {
      render(<PoseDetector soundEnabled={false} settings={{ sensitivity: 'medium', eyeInterval: 20, stretchInterval: 25, workMinutes: 25, breakMinutes: 5 }} onEndSession={() => {}} />);
    });
    expect(screen.getByText('Calibra Alinea a tu cuerpo')).toBeTruthy();
    fireEvent.click(screen.getByText('Calibrar ahora'));
    expect(screen.getByText('Calibrando tu postura neutra')).toBeTruthy();
    expect(typeof onResults).toBe('function');
  });

  it('el resumen muestra porcentaje en segundos y pausas', () => {
    render(<SessionSummary stats={{ goodPostureTime: 90, badPostureTime: 10, alertsCount: 2, headForwardCount: 2, shoulderImbalanceCount: 0 }} elapsed={100} eyeBreaks={{ shown: 2, done: 1 }} onRestart={() => {}} onClose={() => {}} />);
    expect(screen.getByText('90%')).toBeTruthy();
    expect(screen.getByText('1 de 2')).toBeTruthy();
  });

  it('configuración muestra eliminar datos y modo observación', () => {
    render(<SettingsPanel settings={{ sensitivity: 'medium', stretchInterval: 25, eyeInterval: 20, workMinutes: 25, breakMinutes: 5 }} onUpdate={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Eliminar mis datos')).toBeTruthy();
    expect(screen.getByText(/Modo observacion/)).toBeTruthy();
  });
});

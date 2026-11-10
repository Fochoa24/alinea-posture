import { formatCountdown } from '../utils/formatTime';

export default function EyeRestReminder({ countdown, total = 20 * 60 }) {
  const progress = ((total - countdown) / total) * 100;

  return (
    <div className="eye-rest-bar">
      <div className="eye-rest-progress" style={{ width: `${progress}%` }} />
      <div className="eye-rest-content">
        <span className="eye-rest-icon">&#x1F441;</span>
        <span className="eye-rest-text">
          Mirada: mira a 6m por 20 seg en {formatCountdown(countdown)}
        </span>
      </div>
    </div>
  );
}

export function EyeRestAlert({ intervalMinutes = 20, onDone, onSkip }) {
  return (
    <div className="eye-rest-alert-overlay">
      <div className="eye-rest-alert-card">
        <div className="eye-rest-alert-icon">&#x1F441;</div>
        <h3>Descansa tu vista</h3>
        <p>Mira un objeto lejano (6 metros) durante 20 segundos</p>
        <p className="eye-rest-hint">Regla 20-20-20: cada {intervalMinutes} min, mira a 6 m por 20 seg</p>
        <button className="eye-rest-dismiss" onClick={onDone}>Ya lo hice</button>
        <button className="eye-rest-skip" onClick={onSkip}>Omitir esta vez</button>
      </div>
    </div>
  );
}

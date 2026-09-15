export default function PomodoroTimer({ phase, countdown, cycles, active, onStart, onPause, onReset, settings }) {
  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const total = phase === 'work' ? settings.workMinutes * 60 : settings.breakMinutes * 60;
  const progress = ((total - countdown) / total) * 100;

  return (
    <div className={`pomodoro ${phase === 'break' ? 'pomodoro-break' : ''}`}>
      <div className="pomodoro-header">
        <span className="pomodoro-icon">{phase === 'work' ? '\u{1F4DD}' : '\u{2615}'}</span>
        <span className="pomodoro-phase">{phase === 'work' ? 'Trabajo' : 'Descanso'}</span>
        <span className="pomodoro-cycles">Ciclo {cycles + 1}</span>
      </div>
      <div className="pomodoro-time">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</div>
      <div className="pomodoro-progress">
        <div className="pomodoro-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="pomodoro-controls">
        {!active ? (
          <button className="pomodoro-btn" onClick={onStart}>Iniciar</button>
        ) : (
          <button className="pomodoro-btn" onClick={onPause}>Pausar</button>
        )}
        <button className="pomodoro-btn secondary" onClick={onReset}>Reiniciar</button>
      </div>
    </div>
  );
}

import { formatTime } from '../utils/formatTime';

export default function SessionSummary({ stats, elapsed, onRestart, onClose }) {
  const totalFrames = stats.goodPostureTime + stats.badPostureTime;
  const goodPct = totalFrames > 0 ? Math.round((stats.goodPostureTime / totalFrames) * 100) : 0;
  const badPct = totalFrames > 0 ? Math.round((stats.badPostureTime / totalFrames) * 100) : 0;

  const totalAlerts = stats.headForwardCount + stats.shoulderImbalanceCount;

  let grade = 'A';
  let gradeColor = '#2d6a4f';
  if (goodPct < 90) { grade = 'B'; gradeColor = '#40916c'; }
  if (goodPct < 75) { grade = 'C'; gradeColor = '#e9c46a'; }
  if (goodPct < 60) { grade = 'D'; gradeColor = '#e76f51'; }
  if (goodPct < 40) { grade = 'F'; gradeColor = '#e63946'; }

  return (
    <div className="summary-overlay">
      <div className="summary-card">
        <div className="summary-header">
          <h2>Resumen de sesion</h2>
          <button className="summary-close" onClick={close}>&#x2715;</button>
        </div>

        <div className="summary-grade" style={{ color: gradeColor }}>
          <span className="grade-letter">{grade}</span>
          <span className="grade-label">Calificacion postural</span>
        </div>

        <div className="summary-stats">
          <div className="summary-stat">
            <span className="summary-stat-value">{formatTime(elapsed)}</span>
            <span className="summary-stat-label">Tiempo total</span>
          </div>
          <div className="summary-stat">
            <span className="summary-stat-value" style={{ color: '#2d6a4f' }}>{goodPct}%</span>
            <span className="summary-stat-label">Postura buena</span>
          </div>
          <div className="summary-stat">
            <span className="summary-stat-value" style={{ color: '#e76f51' }}>{badPct}%</span>
            <span className="summary-stat-label">Postura mala</span>
          </div>
          <div className="summary-stat">
            <span className="summary-stat-value">{totalAlerts}</span>
            <span className="summary-stat-label">Alertas recibidas</span>
          </div>
        </div>

        <div className="summary-details">
          <div className="summary-detail">
            <span>Cabeza adelantada detectada:</span>
            <span>{stats.headForwardCount} veces</span>
          </div>
          <div className="summary-detail">
            <span>Desbalance de hombros:</span>
            <span>{stats.shoulderImbalanceCount} veces</span>
          </div>
        </div>

        <div className="summary-actions">
          <button className="summary-btn primary" onClick={onRestart}>Nueva sesion</button>
          <button className="summary-btn secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Guía visual de la calibración personal (RF04): el usuario se sienta en su
 * postura neutra durante 10 segundos y Alinea la usa como referencia.
 */
export default function CalibrationOverlay({ calibration, hasBaseline, onStart, onSkip }) {
  if (calibration.active) {
    const pct = Math.round(calibration.progress * 100);
    const remaining = Math.ceil((1 - calibration.progress) * 10);
    return (
      <div className="calibration-overlay">
        <div className="calibration-card">
          <h3>Calibrando tu postura neutra</h3>
          <p>Siéntate derecho, hombros relajados y mirada al frente. Quédate así {remaining} s.</p>
          <div className="calibration-bar"><div className="calibration-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>
    );
  }

  if (!hasBaseline) {
    return (
      <div className="calibration-overlay">
        <div className="calibration-card">
          <h3>Calibra Alinea a tu cuerpo</h3>
          <p>
            En 10 segundos Alinea aprende cómo es <strong>tu</strong> postura correcta. Así las alertas se
            ajustan a tu cuerpo, tu cámara y tu luz, y no a un estándar.
          </p>
          {calibration.failed && (
            <p className="calibration-error">No se detectó bien tu cuerpo. Asegúrate de que se vean tu cabeza y tus hombros.</p>
          )}
          <div className="summary-actions">
            <button className="summary-btn primary" onClick={onStart}>Calibrar ahora</button>
            <button className="summary-btn secondary" onClick={onSkip}>Usar umbrales generales</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

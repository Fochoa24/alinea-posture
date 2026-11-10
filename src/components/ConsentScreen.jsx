import { useState } from 'react';

/**
 * Consentimiento informado previo al uso de la cámara (RF02).
 * Explica qué se procesa, qué se guarda, dónde y para qué.
 */
export default function ConsentScreen({ onAccept, onCancel }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="settings-overlay">
      <div className="settings-card consent-card">
        <div className="settings-header">
          <h2>Antes de encender la cámara</h2>
        </div>

        <div className="consent-section">
          <h3>&#x1F3A5; Qué se procesa y dónde</h3>
          <p>
            La imagen de tu cámara se analiza <strong>solo en tu navegador</strong>, en memoria.
            Ningún fotograma ni punto corporal se graba, se guarda ni se envía a un servidor.
          </p>
        </div>

        <div className="consent-section">
          <h3>&#x2601; Qué se guarda en la nube</h3>
          <p>
            Al terminar cada sesión se guardan <strong>solo métricas resumidas</strong> asociadas a tu
            cuenta: duración, segundos en buena y mala postura, número de alertas, pausas realizadas y ciclos
            Pomodoro. Solo tú puedes leerlas.
          </p>
        </div>

        <div className="consent-section">
          <h3>&#x1F4BB; Qué se guarda en este equipo</h3>
          <p>Tu configuración y tu postura de referencia (calibración), para no pedirla cada vez.</p>
        </div>

        <div className="consent-section">
          <h3>&#x2705; Tus derechos</h3>
          <p>
            Puedes pausar el monitoreo cuando quieras, exportar tus datos (CSV) y eliminarlos
            desde Configuración &rarr; &laquo;Eliminar mis datos&raquo;.
          </p>
        </div>

        <p className="consent-disclaimer">
          Alinea es una herramienta de prevención y autocuidado. <strong>No realiza diagnósticos</strong> ni
          reemplaza una evaluación de un profesional de la salud.
        </p>

        <label className="settings-label consent-check">
          <input
            type="checkbox"
            className="settings-checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          Entiendo cómo se usan mis datos y acepto usar la cámara con Alinea
        </label>

        <div className="summary-actions">
          <button className="summary-btn primary" disabled={!checked} onClick={onAccept}>
            Aceptar y continuar
          </button>
          <button className="summary-btn secondary" onClick={onCancel}>Ahora no</button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { COLORS } from '../utils/constants';

// Antes el botón "Entendido" reiniciaba todas las estadísticas de la sesión.
// Ahora solo oculta el aviso actual; reaparece en la siguiente alerta.
export default function PostureAlert({ state }) {
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => { if (state !== 'bad') setDismissed(false); }, [state]);
  if (state === 'good' || state === 'no_person' || dismissed) return null;

  return (
    <div className="posture-alert" style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: COLORS.warningLight,
      color: COLORS.warning,
      padding: '12px 24px',
      borderRadius: '12px',
      border: `2px solid ${COLORS.warning}`,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 4px 12px rgba(231, 111, 81, 0.2)',
      animation: 'pulse 2s infinite',
      zIndex: 10,
    }}>
      <span style={{ fontSize: '20px' }}>&#x26A0;</span>
      <span role="alert" style={{ fontWeight: 500 }}>Endereza tu postura - relaja los hombros y alinea la cabeza</span>
      <button
        onClick={() => setDismissed(true)}
        style={{
          backgroundColor: COLORS.warning,
          color: 'white',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        Entendido
      </button>
    </div>
  );
}

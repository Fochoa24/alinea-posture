import { COLORS } from '../utils/constants';

export default function PostureAlert({ state, onReset }) {
  if (state === 'good' || state === 'no_person') return null;

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
      <span style={{ fontWeight: 500 }}>Endereza tu postura - relaja los hombros y alinea la cabeza</span>
      <button
        onClick={onReset}
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

export default function WarmLightFilter({ active }) {
  if (!active) return null;
  return (
    <div
      className="warm-light-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255, 180, 100, 0.08)',
        mixBlendMode: 'multiply',
        pointerEvents: 'none',
        zIndex: 3,
        borderRadius: '16px',
      }}
    />
  );
}

export default function SoundToggle({ enabled, onToggle }) {
  return (
    <button className="toggle-btn sound-toggle" onClick={onToggle} title={enabled ? 'Silenciar' : 'Activar sonido'}>
      {enabled ? '\u{1F50A}' : '\u{1F507}'}
    </button>
  );
}

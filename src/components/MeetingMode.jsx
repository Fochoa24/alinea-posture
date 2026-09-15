export default function MeetingMode({ active, onToggle }) {
  return (
    <button
      className={`toggle-btn meeting-toggle ${active ? 'meeting-active' : ''}`}
      onClick={onToggle}
      title={active ? 'Salir de modo reunion' : 'Modo reunion - pausar alertas'}
    >
      {'\u{1F4BB}'}
    </button>
  );
}

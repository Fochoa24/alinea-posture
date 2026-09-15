export default function DarkModeToggle({ dark, onToggle }) {
  return (
    <button className="toggle-btn dark-toggle" onClick={onToggle} title={dark ? 'Modo claro' : 'Modo oscuro'}>
      {dark ? '\u2600' : '\u263E'}
    </button>
  );
}

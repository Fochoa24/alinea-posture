import { useState } from 'react';
import { getSettings, saveSettings } from '../utils/storage';

const DEFAULT_SETTINGS = {
  sensitivity: 'medium',
  stretchInterval: 25,
  eyeInterval: 20,
  workMinutes: 25,
  breakMinutes: 5,
  warmLight: false,
};

export function useSettings() {
  const [settings, setSettingsState] = useState(() => getSettings() || DEFAULT_SETTINGS);

  const updateSettings = (partial) => {
    const next = { ...settings, ...partial };
    setSettingsState(next);
    saveSettings(next);
    return next;
  };

  return { settings, updateSettings };
}

export default function SettingsPanel({ settings, onUpdate, onClose }) {
  const [local, setLocal] = useState({ ...settings });

  const handleChange = (key, value) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onUpdate(local);
    onClose();
  };

  return (
    <div className="settings-overlay">
      <div className="settings-card">
        <div className="settings-header">
          <h2>Configuracion</h2>
          <button className="summary-close" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="settings-group">
          <label className="settings-label">Sensibilidad de deteccion</label>
          <div className="settings-options">
            {[['low', 'Baja'], ['medium', 'Media'], ['high', 'Alta']].map(([val, label]) => (
              <button
                key={val}
                className={`settings-option ${local.sensitivity === val ? 'active' : ''}`}
                onClick={() => handleChange('sensitivity', val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <label className="settings-label">Recordatorio de estiramientos (minutos)</label>
          <input
            type="range"
            min="10"
            max="60"
            value={local.stretchInterval}
            onChange={(e) => handleChange('stretchInterval', Number(e.target.value))}
            className="settings-range"
          />
          <span className="settings-range-value">{local.stretchInterval} min</span>
        </div>

        <div className="settings-group">
          <label className="settings-label">Descanso visual (minutos)</label>
          <input
            type="range"
            min="10"
            max="40"
            value={local.eyeInterval}
            onChange={(e) => handleChange('eyeInterval', Number(e.target.value))}
            className="settings-range"
          />
          <span className="settings-range-value">{local.eyeInterval} min</span>
        </div>

        <div className="settings-group">
          <label className="settings-label">Pomodoro - Trabajo (minutos)</label>
          <input
            type="range"
            min="15"
            max="60"
            value={local.workMinutes}
            onChange={(e) => handleChange('workMinutes', Number(e.target.value))}
            className="settings-range"
          />
          <span className="settings-range-value">{local.workMinutes} min</span>
        </div>

        <div className="settings-group">
          <label className="settings-label">Pomodoro - Descanso (minutos)</label>
          <input
            type="range"
            min="3"
            max="15"
            value={local.breakMinutes}
            onChange={(e) => handleChange('breakMinutes', Number(e.target.value))}
            className="settings-range"
          />
          <span className="settings-range-value">{local.breakMinutes} min</span>
        </div>

        <div className="settings-group">
          <label className="settings-label">
            <input
              type="checkbox"
              checked={local.warmLight}
              onChange={(e) => handleChange('warmLight', e.target.checked)}
              className="settings-checkbox"
            />
            Filtro luz calida nocturna
          </label>
        </div>

        <button className="settings-save" onClick={handleSave}>Guardar</button>
      </div>
    </div>
  );
}

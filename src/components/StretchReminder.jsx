import { formatTime } from '../utils/formatTime';

export default function StretchReminder({ onDismiss }) {
  return (
    <div className="stretch-alert-overlay">
      <div className="stretch-alert-card">
        <div className="stretch-alert-icon">&#x1F9D8;</div>
        <h3>Hora de estirarte</h3>
        <p>Llevas un rato sentado. Levantate, estira las piernas y los brazos.</p>
        <div className="stretch-tips">
          <div className="stretch-tip">
            <span>&#x1F4AA;</span>
            <span>Estira los brazos hacia arriba por 10 seg</span>
          </div>
          <div className="stretch-tip">
            <span>&#x1F9B4;</span>
            <span>Gira el cuello suavemente a cada lado</span>
          </div>
          <div className="stretch-tip">
            <span>&#x1F9B5;</span>
            <span>Ponte de pie y camina un minuto</span>
          </div>
        </div>
        <button className="stretch-dismiss" onClick={onDismiss}>Volver a trabajar</button>
      </div>
    </div>
  );
}

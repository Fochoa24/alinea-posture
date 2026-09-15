import { formatTime } from '../utils/formatTime';

export default function SessionTimer({ elapsed }) {
  return (
    <div className="session-timer">
      <span className="timer-icon">&#x23F1;</span>
      <span className="timer-value">{formatTime(elapsed)}</span>
    </div>
  );
}

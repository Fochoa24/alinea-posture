export default function PostureHistory({ history }) {
  const total = history.length || 1;
  const goodCount = history.filter(h => h === 'good').length;
  const badCount = history.filter(h => h === 'bad').length;
  const goodPct = Math.round((goodCount / total) * 100);
  const badPct = Math.round((badCount / total) * 100);

  return (
    <div className="posture-history">
      <div className="history-header">
        <span className="history-label">Historial de postura</span>
        <span className="history-pct">{goodPct}% buena</span>
      </div>
      <div className="history-bar">
        <div className="history-good" style={{ width: `${goodPct}%` }} />
        <div className="history-bad" style={{ width: `${badPct}%` }} />
      </div>
      <div className="history-legend">
        <span className="legend-good">Buena: {goodCount}</span>
        <span className="legend-bad">Mala: {badCount}</span>
      </div>
    </div>
  );
}

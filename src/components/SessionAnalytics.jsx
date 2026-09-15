import { useState, useEffect } from 'react';
import { getWeekSessions, getMonthSessions, getSessions } from '../utils/storage';
import { formatTime } from '../utils/formatTime';

export default function SessionAnalytics({ onClose }) {
  const [range, setRange] = useState('week');
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const load = async () => {
      let data;
      if (range === 'week') data = await getWeekSessions();
      else if (range === 'month') data = await getMonthSessions();
      else data = await getSessions();
      setSessions(data);
    };
    load();
  }, [range]);

  const totalSessions = sessions.length;
  const totalTime = sessions.reduce((acc, s) => acc + (s.elapsed || 0), 0);

  const goodPctList = sessions.map(s => {
    const total = (s.goodPostureTime || 0) + (s.badPostureTime || 0);
    return total > 0 ? Math.round((s.goodPostureTime / total) * 100) : 0;
  });
  const avgGoodPct = goodPctList.length > 0 ? Math.round(goodPctList.reduce((a, b) => a + b, 0) / goodPctList.length) : 0;

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const dailyData = {};

  sessions.forEach(s => {
    const d = new Date(s.date);
    const key = `${d.getMonth()}/${d.getDate()}`;
    if (!dailyData[key]) dailyData[key] = { good: 0, bad: 0, label: `${dayNames[d.getDay()]} ${d.getDate()}` };
    dailyData[key].good += s.goodPostureTime || 0;
    dailyData[key].bad += s.badPostureTime || 0;
  });

  const dailyEntries = Object.values(dailyData).slice(-14);
  const maxFrames = Math.max(...dailyEntries.map(d => d.good + d.bad), 1);

  return (
    <div className="analytics-overlay">
      <div className="analytics-card">
        <div className="analytics-header">
          <h2>Evolucion postural</h2>
          <button className="summary-close" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="analytics-range-toggle">
          {['week', 'month', 'all'].map(r => (
            <button key={r} className={`range-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
              {r === 'week' ? 'Semana' : r === 'month' ? 'Mes' : 'Todo'}
            </button>
          ))}
        </div>

        <div className="analytics-summary">
          <div className="analytics-stat">
            <span className="analytics-stat-value">{totalSessions}</span>
            <span className="analytics-stat-label">Sesiones</span>
          </div>
          <div className="analytics-stat">
            <span className="analytics-stat-value">{formatTime(totalTime)}</span>
            <span className="analytics-stat-label">Tiempo total</span>
          </div>
          <div className="analytics-stat">
            <span className="analytics-stat-value" style={{ color: avgGoodPct >= 70 ? '#2d6a4f' : '#e76f51' }}>{avgGoodPct}%</span>
            <span className="analytics-stat-label">Postura promedio</span>
          </div>
        </div>

        {dailyEntries.length > 0 && (
          <div className="analytics-chart">
            <div className="chart-header">Sesiones por dia</div>
            <div className="chart-bars">
              {dailyEntries.map((d, i) => {
                const total = d.good + d.bad;
                const goodH = (d.good / maxFrames) * 100;
                const badH = (d.bad / maxFrames) * 100;
                return (
                  <div key={i} className="chart-col">
                    <div className="chart-bar-stack">
                      <div className="chart-bar bad-bar" style={{ height: `${badH}%` }} />
                      <div className="chart-bar good-bar" style={{ height: `${goodH}%` }} />
                    </div>
                    <span className="chart-label">{d.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="chart-legend">
              <span><span className="legend-dot good-dot" /> Buena</span>
              <span><span className="legend-dot bad-dot" /> Mala</span>
            </div>
          </div>
        )}

        {sessions.length >= 2 && (
          <div className="comparison-section">
            <div className="comparison-title">Comparacion</div>
            <ComparisonRow
              label="Ultima vs Penultima"
              today={sessions[0]}
              yesterday={sessions[1]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ComparisonRow({ label, today, yesterday }) {
  const getPct = (s) => {
    const total = (s.goodPostureTime || 0) + (s.badPostureTime || 0);
    return total > 0 ? Math.round((s.goodPostureTime / total) * 100) : 0;
  };

  const todayPct = getPct(today);
  const yesterdayPct = getPct(yesterday);
  const diff = todayPct - yesterdayPct;

  return (
    <div className="comparison-row">
      <span className="comparison-label">{label}</span>
      <span className="comparison-value">
        {todayPct}% vs {yesterdayPct}%
        <span className={`comparison-diff ${diff >= 0 ? 'positive' : 'negative'}`}>
          {diff >= 0 ? '+' : ''}{diff}%
        </span>
      </span>
    </div>
  );
}

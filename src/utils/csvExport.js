import { getSessions } from './storage';

export async function exportSessionsCSV() {
  const sessions = await getSessions();
  if (sessions.length === 0) return null;

  const headers = [
    'Fecha', 'Duracion (seg)', 'Postura Buena (%)', 'Postura Mala (%)',
    'Cabeza Adelantada', 'Desbalance Hombros', 'Alertas Totales'
  ];

  const rows = sessions.map(s => {
    const total = (s.goodPostureTime || 0) + (s.badPostureTime || 0);
    const goodPct = total > 0 ? Math.round((s.goodPostureTime / total) * 100) : 0;
    const badPct = total > 0 ? Math.round((s.badPostureTime / total) * 100) : 0;
    const alerts = (s.headForwardCount || 0) + (s.shoulderImbalanceCount || 0);

    return [
      new Date(s.date).toLocaleString('es-CL'),
      s.elapsed || 0,
      goodPct,
      badPct,
      s.headForwardCount || 0,
      s.shoulderImbalanceCount || 0,
      alerts,
    ];
  });

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `alinea_sesiones_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  return sessions.length;
}

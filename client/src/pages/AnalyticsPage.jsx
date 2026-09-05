import { useEffect, useMemo, useState } from 'react';
import MapCanvas from '../components/MapCanvas.jsx';
import { api } from '../utils/api.js';

export default function AnalyticsPage() {
  const [campus, setCampus] = useState(null);
  const [data, setData] = useState({ total: 0, counts: [], timeline: [], hotspots: [] });
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [error, setError] = useState('');

  useEffect(() => { api.get('/api/meta/campus').then(setCampus).catch((err) => setError(err.message)); }, []);
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    api.get(`/api/analytics/summary${params.toString() ? `?${params}` : ''}`).then(setData).catch((err) => setError(err.message));
  }, [filters]);

  const maxCount = useMemo(() => Math.max(1, ...data.counts.map((x) => Number(x.count))), [data.counts]);
  const maxDay = useMemo(() => Math.max(1, ...data.timeline.map((x) => Number(x.count))), [data.timeline]);

  return (
    <div>
      <div className="page-heading"><div><p className="eyebrow">CPS analytics</p><h1>Hotspots and incident trends</h1></div></div>
      {error && <div className="alert error">{error}</div>}
      <section className="filter-bar analytics-filter">
        <label>From<input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} /></label>
        <label>To<input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} /></label>
        <button className="button ghost" onClick={() => setFilters({ from: '', to: '' })}>Clear</button>
      </section>
      <div className="analytics-grid">
        <section className="chart-card">
          <div className="panel-title"><h2>Valid incidents by type</h2><strong>{data.total} total</strong></div>
          {data.counts.length === 0 ? <div className="empty-state">No valid incidents in this time window.</div> : <div className="bar-chart">
            {data.counts.map((item) => <div className="bar-row" key={item.category}><span>{item.category}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${(Number(item.count) / maxCount) * 100}%` }} /></div><strong>{item.count}</strong></div>)}
          </div>}
        </section>
        <section className="chart-card">
          <div className="panel-title"><h2>Incidents over time</h2><span>Daily</span></div>
          {data.timeline.length === 0 ? <div className="empty-state">No timeline data.</div> : <div className="timeline-chart">
            {data.timeline.map((item) => <div className="timeline-column" key={item.day} title={`${item.day}: ${item.count}`}><div className="timeline-bar" style={{ height: `${Math.max(10, (Number(item.count) / maxDay) * 140)}px` }} /><span>{item.day.slice(5)}</span></div>)}
          </div>}
        </section>
      </div>
      <section className="chart-card map-card">
        <div className="panel-title"><h2>Hotspot intensity</h2><span>Invalid and duplicate records excluded</span></div>
        <MapCanvas boundary={campus?.geometry} hotspots={data.hotspots} height={520} />
      </section>
    </div>
  );
}

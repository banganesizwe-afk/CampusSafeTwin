import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import MapCanvas from '../components/MapCanvas.jsx';
import { api } from '../utils/api.js';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const categories = ['', 'theft', 'medical', 'suspicious activity', 'vandalism', 'harassment', 'other'];
const statuses = ['', 'New', 'Acknowledged', 'In Progress', 'Resolved', 'Invalid', 'Duplicate'];

function dateWithin(item, filters) {
  const value = new Date(item.created_at).getTime();
  if (filters.from && value < new Date(`${filters.from}T00:00:00`).getTime()) return false;
  if (filters.to && value >= new Date(`${filters.to}T00:00:00`).getTime() + 86400000) return false;
  return true;
}

function matches(item, filters) {
  return (!filters.category || item.category === filters.category)
    && (!filters.status || item.status === filters.status)
    && dateWithin(item, filters);
}

function nextStatusOptions(current) {
  const map = {
    'New': ['Acknowledged', 'Invalid', 'Duplicate'],
    'Acknowledged': ['In Progress', 'Invalid', 'Duplicate'],
    'In Progress': ['Resolved', 'Invalid', 'Duplicate'],
    'Resolved': ['Invalid', 'Duplicate'],
    'Invalid': [],
    'Duplicate': [],
  };
  return map[current] ?? [];
}

export default function SecurityDashboardPage() {
  const [campus, setCampus] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: '', from: '', to: '' });
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const [selectedId, setSelectedId] = useState(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState('');
  const [nextStatus, setNextStatus] = useState('');
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [clock, setClock] = useState(Date.now());

  const buildQuery = useCallback((activeFilters = filtersRef.current) => {
    const params = new URLSearchParams();
    Object.entries(activeFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return params.toString() ? `?${params.toString()}` : '';
  }, []);

  const loadIncidents = useCallback(async (activeFilters = filtersRef.current) => {
    const data = await api.get(`/api/incidents/security/list/all${buildQuery(activeFilters)}`);
    setIncidents(data.incidents);
    setLastRefresh(Date.now());
    return data.incidents;
  }, [buildQuery]);

  const refreshOne = useCallback(async (id) => {
    try {
      const { incident } = await api.get(`/api/incidents/${id}`);
      setIncidents((current) => {
        const without = current.filter((item) => String(item.id) !== String(id));
        if (!matches(incident, filtersRef.current)) return without;
        return [incident, ...without].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      });
      setLastRefresh(Date.now());
      if (String(selectedIdRef.current) === String(id)) setDetail(incident);
    } catch (err) {
      if (err.status !== 404) setError(err.message);
    }
  }, []);

  useEffect(() => {
    api.get('/api/meta/campus').then(setCampus).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadIncidents(filters).catch((err) => setError(err.message));
  }, [filters, loadIncidents]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    api.get(`/api/incidents/${selectedId}`).then(({ incident }) => setDetail(incident)).catch((err) => setError(err.message));
  }, [selectedId]);

  useEffect(() => {
    const token = localStorage.getItem('campussafe_token');
    const socket = io(API_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('connect_error', () => setSocketConnected(false));
    socket.on('incident:created', ({ id }) => refreshOne(id));
    socket.on('incident:updated', ({ id }) => refreshOne(id));
    socket.on('dataset:reset', () => loadIncidents().catch((err) => setError(err.message)));
    return () => socket.close();
  }, [loadIncidents, refreshOne]);

  useEffect(() => {
    if (socketConnected) return undefined;
    const timer = setInterval(() => loadIncidents().catch(() => {}), 8000);
    return () => clearInterval(timer);
  }, [socketConnected, loadIncidents]);

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const stale = !socketConnected && clock - lastRefresh > 15000;
  const counts = useMemo(() => statuses.slice(1, 5).map((status) => ({ status, count: incidents.filter((i) => i.status === status).length })), [incidents]);

  async function changeStatus(event) {
    event.preventDefault();
    if (!detail || !nextStatus) return;
    try {
      await api.patch(`/api/incidents/security/${detail.id}/status`, { status: nextStatus, note });
      setNextStatus(''); setNote('');
      await refreshOne(detail.id);
    } catch (err) { setError(err.message); }
  }

  async function openPhoto(id) {
    try {
      const blob = await api.getBlob(`/api/incidents/${id}/photo`);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <div className="page-heading dashboard-heading">
        <div><p className="eyebrow">Campus Protection Services</p><h1>Incident operations dashboard</h1></div>
        <div className={`connection-pill ${socketConnected ? 'live' : stale ? 'stale' : 'fallback'}`}>
          {socketConnected ? '● Live channel connected' : stale ? '● Data may be stale' : '● Polling fallback active'}
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="metric-row dashboard-metrics">{counts.map((item) => <div key={item.status}><span>{item.status}</span><strong>{item.count}</strong></div>)}</div>
      <section className="filter-bar" aria-label="Incident filters">
        <label>Type<select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>{categories.map((v) => <option key={v || 'all'} value={v}>{v || 'All types'}</option>)}</select></label>
        <label>Status<select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>{statuses.map((v) => <option key={v || 'all'} value={v}>{v || 'All statuses'}</option>)}</select></label>
        <label>From<input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} /></label>
        <label>To<input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} /></label>
        <button className="button ghost" onClick={() => setFilters({ category: '', status: '', from: '', to: '' })}>Clear</button>
      </section>
      <div className="security-layout">
        <section className="incident-list-panel">
          <div className="panel-title"><h2>Incident feed</h2><span>{incidents.length} matching</span></div>
          <div className="incident-feed">
            {incidents.length === 0 && <div className="empty-state">No incidents match these filters.</div>}
            {incidents.map((item) => <button key={item.id} className={`incident-row ${String(selectedId) === String(item.id) ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)}>
              <span className="incident-row-top"><strong>{item.reference}</strong><span className="status-badge">{item.status}</span></span>
              <span className="incident-row-mid">{item.category}</span>
              <span className="incident-row-bottom">{new Date(item.created_at).toLocaleString()} • {item.reporter_name}</span>
            </button>)}
          </div>
        </section>
        <section>
          <MapCanvas boundary={campus?.geometry} incidents={incidents} selectedIncidentId={selectedId} onMarkerClick={(item) => setSelectedId(item.id)} height={610} />
        </section>
        <aside className="detail-panel">
          <h2>Incident detail</h2>
          {!detail ? <p className="muted">Select a row or map marker. Live updates will not reset your filters, selection or map position.</p> : <>
            <dl className="detail-list">
              <dt>Reference</dt><dd>{detail.reference}</dd>
              <dt>Reporter</dt><dd>{detail.reporter_name}<br /><span className="small muted">{detail.reporter_email}</span></dd>
              <dt>Type</dt><dd>{detail.category}</dd>
              <dt>Status</dt><dd>{detail.status}</dd>
              <dt>Description</dt><dd>{detail.description}</dd>
              <dt>Time</dt><dd>{new Date(detail.created_at).toLocaleString()}</dd>
            </dl>
            {detail.has_photo && <button className="button secondary" onClick={() => openPhoto(detail.id)}>Open private photo</button>}
            {nextStatusOptions(detail.status).length > 0 && <form className="stacked-form compact" onSubmit={changeStatus}>
              <label>Change status<select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}><option value="">Choose next state</option>{nextStatusOptions(detail.status).map((v) => <option key={v}>{v}</option>)}</select></label>
              <label>Security note (optional)<textarea rows="3" maxLength="1000" value={note} onChange={(e) => setNote(e.target.value)} /></label>
              <button className="button primary" disabled={!nextStatus}>Save status change</button>
            </form>}
            <h3>Status history</h3>
            <div className="history-list">{(detail.history ?? []).map((h) => <div key={h.id}><strong>{h.new_status}</strong><span>{new Date(h.changed_at).toLocaleString()} • {h.changed_by}</span>{h.note && <p>{h.note}</p>}</div>)}</div>
          </>}
        </aside>
      </div>
    </div>
  );
}

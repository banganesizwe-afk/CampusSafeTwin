import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';

export default function MyReportsPage() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/incidents/mine').then((data) => setIncidents(data.incidents)).catch((err) => setError(err.message));
  }, []);

  async function openIncident(id) {
    try {
      const { incident } = await api.get(`/api/incidents/${id}`);
      setSelected(incident);
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
    <div className="page-grid wide-side">
      <section>
        <p className="eyebrow">Student history</p><h1>My reports</h1>
        {error && <div className="alert error">{error}</div>}
        <div className="table-card">
          {incidents.length === 0 ? <div className="empty-state">You have not submitted any reports yet.</div> : (
            <table><thead><tr><th>Reference</th><th>Type</th><th>Status</th><th>Submitted</th><th /></tr></thead>
              <tbody>{incidents.map((item) => <tr key={item.id}><td>{item.reference}</td><td>{item.category}</td><td><span className="status-badge">{item.status}</span></td><td>{new Date(item.created_at).toLocaleString()}</td><td><button className="text-button" onClick={() => openIncident(item.id)}>Open</button></td></tr>)}</tbody>
            </table>
          )}
        </div>
      </section>
      <aside className="side-panel">
        <h2>Report detail</h2>
        {!selected ? <p className="muted">Open one of your reports to view its full description and attachment access.</p> : <>
          <dl className="detail-list">
            <dt>Reference</dt><dd>{selected.reference}</dd>
            <dt>Type</dt><dd>{selected.category}</dd>
            <dt>Status</dt><dd>{selected.status}</dd>
            <dt>Description</dt><dd>{selected.description}</dd>
            <dt>Submitted</dt><dd>{new Date(selected.created_at).toLocaleString()}</dd>
          </dl>
          {selected.has_photo && <button className="button secondary" onClick={() => openPhoto(selected.id)}>Open attached photo</button>}
          <p className="small muted">Attachment access is authorised by the server. Another student cannot open this detail route.</p>
        </>}
      </aside>
    </div>
  );
}

import { useEffect, useState } from 'react';
import MapCanvas from '../components/MapCanvas.jsx';
import { api } from '../utils/api.js';

export default function StudentHomePage() {
  const [campus, setCampus] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/api/meta/campus'), api.get('/api/incidents/map')])
      .then(([campusData, incidentData]) => {
        setCampus(campusData);
        setIncidents(incidentData.incidents);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page-grid">
      <section>
        <div className="page-heading">
          <div><p className="eyebrow">Student view</p><h1>Campus safety map</h1></div>
        </div>
        {error && <div className="alert error">{error}</div>}
        <MapCanvas boundary={campus?.geometry} incidents={incidents} />
        <div className="notice-card">
          <strong>Coverage is limited to the defined campus prototype area.</strong>
          <span>Map markers show valid reported incidents without another student’s identity, description or photograph.</span>
        </div>
      </section>
      <aside className="side-panel">
        <h2>What the map means</h2>
        <p>Markers show incident type, status and location for valid reports. Invalid and duplicate reports stay in the audit history but are not shown here.</p>
        <div className="legend-list">
          <span><i className="dot new" /> New</span>
          <span><i className="dot ack" /> Acknowledged</span>
          <span><i className="dot progress" /> In Progress</span>
          <span><i className="dot resolved" /> Resolved</span>
        </div>
      </aside>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import MapCanvas from '../components/MapCanvas.jsx';
import { api } from '../utils/api.js';
import { pointInPolygon } from '../utils/geo.js';

export default function RoutePlannerPage() {
  const [campus, setCampus] = useState(null);
  const [network, setNetwork] = useState([]);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/api/meta/campus'), api.get('/api/meta/network')])
      .then(([campusData, networkData]) => { setCampus(campusData); setNetwork(networkData.nodes); })
      .catch((err) => setError(err.message));
  }, []);

  const ready = useMemo(() => Boolean(start && end), [start, end]);

  function choose(point) {
    setResult(null);
    if (!campus?.geometry || !pointInPolygon(point.lat, point.lng, campus.geometry)) {
      setError('Choose route points inside the defined campus area.');
      return;
    }
    setError('');
    if (!start || (start && end)) {
      setStart(point);
      setEnd(null);
    } else {
      setEnd(point);
    }
  }

  function chooseNode(which, id) {
    const node = network.find((n) => String(n.id) === String(id));
    if (!node) return;
    const point = { lat: node.lat, lng: node.lng };
    if (which === 'start') setStart(point); else setEnd(point);
    setResult(null);
    setError('');
  }

  async function calculate() {
    if (!ready) return;
    setBusy(true); setError(''); setResult(null);
    try {
      setResult(await api.post('/api/routes', { start, end }));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const draftMarkers = [
    start && { id: 'start', ...start, category: 'Start', status: 'Resolved' },
    end && { id: 'end', ...end, category: 'End', status: 'New' },
  ].filter(Boolean);

  return (
    <div className="split-layout route-layout">
      <section className="form-card">
        <p className="eyebrow">Student routing</p><h1>Safer-route recommendation</h1>
        <p className="muted">Pick a start and end point on the prepared walking network. You can click the map or use the named network points.</p>
        <div className="stacked-form">
          <label>Start network point
            <select value="" onChange={(e) => chooseNode('start', e.target.value)}><option value="">Choose or click map</option>{network.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}</select>
          </label>
          <label>End network point
            <select value="" onChange={(e) => chooseNode('end', e.target.value)}><option value="">Choose or click map</option>{network.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}</select>
          </label>
          <div className="route-points">
            <span><strong>Start:</strong> {start ? `${start.lat.toFixed(5)}, ${start.lng.toFixed(5)}` : 'not selected'}</span>
            <span><strong>End:</strong> {end ? `${end.lat.toFixed(5)}, ${end.lng.toFixed(5)}` : 'not selected'}</span>
          </div>
          {error && <div className="alert error">{error}</div>}
          <button className="button primary" disabled={!ready || busy} onClick={calculate}>{busy ? 'Calculating…' : 'Calculate route'}</button>
          {result && <>
            <div className="metric-row"><div><span>Distance route</span><strong>{result.shortest.baseDistanceMetres} m</strong></div><div><span>Recommended route</span><strong>{result.safer.baseDistanceMetres} m</strong></div></div>
            <div className="alert warning"><strong>Important:</strong> {result.warning}</div>
            <p className="small muted">{result.saferChanged ? 'Incident weighting changed the preferred path.' : 'The incident weighting did not change the distance-only path for this request.'}</p>
          </>}
        </div>
      </section>
      <section>
        <MapCanvas
          boundary={campus?.geometry}
          incidents={draftMarkers}
          networkNodes={network}
          onMapClick={choose}
          shortestRoute={result?.shortest?.coordinates ?? []}
          saferRoute={result?.safer?.coordinates ?? []}
          height={680}
        />
        <div className="notice-card"><strong>Blue line = safer-route recommendation</strong><span>The dashed line is distance-only. The recommendation uses only recent valid reports in this prototype.</span></div>
      </section>
    </div>
  );
}

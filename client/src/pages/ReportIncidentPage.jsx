import { useEffect, useMemo, useState } from 'react';
import MapCanvas from '../components/MapCanvas.jsx';
import { api } from '../utils/api.js';
import { pointInPolygon } from '../utils/geo.js';

const categories = ['theft', 'medical', 'suspicious activity', 'vandalism', 'harassment', 'other'];

export default function ReportIncidentPage() {
  const [campus, setCampus] = useState(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoMessage, setPhotoMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/api/meta/campus').then(setCampus).catch((err) => setError(err.message)); }, []);

  const ready = useMemo(() => Boolean(category && description.trim() && pin), [category, description, pin]);

  function choosePin(point) {
    setSuccess(null);
    if (!campus?.geometry || !pointInPolygon(point.lat, point.lng, campus.geometry)) {
      setError('Choose a location inside the defined campus boundary.');
      return;
    }
    setError('');
    setPin(point);
  }

  function choosePhoto(file) {
    setPhotoMessage('');
    if (!file) return setPhoto(null);
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setPhoto(null);
      return setPhotoMessage('That photo will not be attached. Only JPEG and PNG are accepted. You can still submit the report.');
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhoto(null);
      return setPhotoMessage('That photo will not be attached because it is larger than 5 MB. You can still submit the report.');
    }
    setPhoto(file);
  }

  async function submit(event) {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError('');
    setSuccess(null);
    const data = new FormData();
    data.append('category', category);
    data.append('description', description.trim());
    data.append('lat', String(pin.lat));
    data.append('lng', String(pin.lng));
    if (photo) data.append('photo', photo);
    try {
      const result = await api.post('/api/incidents', data);
      setSuccess(result.incident);
      if (result.photoWarning) setPhotoMessage(result.photoWarning);
      setCategory('');
      setDescription('');
      setPin(null);
      setPhoto(null);
      const file = document.getElementById('incident-photo');
      if (file) file.value = '';
    } catch (err) {
      setError(err.data?.fieldErrors?.location ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="split-layout">
      <section className="form-card">
        <p className="eyebrow">Student report</p>
        <h1>Report an incident</h1>
        <p className="muted">Your identity and the official time come from your signed-in session and the server. Click the map to place the incident pin.</p>
        <form className="stacked-form" onSubmit={submit}>
          <label>Incident type
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Choose a type</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>Short description
            <textarea rows="5" maxLength="1000" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe what happened." />
          </label>
          <label>Map location
            <input readOnly value={pin ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : ''} placeholder="Click the map to choose a point" />
          </label>
          <label>Optional photo (JPEG/PNG, max 5 MB)
            <input id="incident-photo" type="file" accept="image/jpeg,image/png" onChange={(e) => choosePhoto(e.target.files?.[0])} />
          </label>
          {photoMessage && <div className="alert warning">{photoMessage}</div>}
          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">Report accepted. Reference: <strong>{success.reference}</strong>. Status: New.</div>}
          <button className="button primary" disabled={!ready || busy}>{busy ? 'Submitting…' : 'Submit report'}</button>
        </form>
      </section>
      <section>
        <MapCanvas boundary={campus?.geometry} incidents={pin ? [{ id: 'draft', ...pin, category: category || 'Draft report', status: 'New' }] : []} onMapClick={choosePin} height={650} />
        <div className="notice-card"><strong>Prototype boundary</strong><span>Reports outside the defined working area are refused by both the client and the server.</span></div>
      </section>
    </div>
  );
}

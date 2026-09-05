import { useEffect, useRef } from 'react';
import L from 'leaflet';

const statusColour = {
  'New': '#c0392b',
  'Acknowledged': '#d68910',
  'In Progress': '#7d3c98',
  'Resolved': '#1e8449',
  'Invalid': '#566573',
  'Duplicate': '#566573',
};

export default function MapCanvas({
  boundary,
  incidents = [],
  hotspots = [],
  shortestRoute = [],
  saferRoute = [],
  networkNodes = [],
  onMapClick,
  onMarkerClick,
  selectedIncidentId,
  height = 520,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({ boundary: null, incidents: null, hotspots: null, routes: null, nodes: null });
  const clickRef = useRef(onMapClick);
  const markerClickRef = useRef(onMarkerClick);
  const fittedBoundaryRef = useRef(false);
  clickRef.current = onMapClick;
  markerClickRef.current = onMarkerClick;

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([-26.689, 27.093], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(map);
    map.on('click', (event) => clickRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng }));
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !boundary) return;
    layersRef.current.boundary?.remove();
    const layer = L.geoJSON({ type: 'Feature', geometry: boundary }, {
      style: { color: '#1f5f99', weight: 2, fillOpacity: 0.04 },
    }).addTo(map);
    layersRef.current.boundary = layer;
    if (!fittedBoundaryRef.current) {
      map.fitBounds(layer.getBounds(), { padding: [18, 18] });
      fittedBoundaryRef.current = true;
    }
  }, [boundary]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.incidents?.remove();
    const group = L.layerGroup().addTo(map);
    incidents.forEach((incident) => {
      const selected = String(incident.id) === String(selectedIncidentId);
      const marker = L.circleMarker([incident.lat, incident.lng], {
        radius: selected ? 11 : 7,
        color: selected ? '#0b172a' : statusColour[incident.status] ?? '#34495e',
        weight: selected ? 4 : 2,
        fillColor: statusColour[incident.status] ?? '#34495e',
        fillOpacity: 0.82,
      }).addTo(group);
      marker.bindTooltip(`${incident.category} • ${incident.status}`);
      marker.on('click', () => markerClickRef.current?.(incident));
    });
    layersRef.current.incidents = group;
  }, [incidents, selectedIncidentId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.hotspots?.remove();
    const group = L.layerGroup().addTo(map);
    hotspots.forEach((spot) => {
      L.circle([spot.lat, spot.lng], {
        radius: 30 + spot.intensity * 18,
        color: '#9b1c31',
        fillColor: '#d9485f',
        fillOpacity: Math.min(0.18 + spot.intensity * 0.08, 0.55),
        weight: 1,
      }).bindTooltip(`Hotspot intensity: ${spot.intensity}`).addTo(group);
    });
    layersRef.current.hotspots = group;
  }, [hotspots]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.routes?.remove();
    const group = L.layerGroup().addTo(map);
    if (shortestRoute.length > 1) {
      L.polyline(shortestRoute, { color: '#697586', weight: 5, opacity: 0.7, dashArray: '8 8' })
        .bindTooltip('Distance-only route').addTo(group);
    }
    if (saferRoute.length > 1) {
      L.polyline(saferRoute, { color: '#005ea8', weight: 7, opacity: 0.9 })
        .bindTooltip('Safer-route recommendation').addTo(group);
    }
    layersRef.current.routes = group;
  }, [shortestRoute, saferRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.nodes?.remove();
    const group = L.layerGroup().addTo(map);
    networkNodes.forEach((node) => {
      L.circleMarker([node.lat, node.lng], {
        radius: 4,
        color: '#16365f',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2,
      }).bindTooltip(node.name).addTo(group);
    });
    layersRef.current.nodes = group;
  }, [networkNodes]);

  return <div ref={containerRef} className="map-canvas" style={{ height }} aria-label="Interactive campus map" />;
}

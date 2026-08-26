import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ROADS = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12','A13','A14','A15','A17','A19','A20','A21','A23','A24','A25','A26','A27','A28','A29','A30','A31','A33','A36','A37','A38','A39','A40','A42','A43','A44','A45','A46','A48','A49','A52','A57','A59','A60','A61','A62','A63','A65','A66','A67','A70','A71','A72','A73','A81','A92','A93','A94','A95','A96','A99','A100'];

const COLORS = { red: '#E74C3C', yellow: '#F39C12', green: '#27AE60' };

function getRisk(rw) {
  if (rw.blocked) return 'red';
  return 'yellow';
}

export default function App() {
  const [roadworks, setRoadworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchAll = async () => {
      const all = [];
      for (const road of ROADS) {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/roadworks/${road}`);
          const data = await res.json();
          (data.roadworks || []).forEach(item => {
            all.push({
              id: item.identifier,
              title: item.title,
              road: item.road,
              lat: item.coordinate.lat,
              lon: item.coordinate.long,
              start: item.startTimestamp,
              blocked: item.isBlocked === 'true',
            });
          });
        } catch (e) {}
      }
      setRoadworks(all);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleClick = async (rw) => {
    setSelected(rw);
    setSummary('');
    setLoadingSummary(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: rw.title, road: rw.road, start: rw.start, blocked: rw.blocked })
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch (e) {
      setSummary('Could not load AI summary.');
    }
    setLoadingSummary(false);
  };

  const filtered = roadworks.filter(rw => {
    const matchSearch = search === '' || 
      rw.title.toLowerCase().includes(search.toLowerCase()) ||
      rw.road.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || 
      (filter === 'red' && rw.blocked) || 
      (filter === 'yellow' && !rw.blocked);
    return matchSearch && matchFilter;
  });

  const blocked = roadworks.filter(r => r.blocked).length;
  const disruptions = roadworks.filter(r => !r.blocked).length;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", background: '#0f172a' }}>
      
      {/* Sidebar */}
      <div style={{ width: 340, background: '#1e293b', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 20px 0', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🚧</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>BauWächter</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Germany Construction Radar</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, margin: '14px 0' }}>
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>{loading ? '...' : roadworks.length}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Total</div>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#E74C3C' }}>{loading ? '...' : blocked}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Closed</div>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#F39C12' }}>{loading ? '...' : disruptions}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Disruptions</div>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search road or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              background: '#0f172a', border: '1px solid #334155',
              color: '#fff', fontSize: 13, marginBottom: 10,
              outline: 'none', boxSizing: 'border-box'
            }}
          />

          {/* Filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {['all', 'red', 'yellow'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                flex: 1, padding: '6px 0', borderRadius: 6, border: 'none',
                background: filter === f ? (f === 'red' ? '#E74C3C' : f === 'yellow' ? '#F39C12' : '#3b82f6') : '#0f172a',
                color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: filter === f ? 700 : 400
              }}>
                {f === 'all' ? 'All' : f === 'red' ? 'Closed' : 'Disruption'}
              </button>
            ))}
          </div>
        </div>

        {/* AI Summary Panel */}
        {selected && (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #334155', background: '#0f172a' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AI Impact Analysis
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#f8fafc' }}>{selected.title}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
              {selected.road} · {selected.start ? selected.start.slice(0,10) : 'No date'}
              <span style={{ marginLeft: 8, color: selected.blocked ? '#E74C3C' : '#F39C12', fontWeight: 600 }}>
                {selected.blocked ? '● ROAD CLOSED' : '● DISRUPTION'}
              </span>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 8, padding: 12, fontSize: 12, lineHeight: 1.7, color: '#cbd5e1', border: '1px solid #334155' }}>
              {loadingSummary ? (
                <span style={{ color: '#64748b' }}>🤖 Analyzing roadwork impact...</span>
              ) : summary}
            </div>
          </div>
        )}

        {/* Road list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>
            {filtered.length} results
          </div>
          {filtered.slice(0, 50).map(rw => (
            <div
              key={rw.id}
              onClick={() => handleClick(rw)}
              style={{
                padding: '10px 12px', marginBottom: 6, borderRadius: 8, cursor: 'pointer',
                background: selected?.id === rw.id ? '#1e40af' : '#0f172a',
                borderLeft: `3px solid ${rw.blocked ? '#E74C3C' : '#F39C12'}`,
                transition: 'background 0.15s'
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc', marginBottom: 2 }}>{rw.title}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{rw.road} · {rw.start ? rw.start.slice(0,10) : 'No date'}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #334155', fontSize: 10, color: '#334155', textAlign: 'center' }}>
          Data: Autobahn GmbH des Bundes · Updated live
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[51.1657, 10.4515]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap © CARTO"
          />
          {filtered.map(rw => (
            <CircleMarker
              key={rw.id}
              center={[rw.lat, rw.lon]}
              radius={rw.blocked ? 10 : 7}
              fillColor={rw.blocked ? '#E74C3C' : '#F39C12'}
              color={rw.blocked ? '#FF6B6B' : '#FFD93D'}
              weight={1.5}
              fillOpacity={0.9}
              eventHandlers={{ click: () => handleClick(rw) }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
                  <strong>{rw.title}</strong><br />
                  <span style={{ color: '#666' }}>{rw.road}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { MODEL_DISTRICT, WATER_SENSORS } from '@/lib/data';
import RiskBadge, { riskColor } from '@/components/RiskBadge';
import { getMapsApiKey, loadGoogleMaps, saveMapsApiKey } from '@/lib/googleMaps';
import { SectionLabel, MeterRow, Divider, T } from '@/components/ui';

const LEVEL_COLOR: Record<string, string> = {
  CRITICAL: T.coral,
  HIGH: T.gold,
  MODERATE: T.teal,
  LOW: T.green,
};

const DISTRICT_PATH = [
  { lat: 0.585, lng: 33.945 },
  { lat: 0.585, lng: 34.165 },
  { lat: 0.500, lng: 34.175 },
  { lat: 0.360, lng: 34.155 },
  { lat: 0.245, lng: 34.055 },
  { lat: 0.235, lng: 33.955 },
  { lat: 0.320, lng: 33.925 },
  { lat: 0.450, lng: 33.930 },
];

const overlayPanel: React.CSSProperties = {
  position: 'absolute',
  zIndex: 10,
  background: 'white',
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  boxShadow: '0 2px 10px rgba(6,59,70,0.10)',
};

type MapType = 'roadmap' | 'hybrid' | 'satellite' | 'terrain';
const DEFAULT_MAP_TYPE: MapType = 'hybrid';

export default function MapScreen() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const { communityStates, selectedCommunityId, setSelectedCommunity } = useAppStore();

  const [filter, setFilter] = useState('ALL');
  const [mapType, setMapType] = useState<MapType>(DEFAULT_MAP_TYPE);
  // Read straight from storage during the first render. This component is
  // loaded with ssr:false, so window is available and no effect is needed.
  const [apiKey, setApiKey] = useState(getMapsApiKey);
  const [keyInput, setKeyInput] = useState(getMapsApiKey);
  const [status, setStatus] = useState<'need-key' | 'loading' | 'ready' | 'error'>(
    () => (getMapsApiKey() ? 'loading' : 'need-key'),
  );
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!apiKey || !mapRef.current || mapInstanceRef.current) return;
    let cancelled = false;
    setStatus('loading');
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current || !window.google?.maps) return;
        const map = new window.google.maps.Map(mapRef.current, {
          center: MODEL_DISTRICT.center,
          zoom: MODEL_DISTRICT.zoom,
          // Seed only; the sync effect below applies any later change, so this
          // must not become a dependency and rebuild the map.
          mapTypeId: DEFAULT_MAP_TYPE,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
        });
        new window.google.maps.Polygon({
          paths: DISTRICT_PATH,
          strokeColor: T.teal,
          strokeOpacity: 0.95,
          strokeWeight: 2,
          fillColor: T.teal,
          fillOpacity: 0.08,
          map,
        });
        mapInstanceRef.current = map;
        setStatus('ready');
      })
      .catch((err: Error) => {
        setStatus('error');
        setErrorMsg(err.message);
      });
    return () => { cancelled = true; };
  }, [apiKey]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;
    map.setMapTypeId(mapType);
  }, [mapType, status]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps || status !== 'ready') return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const visible = communityStates.filter(c => filter === 'ALL' || c.riskLevel === filter);
    visible.forEach(c => {
      const color = LEVEL_COLOR[c.riskLevel];
      const scale = c.riskLevel === 'CRITICAL' ? 12 : c.riskLevel === 'HIGH' ? 10 : 8;
      const marker = new window.google.maps.Marker({
        position: { lat: c.lat, lng: c.lng },
        map,
        title: `${c.name} · ${c.riskLevel} ${c.riskScore}`,
        zIndex: c.riskScore,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale,
          fillColor: color,
          fillOpacity: 0.95,
          strokeColor: '#ffffff',
          strokeWeight: 2.4,
        },
      });
      marker.addListener('click', () => setSelectedCommunity(c.id));
      markersRef.current.push(marker);
    });

    WATER_SENSORS.forEach(s => {
      const marker = new window.google.maps.Marker({
        position: { lat: s.lat, lng: s.lng },
        map,
        title: `${s.name} · ${s.status}`,
        zIndex: 1,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 4,
          fillColor: s.status === 'Alarm' ? T.coral : s.status === 'Warning' ? T.gold : T.green,
          fillOpacity: 1,
          strokeColor: T.deep,
          strokeWeight: 1,
          rotation: 180,
        },
      });
      markersRef.current.push(marker);
    });
  }, [communityStates, filter, status, setSelectedCommunity]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCommunityId) return;
    const c = communityStates.find(x => x.id === selectedCommunityId);
    if (!c) return;
    map.panTo({ lat: c.lat, lng: c.lng });
    map.setZoom(14);
  }, [selectedCommunityId, communityStates]);

  const selComm = selectedCommunityId ? communityStates.find(c => c.id === selectedCommunityId) : null;

  function activateKey() {
    const key = keyInput.trim();
    if (!key) return;
    saveMapsApiKey(key);
    mapInstanceRef.current = null;
    setApiKey(key);
    setStatus('loading');
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minWidth: 0 }}>
      <div style={{ flex: 1, position: 'relative', background: '#0b1f24', minWidth: 0 }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {(status === 'need-key' || status === 'error') && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,59,70,0.88)', zIndex: 20, padding: 24 }}>
            <div style={{ background: 'white', borderRadius: 10, padding: 28, maxWidth: 460, width: '100%' }}>
              <h3 style={{ fontFamily: T.heading, fontWeight: 800, fontSize: 16, margin: '0 0 8px' }}>
                Live Google Map — Busia District
              </h3>
              <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, margin: '0 0 14px' }}>
                Enter a Google Maps JavaScript API key to load the live satellite map of the model district.
                Enable <strong>Maps JavaScript API</strong> in Google Cloud, then restrict the key to{' '}
                <span style={{ fontFamily: T.mono }}>localhost:3000</span>.
              </p>
              {status === 'error' && (
                <div style={{ fontSize: 12, color: T.coral, marginBottom: 12, lineHeight: 1.5 }}>{errorMsg}</div>
              )}
              <input
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="AIza…"
                style={{ width: '100%', height: 40, padding: '0 12px', border: `1.5px solid ${T.border}`, borderRadius: 6, fontFamily: T.mono, fontSize: 12, marginBottom: 10 }}
              />
              <button
                onClick={activateKey}
                style={{ width: '100%', height: 40, background: T.teal, color: 'white', border: 'none', borderRadius: 6, fontFamily: T.heading, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Load Busia District Map
              </button>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 10, lineHeight: 1.5 }}>
                Or add <span style={{ fontFamily: T.mono }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</span> to{' '}
                <span style={{ fontFamily: T.mono }}>.env.local</span> and restart.
              </div>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 15, pointerEvents: 'none', fontFamily: T.heading, fontWeight: 700 }}>
            Loading live Google Map…
          </div>
        )}

        {/* Top-left: district card */}
        <div style={{ ...overlayPanel, top: 14, left: 14, padding: '10px 14px', minWidth: 210 }}>
          <div style={{ fontFamily: T.heading, fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: T.deep }}>
            Model District
          </div>
          <div style={{ fontFamily: T.heading, fontSize: 14, fontWeight: 800, marginTop: 4 }}>Busia, Uganda</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>Eastern Region · Lake Victoria shoreline</div>
          <div style={{ fontSize: 10, fontFamily: T.mono, color: T.teal, marginTop: 7 }}>
            {communityStates.length} communities · live tiles
          </div>
        </div>

        {/* Top-center: risk filter */}
        <div style={{ ...overlayPanel, top: 14, left: '50%', transform: 'translateX(-50%)', padding: 6, display: 'flex', gap: 4 }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                height: 26, padding: '0 11px', borderRadius: 4, border: 'none', cursor: 'pointer',
                background: filter === f ? T.deep : T.surface,
                color: filter === f ? 'white' : T.muted,
                fontFamily: T.heading, fontSize: 10, fontWeight: 700, letterSpacing: '0.6px',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Top-right: base map type */}
        <div style={{ ...overlayPanel, top: 14, right: 14, padding: 6, display: 'flex', gap: 4 }}>
          {(['hybrid', 'satellite', 'roadmap', 'terrain'] as const).map(t => (
            <button
              key={t}
              onClick={() => setMapType(t)}
              style={{
                height: 26, padding: '0 10px', borderRadius: 4, border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                background: mapType === t ? T.teal : 'transparent',
                color: mapType === t ? 'white' : T.muted,
                fontFamily: T.heading, fontSize: 10, fontWeight: 700,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Bottom-left: legend */}
        <div style={{ ...overlayPanel, bottom: 28, left: 14, padding: '12px 14px' }}>
          <SectionLabel style={{ fontSize: 9, letterSpacing: '1px', marginBottom: 8 }}>Risk Level</SectionLabel>
          {Object.entries(LEVEL_COLOR).map(([level, color]) => (
            <div key={level} style={{ display: 'grid', gridTemplateColumns: '10px auto', alignItems: 'center', columnGap: 8, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.ink }}>{level}</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '10px auto', alignItems: 'center', columnGap: 8, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.hair}` }}>
            <div style={{ justifySelf: 'center', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `8px solid ${T.teal}` }} />
            <span style={{ fontSize: 11, color: T.muted }}>Water sensor</span>
          </div>
        </div>
      </div>

      {/* Side panel */}
      <aside style={{ width: 330, background: 'white', borderLeft: `1px solid ${T.border}`, overflowY: 'auto', flexShrink: 0 }}>
        {selComm ? (
          <div style={{ padding: 20 }}>
            <button
              onClick={() => setSelectedCommunity(null)}
              style={{ fontSize: 11, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 14 }}
            >
              ← All Busia communities
            </button>

            <h2 style={{ fontFamily: T.heading, fontWeight: 800, fontSize: 18, margin: 0, lineHeight: 1.25 }}>{selComm.name}</h2>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Busia District · {selComm.region}</div>
            <div style={{ fontSize: 10, fontFamily: T.mono, color: T.muted, marginTop: 3 }}>
              {selComm.lat.toFixed(4)}° N, {selComm.lng.toFixed(4)}° E
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', alignItems: 'center', columnGap: 14, marginTop: 14 }}>
              <div style={{ fontFamily: T.mono, fontSize: 42, fontWeight: 500, color: riskColor(selComm.riskLevel), lineHeight: 1 }}>
                {selComm.riskScore}
              </div>
              <div style={{ minWidth: 0 }}>
                <RiskBadge level={selComm.riskLevel} size="md" />
                <div style={{ fontSize: 11, color: selComm.trend > 0 ? T.coral : T.green, marginTop: 5, fontWeight: 700, lineHeight: 1.4 }}>
                  {selComm.trend > 0 ? '↑' : '↓'} {Math.abs(Math.round(selComm.trend))} pts vs 7 days ago
                </div>
              </div>
            </div>

            <Divider />

            <SectionLabel>Why did the system flag this area?</SectionLabel>
            {[
              { label: 'Water Quality Risk', val: selComm.current.components.waterQualityRisk, weight: '25%' },
              { label: 'Flood / Rainfall Risk', val: selComm.current.components.floodRisk, weight: '20%' },
              { label: 'Symptom Signal', val: selComm.current.components.symptomSignal, weight: '20%' },
              { label: 'Sanitation Risk', val: selComm.current.components.sanitationRisk, weight: '15%' },
              { label: 'Historical Pattern', val: selComm.current.components.historicalRisk, weight: '10%' },
              { label: 'Population Vulnerability', val: selComm.current.components.populationVulnerability, weight: '10%' },
            ].map(f => (
              <MeterRow
                key={f.label}
                label={f.label}
                value={f.val}
                note={f.weight}
                color={riskColor(f.val >= 75 ? 'CRITICAL' : f.val >= 55 ? 'HIGH' : f.val >= 35 ? 'MODERATE' : 'LOW')}
              />
            ))}

            <Divider />

            <SectionLabel>Water Quality</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Turbidity', val: selComm.current.waterQuality.turbidity, unit: 'NTU', warn: 4, alarm: 10 },
                { label: 'pH', val: selComm.current.waterQuality.ph, unit: '', warn: 0, alarm: 0 },
                { label: 'E. coli', val: selComm.current.waterQuality.ecoli, unit: 'CFU', warn: 10, alarm: 100 },
                { label: 'Chlorine', val: selComm.current.waterQuality.chlorine, unit: 'mg/L', warn: 0.2, alarm: 0 },
              ].map(m => {
                const isAlarm = m.alarm > 0 ? m.val > m.alarm : (m.label === 'Chlorine' ? m.val < m.warn : false);
                const isWarn = !isAlarm && m.warn > 0 ? m.val > m.warn : false;
                const color = isAlarm ? T.coral : isWarn ? T.gold : T.green;
                return (
                  <div key={m.label} style={{
                    background: T.surface, borderRadius: 6, padding: '9px 11px',
                    border: `1px solid ${isAlarm ? 'rgba(235,93,93,0.2)' : '#e8f0f1'}`,
                  }}>
                    <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: 12 }}>
                      {m.label}
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 500, color, marginTop: 4, lineHeight: 1.1 }}>
                      {m.val}{m.unit && <span style={{ fontSize: 9, marginLeft: 2 }}>{m.unit}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <Divider />

            <SectionLabel>Reported Symptoms (CHW)</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Diarrhea', val: selComm.current.symptoms.diarrhea },
                { label: 'Vomiting', val: selComm.current.symptoms.vomiting },
                { label: 'Fever', val: selComm.current.symptoms.fever },
                { label: 'Suspected Cholera', val: selComm.current.symptoms.suspectedCholera },
              ].map(s => (
                <div key={s.label} style={{ background: T.surface, borderRadius: 6, padding: '9px 11px' }}>
                  <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: 24, lineHeight: 1.25 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 500, color: s.val > 5 ? T.coral : T.ink, lineHeight: 1.1 }}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: T.hair, borderRadius: 6, padding: '10px 12px', fontSize: 11, color: T.muted, lineHeight: 1.55, marginTop: 16 }}>
              <strong style={{ color: T.ink }}>Population:</strong> {selComm.population.toLocaleString()} ·{' '}
              <strong style={{ color: T.ink }}>Vulnerability:</strong> {selComm.vulnerability}/100
            </div>
          </div>
        ) : (
          <div style={{ padding: 20 }}>
            <h2 style={{ fontFamily: T.heading, fontSize: 13, fontWeight: 700, margin: 0 }}>Busia District Communities</h2>
            <p style={{ fontSize: 11, color: T.muted, margin: '4px 0 16px', lineHeight: 1.5 }}>
              Click a marker on the live map to open its risk profile.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...communityStates].sort((a, b) => b.riskScore - a.riskScore).map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCommunity(c.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '10px minmax(0,1fr) 34px',
                    alignItems: 'center', columnGap: 10,
                    padding: '9px 11px', borderRadius: 6, border: `1px solid ${T.hair}`,
                    cursor: 'pointer', background: '#fafcfc',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: LEVEL_COLOR[c.riskLevel] }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{c.region}</div>
                  </div>
                  <div style={{ fontFamily: T.mono, fontWeight: 500, fontSize: 16, color: riskColor(c.riskLevel), textAlign: 'right' }}>
                    {c.riskScore}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

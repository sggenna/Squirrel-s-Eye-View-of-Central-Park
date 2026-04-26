import { useEffect, useRef, useState } from 'react';
import { mkMap, buildZoneLayer, buildSqLayer } from '../mapUtils';
import { CENTER, BC, BL, SPLIT } from '../constants';

export default function Chapter5({ data }) {
  const { SQ, NSQ, SSQ } = data;
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const zoneLayerRef = useRef(null);
  const sqLayersRef = useRef({});
  const [activeBeh, setActiveBeh] = useState(new Set(Object.keys(BC)));
  const [expLayers, setExpLayers] = useState({ human: true, sq: true });
  const [counts, setCounts] = useState({ vis: '—', appr: '—', flees: '—' });
  const [hovered, setHovered] = useState(null);
  const revealRef = useRef(null);

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = mkMap(mapElRef.current, CENTER, 14, true);
    const zoneLayer = buildZoneLayer(data.ZONE_DATA, data.INTENSITY);
    zoneLayer.addTo(map);
    zoneLayerRef.current = zoneLayer;

    const sqLayers = {};
    Object.keys(BC).forEach(key => {
      sqLayers[key] = buildSqLayer(SQ, s => !!s[key], () => BC[key], 4, s => {
        setHovered(s ? { key, s } : null);
      });
      sqLayers[key].addTo(map);
    });
    sqLayersRef.current = sqLayers;
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; sqLayersRef.current = {}; zoneLayerRef.current = null; };
  }, [data]);

  useEffect(() => {
    updateCounts();
  }, [activeBeh, expLayers]);

  useEffect(() => {
    if (!revealRef.current) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
    }, { threshold: .1 });
    revealRef.current.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function updateCounts() {
    const vis = expLayers.sq ? SQ.filter(s => [...activeBeh].some(b => s[b])).length : 0;
    setCounts({
      vis: vis.toLocaleString(),
      appr: SSQ.filter(s => s.approaches).length.toLocaleString(),
      flees: NSQ.filter(s => s.runs_from).length.toLocaleString(),
    });
  }

  function toggleBeh(key) {
    const next = new Set(activeBeh);
    if (next.has(key)) {
      next.delete(key);
      if (sqLayersRef.current[key] && expLayers.sq) sqLayersRef.current[key].remove();
    } else {
      next.add(key);
      if (sqLayersRef.current[key] && expLayers.sq) sqLayersRef.current[key].addTo(mapRef.current);
    }
    setActiveBeh(next);
  }

  function toggleLayer(key) {
    const next = { ...expLayers, [key]: !expLayers[key] };
    setExpLayers(next);
    if (key === 'human') {
      next.human ? zoneLayerRef.current?.addTo(mapRef.current) : zoneLayerRef.current?.remove();
    }
    if (key === 'sq') {
      Object.keys(BC).forEach(b => {
        if (!sqLayersRef.current[b]) return;
        (next.sq && activeBeh.has(b))
          ? sqLayersRef.current[b].addTo(mapRef.current)
          : sqLayersRef.current[b].remove();
      });
    }
  }

  const furLabel = c => c === 'G' ? 'Gray' : c === 'C' ? 'Cinnamon' : c === 'B' ? 'Black' : '?';

  return (
    <>
      <div id="ch5" />
      <div className="chapter-mark reveal">
        <div className="ch-num">5</div>
        <div><div className="ch-label">Free Exploration</div><h2>Explore <em>for yourself</em></h2></div>
      </div>
      <div className="explore-section" ref={revealRef}>
        <div className="explore-head reveal">
          <h2>Every sighting, <em>on the map</em>.</h2>
          <p>All 3,023 sightings from the 2018 NYC Squirrel Census with human traffic zones as context. Filter by behavior, hover to inspect individual squirrels.</p>
        </div>
        <div className="explore-layout">
          <div className="epanel">
            <h5>Behavior Layers</h5>
            <div>
              {Object.entries(BL).map(([key, label]) => {
                const cnt = SQ.filter(s => s[key]).length;
                return (
                  <button
                    key={key}
                    className={'efpill' + (activeBeh.has(key) ? ' on' : '')}
                    onClick={() => toggleBeh(key)}
                  >
                    <div className="leg-dot" style={{ background: BC[key], width: 8, height: 8, flexShrink: 0 }} />
                    {label}
                    <span className="efpill-cnt">{cnt}</span>
                  </button>
                );
              })}
            </div>
            <h5>Map Layers</h5>
            <div className={'etog' + (expLayers.human ? ' on' : '')} onClick={() => toggleLayer('human')}>
              <div className="tsw" />{' '}Human traffic
            </div>
            <div className={'etog' + (expLayers.sq ? ' on' : '')} onClick={() => toggleLayer('sq')}>
              <div className="tsw" />{' '}Squirrel sightings
            </div>
            <h5>Data</h5>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--ink-m)', lineHeight: 1.7, marginTop: 2 }}>
              2018 NYC Squirrel Census<br />
              323 volunteer spotters<br />
              10 October survey days<br />
              842 acres mapped
            </div>
          </div>
          <div>
            <div id="explore-map" ref={mapElRef} />
          </div>
          <div className="epanel right">
            <h5>Live Count</h5>
            <div className="estat"><div className="ev">{counts.vis}</div><div className="ek">Sightings visible</div></div>
            <div className="estat"><div className="ev">{counts.appr}</div><div className="ek">S. Park approaches</div></div>
            <div className="estat"><div className="ev">{counts.flees}</div><div className="ek">N. Park flees</div></div>
            <h5>Hovered Squirrel</h5>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, lineHeight: 1.65, color: 'var(--ink-m)', minHeight: 70 }}>
              {hovered ? (
                <>
                  <div style={{ color: 'var(--ink)', fontWeight: 500, marginBottom: 4 }}>{BL[hovered.key]}</div>
                  Fur: {furLabel(hovered.s.color)}<br />
                  Zone: {hovered.s.lat > SPLIT ? 'North' : 'South'} Park<br />
                  Shift: {hovered.s.shift || '—'}
                </>
              ) : 'Hover a dot on the map.'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

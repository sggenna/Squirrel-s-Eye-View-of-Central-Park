import { useEffect, useRef, useState } from 'react';
import { mkMap, buildZoneLayer, buildDetailedSqLayer, buildHexbinLayer } from '../mapUtils';
import { CENTER, ZOOM, BC, BL, SPLIT } from '../constants';

export default function Chapter5({ data }) {
  const { SQ, NSQ, SSQ } = data;
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const zoneLayerRef = useRef(null);
  const sqLayersRef = useRef({});
  const heatLayersRef = useRef({});
  const [activeBeh, setActiveBeh] = useState(new Set(Object.keys(BC)));
  const [expLayers, setExpLayers] = useState({ 
    human: true, 
    sq: true, 
    heat: true,
    zoneTooltips: false,
    sqPopups: true,
    heatTooltips: true 
  });
  const [counts, setCounts] = useState({ vis: '—', appr: '—', flees: '—' });
  const [hovered, setHovered] = useState(null);
  const revealRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = mkMap(mapElRef.current, CENTER, ZOOM, true);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapRef.current = null; };
  }, [data]);

  // Handle Human Zone Layer
  useEffect(() => {
    if (!mapRef.current) return;
    if (zoneLayerRef.current) zoneLayerRef.current.remove();
    
    if (expLayers.human) {
      const layer = buildZoneLayer(data.ZONE_DATA, data.INTENSITY, expLayers.zoneTooltips);
      layer.addTo(mapRef.current);
      zoneLayerRef.current = layer;
    }
  }, [expLayers.human, expLayers.zoneTooltips, data]);

  // Handle Behavior Heatmap Layers
  useEffect(() => {
    if (!mapRef.current) return;
    Object.values(heatLayersRef.current).forEach(l => l.remove());
    heatLayersRef.current = {};

    if (expLayers.heat) {
      Object.keys(BC).forEach(key => {
        if (!activeBeh.has(key)) return;
        const label = (BL[key] || 'sightings').toLowerCase();
        const forcedMax = data.BEH_MAXES[key];
        const layer = buildHexbinLayer(SQ, s => !!s[key], BC[key], data.HECTARE_DATA, expLayers.heatTooltips, label, forcedMax);
        layer.addTo(mapRef.current);
        heatLayersRef.current[key] = layer;
      });
    }
  }, [expLayers.heat, expLayers.heatTooltips, activeBeh, data]);

  // Handle Individual Sighting Layers
  useEffect(() => {
    if (!mapRef.current) return;
    Object.values(sqLayersRef.current).forEach(l => l.remove());
    sqLayersRef.current = {};

    if (expLayers.sq) {
      Object.keys(BC).forEach(key => {
        if (!activeBeh.has(key)) return;
        const layer = buildDetailedSqLayer(SQ, s => !!s[key], () => BC[key], 3, expLayers.sqPopups);
        layer.addTo(mapRef.current);
        sqLayersRef.current[key] = layer;
      });
    }
  }, [expLayers.sq, expLayers.sqPopups, activeBeh, data]);

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
    const vis = SQ.filter(s => [...activeBeh].some(b => s[b])).length;
    setCounts({
      vis: vis.toLocaleString(),
      appr: SSQ.filter(s => s.approaches).length.toLocaleString(),
      flees: NSQ.filter(s => s.runs_from).length.toLocaleString(),
    });
  }

  function toggleBeh(key) {
    const next = new Set(activeBeh);
    next.has(key) ? next.delete(key) : next.add(key);
    setActiveBeh(next);
  }

  function toggleLayer(key) {
    setExpLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const furLabel = c => c === 'G' ? 'Gray' : c === 'C' ? 'Cinnamon' : c === 'B' ? 'Black' : '?';

  return (
    <>
      <div id="ch4" />
      <div className="chapter-mark reveal">
        <div className="ch-num">4</div>
        <div><div className="ch-label">Free Exploration</div><h2>Explore <em>for yourself</em></h2></div>
      </div>
      <div className="explore-section" ref={revealRef}>
        <div className="explore-head reveal">
          <h2>Every sighting, <em>on the map</em>.</h2>
          <p>Configure your own view of the park. Toggle high-level density patterns, individual squirrel data, and human context layers.</p>
        </div>
        <div className="explore-layout">
          <div className="epanel">
            <h5>Behavior Filters</h5>
            <div style={{ marginBottom: 20 }}>
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

            <h5>Primary Layers</h5>
            <div className={'etog' + (expLayers.heat ? ' on' : '')} onClick={() => toggleLayer('heat')}>
              <div className="tsw" /> Behavior density
            </div>
            <div className={'etog' + (expLayers.sq ? ' on' : '')} onClick={() => toggleLayer('sq')}>
              <div className="tsw" /> Individual sightings
            </div>
            <div className={'etog' + (expLayers.human ? ' on' : '')} onClick={() => toggleLayer('human')}>
              <div className="tsw" /> Human traffic zones
            </div>

            <h5 style={{ marginTop: 24 }}>Tooltip Controls</h5>
            <div className={'etog' + (expLayers.heatTooltips ? ' on' : '')} onClick={() => toggleLayer('heatTooltips')}>
              <div className="tsw" /> Density tooltips
            </div>
            <div className={'etog' + (expLayers.sqPopups ? ' on' : '')} onClick={() => toggleLayer('sqPopups')}>
              <div className="tsw" /> Sighting popups
            </div>
            <div className={'etog' + (expLayers.zoneTooltips ? ' on' : '')} onClick={() => toggleLayer('zoneTooltips')}>
              <div className="tsw" /> Zone details
            </div>
          </div>
          <div className="explore-map-wrap">
            <div id="explore-map" ref={mapElRef} />
          </div>
          <div className="epanel right">
            <h5>Live Count</h5>
            <div className="estat"><div className="ev">{counts.vis}</div><div className="ek">Active behavior count</div></div>
            <div className="estat"><div className="ev">{counts.appr}</div><div className="ek">S. Park approaches</div></div>
            <div className="estat"><div className="ev">{counts.flees}</div><div className="ek">N. Park flees</div></div>
            
            <h5 style={{ marginTop: 30 }}>Data Sources</h5>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--ink-m)', lineHeight: 1.7 }}>
              2018 NYC Squirrel Census<br />
              CPC 2009 Visitor Survey<br />
              842 acres mapped
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

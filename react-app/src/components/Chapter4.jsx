import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { mkMap, buildZoneLayer, buildDetailedSqLayer, buildHexbinLayer } from '../mapUtils';
import { NC, SC, CF, BEHS, BC, BL, NORTH_C, SOUTH_C, ZOOM, TOOLTIP_STYLE } from '../constants';
import { pct, colorFn } from '../utils';

export default function Chapter4({ data }) {
  const { NSQ, SSQ } = data;
  const northMapEl = useRef(null);
  const southMapEl = useRef(null);
  const northMapRef = useRef(null);
  const southMapRef = useRef(null);
  const barRef = useRef(null);
  const ratioRef = useRef(null);
  const chartsRef = useRef({});
  const [compareBeh, setCompareBeh] = useState('runs_from');
  const [northBadge, setNorthBadge] = useState('—');
  const [southBadge, setSouthBadge] = useState('—');
  const [northStats, setNorthStats] = useState([]);
  const [southStats, setSouthStats] = useState([]);
  const revealRef = useRef(null);

  useEffect(() => {
    if (northMapEl.current && !northMapRef.current) {
      northMapRef.current = mkMap(northMapEl.current, NORTH_C, ZOOM, false);
      buildZoneLayer(data.ZONE_DATA, data.INTENSITY, false).addTo(northMapRef.current);
    }
    if (southMapEl.current && !southMapRef.current) {
      southMapRef.current = mkMap(southMapEl.current, SOUTH_C, ZOOM, false);
      buildZoneLayer(data.ZONE_DATA, data.INTENSITY, false).addTo(southMapRef.current);
    }
    setTimeout(() => {
      northMapRef.current?.invalidateSize();
      southMapRef.current?.invalidateSize();
      buildCh4Charts();
    }, 300);
    return () => {
      northMapRef.current?.remove(); northMapRef.current = null;
      southMapRef.current?.remove(); southMapRef.current = null;
      chartsRef.current.bar?.destroy();
      chartsRef.current.ratio?.destroy();
    };
  }, [data]);

  useEffect(() => {
    updateCompareMaps(compareBeh);
  }, [compareBeh, data]);

  useEffect(() => {
    if (!revealRef.current) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
    }, { threshold: .1 });
    revealRef.current.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function updateCompareMaps(beh) {
    const ff = s => !!s[beh];
    const cf = () => BC[beh];
    const nm = northMapRef.current;
    const sm = southMapRef.current;
    if (!nm || !sm) return;

    // Remove existing behavior layers (hexbins)
    if (nm._behLayer) nm._behLayer.remove();
    if (sm._behLayer) sm._behLayer.remove();
    
    // Show hexbins for the selected behavior
    const label = (BL[beh] || 'sightings').toLowerCase();
    const forcedMax = data.BEH_MAXES[beh];
    nm._behLayer = buildHexbinLayer(NSQ, ff, BC[beh], data.HECTARE_DATA, true, label, forcedMax);
    sm._behLayer = buildHexbinLayer(SSQ, ff, BC[beh], data.HECTARE_DATA, true, label, forcedMax);
    
    nm._behLayer.addTo(nm);
    sm._behLayer.addTo(sm);

    setNorthBadge(NSQ.length.toLocaleString() + ' sightings');
    setSouthBadge(SSQ.length.toLocaleString() + ' sightings');

    const mkStats = arr => [['approaches', 'Approaches'], ['runs_from', 'Flees'], ['climbing', 'Climbing']]
      .map(([k, l]) => ({ k, l, v: pct(arr, k).toFixed(1) }));
    setNorthStats(mkStats(NSQ));
    setSouthStats(mkStats(SSQ));
  }

  function buildCh4Charts() {
    const NR = BEHS.map(b => pct(NSQ, b.key));
    const SR = BEHS.map(b => pct(SSQ, b.key));
    const shorts = BEHS.map(b => b.short);

    chartsRef.current.bar?.destroy();
    chartsRef.current.bar = new Chart(barRef.current, {
      type: 'bar',
      data: { labels: shorts, datasets: [
        { label: 'North', data: NR, backgroundColor: NC + 'cc', borderColor: NC, borderWidth: 1, borderRadius: 3 },
        { label: 'South', data: SR, backgroundColor: SC + 'cc', borderColor: SC, borderWidth: 1, borderRadius: 3 },
      ]},
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart', delay: ctx => ctx.dataIndex * 45 },
        plugins: { 
          legend: { display: false }, 
          tooltip: { 
            ...TOOLTIP_STYLE, 
            callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}% of local sightings` } 
          } 
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: CF, size: 10 } } },
          y: { grid: { color: 'rgba(43,29,14,.06)' }, ticks: { font: { family: CF, size: 10 }, callback: v => v + '%' }, title: { display: true, text: '% of sightings (normalized)', font: { size: 10, family: CF } } },
        },
      },
    });

    const ratios = BEHS.map((b, i) => { const n = NR[i], s = SR[i]; return n < 0.5 ? null : +(s / n).toFixed(2); });
    chartsRef.current.ratio?.destroy();
    chartsRef.current.ratio = new Chart(ratioRef.current, {
      type: 'bar',
      data: { labels: shorts, datasets: [{ data: ratios, backgroundColor: ratios.map(r => r === null ? '#ccc' : r > 1 ? SC + 'cc' : NC + 'cc'), borderColor: ratios.map(r => r === null ? '#ccc' : r > 1 ? SC : NC), borderWidth: 1, borderRadius: 3 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeOutElastic', delay: ctx => ctx.dataIndex * 55 },
        plugins: { legend: { display: false }, tooltip: { ...TOOLTIP_STYLE, callbacks: { label: ctx => { const v = ctx.parsed.y; if (!v) return ' n/a'; return v > 1 ? ` ${v.toFixed(1)}× more in south` : ` ${(1 / v).toFixed(1)}× more in north`; } } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: CF, size: 10 } } },
          y: { grid: { color: 'rgba(43,29,14,.06)' }, ticks: { font: { family: CF, size: 10 }, callback: v => v + '×' }, title: { display: true, text: 'Ratio (1 = equal)', font: { size: 10, family: CF } }, min: 0 },
        },
      },
    });
  }

  const filterOptions = Object.entries(BL).map(([k, v]) => [k, v, BC[k]]);

  return (
    <>
      <div id="ch4" />
      <div className="chapter-mark reveal">
        <div className="ch-num">4</div>
        <div><div className="ch-label">The Divide</div><h2>North vs. South — <em>two different parks</em></h2></div>
      </div>
      <div className="compare-section" ref={revealRef}>
        <div className="compare-inner">
          <div className="compare-hdr reveal">
            <div>
              <h5>The core finding</h5>
              <h3>Same species, same park — different behavior.</h3>
              <p>The south's high-traffic zones have produced a socialized, food-conditioned squirrel. The north's quiet zones have not. Filter the maps by behavior to see the divide.</p>
            </div>
            <div>
              <h5>Filter by behavior</h5>
              <div className="beh-filters">
                {filterOptions.map(([id, label, col]) => (
                  <button
                    key={id}
                    className={'fpill' + (compareBeh === id ? ' on' : '')}
                    onClick={() => setCompareBeh(id)}
                  >
                    <div className="fpill-dot" style={{ background: col }} />{label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="compare-maps">
            <div className="cmap">
              <div className="cmap-hdr">
                <span className="ctitle">🌲 North Park · above 72nd St</span>
                <span className="cbadge">{northBadge}</span>
              </div>
              <div className="cmap-body" ref={northMapEl} />
              <div className="cmap-stats">
                {northStats.map(({ k, l, v }) => (
                  <div className="cs" key={k}><div className="cs-val">{v}%</div><div className="cs-key">{l}</div></div>
                ))}
              </div>
            </div>
            <div className="cmap">
              <div className="cmap-hdr">
                <span className="ctitle">🏙 South Park · below 72nd St</span>
                <span className="cbadge">{southBadge}</span>
              </div>
              <div className="cmap-body" ref={southMapEl} />
              <div className="cmap-stats">
                {southStats.map(({ k, l, v }) => (
                  <div className="cs" key={k}><div className="cs-val">{v}%</div><div className="cs-key">{l}</div></div>
                ))}
              </div>
            </div>
          </div>
          <div className="compare-charts reveal">
            <div className="chart-card">
              <div className="cc-head">
                <div className="cc-eyebrow">Full breakdown</div>
                <div className="cc-title">All behaviors · North vs South</div>
                <div className="cc-legend">
                  <div className="cc-leg"><div className="cc-dot" style={{ background: '#5A6A2A' }} />North</div>
                  <div className="cc-leg"><div className="cc-dot" style={{ background: '#A8421A' }} />South</div>
                </div>
              </div>
              <div className="chart-canvas-wrap" style={{ height: 'clamp(200px,26vh,260px)' }}>
                <canvas ref={barRef} />
              </div>
            </div>
            <div className="chart-card">
              <div className="cc-head">
                <div className="cc-eyebrow">Relative likelihood</div>
                <div className="cc-title">South ÷ North ratio</div>
                <div className="cc-sub" style={{ fontSize: 11 }}>How many times more likely in south. &gt;1 = south-skewed.</div>
              </div>
              <div className="chart-canvas-wrap" style={{ height: 'clamp(200px,26vh,260px)' }}>
                <canvas ref={ratioRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

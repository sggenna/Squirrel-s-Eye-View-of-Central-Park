import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { mkMap, buildZoneLayer } from '../mapUtils';
import { CENTER, ZOOM, CF, TOOLTIP_STYLE } from '../constants';

const ACTIVITIES = [
  { key: 'walking',    label: 'Walking / Wandering', value: 63.8 },
  { key: 'relaxing',   label: 'Relaxing / Eating',   value: 36.3 },
  { key: 'nature',     label: 'Nature Study',         value: 15.0 },
  { key: 'exercise',   label: 'Exercise / Physical',  value: 13.9 },
  { key: 'dog',        label: 'Dog Walking',          value: 11.8 },
  { key: 'playground', label: 'Playground',           value: 8.5 },
];

// Chips include Eating as its own self-ID option; it maps to the Relaxing
// bar in the chart because the source survey groups them together.
const CHIPS = [
  { key: 'walking',    label: 'Walking / Wandering',   chartKey: 'walking' },
  { key: 'relaxing',   label: 'Relaxing / Socializing', chartKey: 'relaxing' },
  { key: 'eating',     label: 'Eating / Picnicking',   chartKey: 'relaxing' },
  { key: 'nature',     label: 'Nature Study',           chartKey: 'nature' },
  { key: 'exercise',   label: 'Exercise / Physical',    chartKey: 'exercise' },
  { key: 'dog',        label: 'Dog Walking',            chartKey: 'dog' },
  { key: 'playground', label: 'Playground',             chartKey: 'playground' },
];

const VIEWS = [
  { c: CENTER,            z: ZOOM },
  { c: [40.768, -73.974], z: ZOOM + 1 },
  { c: CENTER,            z: ZOOM },
  { c: [40.794, -73.961], z: ZOOM + 1 },
  { c: CENTER,            z: ZOOM },
  { c: CENTER,            z: ZOOM },
];
const TAGS = [
  'All park zones · human foot traffic intensity',
  'Southern zones · highest intensity',
  'The traffic gradient · south to north',
  'Northern quiet zones · low intensity',
  'Quick check · what do you do here?',
  'Activity mix · what 22M visitors do',
];

export default function Chapter1({ data }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const stepsRef = useRef(null);
  const activityChartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [tag, setTag] = useState(TAGS[0]);
  const [selectedChips, setSelectedChips] = useState(() => new Set());
  const hasAnswered = selectedChips.size > 0;

  const toggleChip = (key) => {
    setSelectedChips(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = mkMap(mapElRef.current, CENTER, ZOOM, false);
    buildZoneLayer(data.ZONE_DATA, data.INTENSITY, true).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); mapRef.current = null; };
  }, [data]);

  useEffect(() => {
    if (!hasAnswered || !activityChartRef.current) return;

    const selectedChartKeys = new Set();
    selectedChips.forEach(chipKey => {
      const chip = CHIPS.find(c => c.key === chipKey);
      if (chip) selectedChartKeys.add(chip.chartKey);
    });

    const bg = ACTIVITIES.map(a => selectedChartKeys.has(a.key) ? '#a8421acc' : '#7a4a1240');
    const bd = ACTIVITIES.map(a => selectedChartKeys.has(a.key) ? '#a8421a'   : '#7a4a1280');

    chartInstanceRef.current?.destroy();
    chartInstanceRef.current = new Chart(activityChartRef.current, {
      type: 'bar',
      data: {
        labels: ACTIVITIES.map(a => a.label),
        datasets: [{
          data: ACTIVITIES.map(a => a.value),
          backgroundColor: bg,
          borderColor: bd,
          borderWidth: 1,
          borderRadius: 3,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, delay: ctx => ctx.dataIndex * 50 },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...TOOLTIP_STYLE,
            callbacks: { label: ctx => ` ${ctx.parsed.x.toFixed(1)}% of visits` },
          },
        },
        scales: {
          x: { grid: { color: 'rgba(43,29,14,.06)' }, ticks: { font: { family: CF, size: 9 }, callback: v => v + '%' }, max: 70 },
          y: { grid: { display: false }, ticks: { font: { family: CF, size: 10 } } },
        },
      },
    });
    return () => { chartInstanceRef.current?.destroy(); chartInstanceRef.current = null; };
  }, [selectedChips, hasAnswered]);

  // Hard scroll-lock: while the gate step is fully in view and the user
  // hasn't answered, block any downward scroll (wheel / touch / keyboard).
  useEffect(() => {
    if (hasAnswered) return;
    const gateEl = stepsRef.current?.querySelector('[data-step="4"]');
    if (!gateEl) return;

    const shouldBlock = (deltaY) => {
      if (deltaY <= 0) return false;
      const r = gateEl.getBoundingClientRect();
      // Block once the gate has scrolled far enough that its bottom
      // is at (or above) the viewport bottom.
      return r.bottom <= window.innerHeight + 20;
    };

    const flash = () => {
      const hint = gateEl.querySelector('.gate-hint');
      if (!hint) return;
      hint.classList.remove('shake');
      void hint.offsetWidth;
      hint.classList.add('shake');
    };

    const onWheel = (e) => {
      if (shouldBlock(e.deltaY)) { e.preventDefault(); flash(); }
    };
    let touchY = 0;
    const onTouchStart = (e) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      const dy = touchY - e.touches[0].clientY;
      if (shouldBlock(dy)) { e.preventDefault(); flash(); }
    };
    const onKey = (e) => {
      const downKeys = ['ArrowDown', 'PageDown', 'End', 'Space', ' '];
      if (!downKeys.includes(e.key) && !downKeys.includes(e.code)) return;
      if (shouldBlock(1)) { e.preventDefault(); flash(); }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [hasAnswered]);

  useEffect(() => {
    if (!stepsRef.current || !mapRef.current) return;
    let curStep = -1;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        e.target.classList.toggle('active', e.isIntersecting);
        if (e.isIntersecting) {
          const step = +e.target.dataset.step;
          if (step === curStep) return;
          curStep = step;
          setTag(TAGS[step] ?? TAGS[0]);
          const v = VIEWS[step] ?? VIEWS[0];
          mapRef.current?.flyTo(v.c, v.z, { duration: 1.1, easeLinearity: .4 });
        }
      });
    }, { rootMargin: '-30% 0px -30% 0px' });
    stepsRef.current.querySelectorAll('.step').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [data, hasAnswered]);

  return (
    <div className="scrolly">
      <div className="scrolly-map">
        <div className="map-tag">{tag}</div>
        <div className="map-box" ref={mapElRef} />
        <div className="map-footer">
          <div className="map-legend">
            <div className="leg-row"><div className="leg-rect" style={{ background: '#8b0000', opacity: .9 }} />Extreme &gt;500k/acre</div>
            <div className="leg-row"><div className="leg-rect" style={{ background: '#e05c26', opacity: .85 }} />Very high</div>
            <div className="leg-row"><div className="leg-rect" style={{ background: '#e8a92a', opacity: .85 }} />High</div>
            <div className="leg-row"><div className="leg-rect" style={{ background: '#b8d46a', opacity: .85 }} />Medium</div>
            <div className="leg-row"><div className="leg-rect" style={{ background: '#78b87a', opacity: .85 }} />Low</div>
          </div>
          <div className="map-src">Central Park Conservancy · CPC Visitor Survey 2009</div>
        </div>
      </div>
      <div className="steps-col" ref={stepsRef}>
        <div className="step active" data-step="0">
          <div className="eyebrow">Chapter 1 · Human Geography</div>
          <h3>A park divided by <em>footfall</em>.</h3>
          <p>Central Park hosts 22 million visitors a year but they don't distribute evenly. The CPC Visitor Survey reveals stark intensity gradients driven by transit access, landmarks, and hotel proximity.</p>
          <p className="hint-txt">Hover over zones to see representative landmarks.</p>
          <div className="stat-row"><div className="stat-n">22M</div><div className="stat-l">Annual visitors to Central Park</div></div>
        </div>
        <div className="step" data-step="1">
          <div className="eyebrow">The Southern Gravity</div>
          <h3>You arrive from the <em>south</em>.</h3>
          <p>The Wollman Rink, the Zoo, and Bethesda Terrace receive over 500,000 visits per acre per year which is the highest density in the park. The landmarks in these southern zones dictate the flow of the millions who enter from the city grid.</p>
          <div className="stat-row"><div className="stat-n">58%</div><div className="stat-l">Of visits enter south of 86th Street</div></div>
        </div>
        <div className="step" data-step="2">
          <div className="eyebrow">The Gradient</div>
          <h3>Foot traffic <em>fades northward</em>.</h3>
          <p>Moving north of 86th Street, intensity drops. While zones containing Strawberry Fields or the Met Museum draw steady crowds, the density begins to thin as visitors move further from the primary southern hubs.</p>
          <blockquote className="pull">"The southern third of the park accounts for a majority of all visits, while northern zones remain relatively quiet." <cite>— CPC Visitor Survey, 2009</cite></blockquote>
        </div>
        <div className="step" data-step="3">
          <div className="eyebrow">The Quiet North</div>
          <h3>Above 86th... <em>a different world</em>.</h3>
          <p>With fewer high-density attractions to anchor them, the northern reaches like the North Woods and Great Hill remain tranquil sanctuaries. Here, the park feels less like a tourist destination and more like a local woodland.</p>
          <div className="stat-row"><div className="stat-n">4×</div><div className="stat-l">Fewer visitors per acre above 86th Street vs southern zones</div></div>
        </div>
        <div className="step" data-step="4">
          <div className="eyebrow">Before we go further…</div>
          <h3>What do <em>you</em> usually do here?</h3>
          <p>Pick everything that applies. We'll show you how your habits compare to the 22 million people who pass through each year.</p>
          <div className="act-chips" role="group" aria-label="Activities you do in Central Park">
            {CHIPS.map(c => (
              <button
                key={c.key}
                type="button"
                className={'act-chip' + (selectedChips.has(c.key) ? ' on' : '')}
                onClick={() => toggleChip(c.key)}
                aria-pressed={selectedChips.has(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className={'gate-hint' + (hasAnswered ? ' done' : '')}>
            {hasAnswered ? '↓ See how you compare' : 'Pick at least one to continue'}
          </div>
        </div>
        {hasAnswered && (
          <div className="step" data-step="5">
            <div className="eyebrow">The Activity Mix</div>
            <h3>Mostly <em>passive</em>. Mostly slow.</h3>
            <p>Most of those 22 million visitors aren't running through — they're wandering, sitting, eating, photographing. Slow, lingering contact with the park itself: the kind of human presence that habituates wildlife.</p>
            <div className="act-chart-wrap">
              <canvas ref={activityChartRef} />
            </div>
            <p className="hint-txt">Top 6 activities · CPC Visitor Survey 2009 · your picks in red</p>
            <div className="stat-row"><div className="stat-n">89.5%</div><div className="stat-l">of visits are passive recreation</div></div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { mkMap, buildZoneLayer } from '../mapUtils';
import { CENTER, ZOOM } from '../constants';

const VIEWS = [
  { c: CENTER,            z: ZOOM },
  { c: [40.768, -73.974], z: ZOOM + 1 },
  { c: CENTER,            z: ZOOM },
  { c: [40.794, -73.961], z: ZOOM + 1 },
];
const TAGS = [
  'All park zones · human foot traffic intensity',
  'Southern zones · highest intensity',
  'The traffic gradient · south to north',
  'Northern quiet zones · low intensity',
];

export default function Chapter1({ data }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const stepsRef = useRef(null);
  const [tag, setTag] = useState(TAGS[0]);

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = mkMap(mapElRef.current, CENTER, ZOOM, false);
    buildZoneLayer(data.ZONE_DATA, data.INTENSITY, true).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); mapRef.current = null; };
  }, [data]);

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
  }, [data]);

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
      </div>
    </div>
  );
}

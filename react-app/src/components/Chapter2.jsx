import { useEffect, useRef, useState } from 'react';
import { mkMap, buildZoneLayer, buildSqLayer } from '../mapUtils';
import { CENTER, BC } from '../constants';
import { colorFn } from '../utils';

const TAGS = [
  'All 3,023 sightings · colored by behavior',
  'Approach sightings highlighted · south concentration',
  'Flee sightings highlighted · north concentration',
  'All behaviors · full behavioral spectrum',
];

export default function Chapter2({ data }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({});
  const stepsRef = useRef(null);
  const [tag, setTag] = useState(TAGS[0]);

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = mkMap(mapElRef.current, CENTER, 13, false);
    buildZoneLayer(data.ZONE_DATA, data.INTENSITY).addTo(map);
    const layers = {
      all: buildSqLayer(data.SQ, () => true, colorFn, 4),
      appr: buildSqLayer(data.SQ, s => s.approaches, () => BC.approaches, 7),
      flees: buildSqLayer(data.SQ, s => s.runs_from, () => BC.runs_from, 7),
    };
    layers.all.addTo(map);
    layersRef.current = layers;
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); mapRef.current = null; layersRef.current = {}; };
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
          const map = mapRef.current;
          const { all, appr, flees } = layersRef.current;
          Object.values(layersRef.current).forEach(l => l.remove());
          if (step === 0 || step === 3) { all?.addTo(map); map?.flyTo(CENTER, 13, { duration: 1 }); }
          else if (step === 1) { all?.addTo(map); appr?.addTo(map); map?.flyTo([40.772, -73.972], 14, { duration: 1.1 }); }
          else { all?.addTo(map); flees?.addTo(map); map?.flyTo([40.793, -73.963], 14, { duration: 1.1 }); }
        }
      });
    }, { rootMargin: '-30% 0px -30% 0px' });
    stepsRef.current.querySelectorAll('.step').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [data]);

  return (
    <div className="scrolly flip">
      <div className="scrolly-map">
        <div className="map-tag">{tag}</div>
        <div className="map-box" ref={mapElRef} />
        <div className="map-footer">
          <div className="map-legend">
            <div className="leg-row"><div className="leg-dot" style={{ background: '#c94c3a' }} />Flees</div>
            <div className="leg-row"><div className="leg-dot" style={{ background: '#2d7a4f' }} />Approaches</div>
            <div className="leg-row"><div className="leg-dot" style={{ background: '#2b5fa0' }} />Indifferent</div>
            <div className="leg-row"><div className="leg-dot" style={{ background: '#b86a12' }} />Foraging</div>
            <div className="leg-row">
              <div style={{ width: 16, height: 6, borderRadius: 2, background: 'linear-gradient(to right,#78b87a,#e8a92a,#8b0000)', flexShrink: 0 }} />
              Human traffic
            </div>
          </div>
          <div className="map-src">2018 NYC Squirrel Census · CPC 2009</div>
        </div>
      </div>
      <div className="steps-col" ref={stepsRef}>
        <div className="step active" data-step="0">
          <div className="eyebrow">Chapter 2 · Squirrel Geography</div>
          <h3>3,023 squirrels, <em>one October</em>.</h3>
          <p>Volunteer spotters covered every hectare of the park over 10 days. Unlike humans, squirrel sightings distribute relatively evenly — but their behavior varies sharply across the same gradient.</p>
          <div className="stat-row"><div className="stat-n">3,023</div><div className="stat-l">Sightings across 10 October survey days</div></div>
        </div>
        <div className="step" data-step="1">
          <div className="eyebrow">The Approach Zone</div>
          <h3>Southern squirrels <em>approach humans</em>.</h3>
          <p>In the high-traffic southern zones, squirrels have been desensitized — and often actively trained by handfeeding. The approach rate in the south is 4× higher than in the quiet north.</p>
          <div className="stat-row"><div className="stat-n">4×</div><div className="stat-l">More likely to approach in high-traffic southern zones</div></div>
        </div>
        <div className="step" data-step="2">
          <div className="eyebrow">The Flight Zone</div>
          <h3>Northern squirrels <em>flee the scene</em>.</h3>
          <p>In low-traffic northern zones — North Woods, Harlem Meer — squirrels treat humans as genuine threats. The flee rate in the north is significantly higher than the park-wide average.</p>
          <blockquote className="pull">"The squirrel is the same animal. But the behavioral profile is shaped entirely by how many humans it has encountered." <cite>— NYC Squirrel Census field notes</cite></blockquote>
        </div>
        <div className="step" data-step="3">
          <div className="eyebrow">The Full Picture</div>
          <h3>All behaviors, <em>all at once</em>.</h3>
          <p>With all behavioral categories shown simultaneously, the spatial patterning becomes clear. The human intensity gradient is a near-perfect predictor of squirrel behavioral response.</p>
          <div className="stat-row"><div className="stat-n">48%</div><div className="stat-l">Of squirrels simply indifferent to human presence</div></div>
        </div>
      </div>
    </div>
  );
}

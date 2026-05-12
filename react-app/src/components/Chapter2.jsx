import { useEffect, useRef, useState } from 'react';
import { mkMap, buildZoneLayer, buildDetailedSqLayer, buildHexbinLayer } from '../mapUtils';
import { CENTER, ZOOM, BC } from '../constants';
import { colorFn } from '../utils';

const TAGS = [
  '3,023 Individual Sightings · Full Census Data',
  'Quick check · how do you interact with squirrels?',
  'Behavior Density · Flees humans',
  'Behavior Density · Indifferent to humans',
  'Behavior Density · Approaches humans',
  'Behavior Density · Eating behavior',
  'Behavior Density · Alarm calls (Kuks)',
];

// Each chip maps to one or more squirrel responses it tends to provoke.
const CHIPS = [
  { key: 'feed',     label: 'Feed snacks',         behaviors: ['approaches', 'eating'] },
  { key: 'photo',    label: 'Photograph',          behaviors: ['indifferent'] },
  { key: 'approach', label: 'Approach closer',     behaviors: ['runs_from'] },
  { key: 'watch',    label: 'Watch from distance', behaviors: ['indifferent'] },
  { key: 'avoid',    label: 'Avoid / scare off',   behaviors: ['runs_from', 'kuks'] },
  { key: 'ignore',   label: 'Ignore / walk past',  behaviors: ['indifferent'] },
];

const BEHAVIOR_CALLOUT = {
  runs_from:   'Your actions tend to trigger this',
  indifferent: 'Your style matches this calm response',
  approaches:  'Your habits reinforce this behavior',
  eating:      'Your habits feed this pattern',
  kuks:        'Your actions can provoke this alarm',
};

function provokes(selected, behaviorKey) {
  for (const k of selected) {
    const chip = CHIPS.find(c => c.key === k);
    if (chip && chip.behaviors.includes(behaviorKey)) return true;
  }
  return false;
}

export default function Chapter2({ data }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({});
  const stepsRef = useRef(null);
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

  // Hard scroll-lock: while the gate (data-step="1") is fully in view and the
  // user hasn't answered, block any downward scroll input.
  useEffect(() => {
    if (hasAnswered) return;
    const gateEl = stepsRef.current?.querySelector('[data-step="1"]');
    if (!gateEl) return;

    const shouldBlock = (deltaY) => {
      if (deltaY <= 0) return false;
      const r = gateEl.getBoundingClientRect();
      return r.bottom <= window.innerHeight + 20;
    };

    const flash = () => {
      const hint = gateEl.querySelector('.gate-hint');
      if (!hint) return;
      hint.classList.remove('shake');
      void hint.offsetWidth;
      hint.classList.add('shake');
    };

    const onWheel = (e) => { if (shouldBlock(e.deltaY)) { e.preventDefault(); flash(); } };
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
    if (!mapElRef.current || mapRef.current) return;
    const map = mkMap(mapElRef.current, CENTER, ZOOM, false);

    const layers = {
      all: buildDetailedSqLayer(data.SQ, () => true, colorFn, 3),
      
      // Only Hexbin layers for behavioral steps with per-behavior scaling
      flees: buildHexbinLayer(data.SQ, s => s.runs_from, BC.runs_from, data.HECTARE_DATA, true, 'fleeing squirrels', data.BEH_MAXES.runs_from),
      indifferent: buildHexbinLayer(data.SQ, s => s.indifferent, BC.indifferent, data.HECTARE_DATA, true, 'indifferent squirrels', data.BEH_MAXES.indifferent),
      approaches: buildHexbinLayer(data.SQ, s => s.approaches, BC.approaches, data.HECTARE_DATA, true, 'approaching squirrels', data.BEH_MAXES.approaches),
      eating: buildHexbinLayer(data.SQ, s => s.eating, BC.eating, data.HECTARE_DATA, true, 'eating squirrels', data.BEH_MAXES.eating),
      kuks: buildHexbinLayer(data.SQ, s => s.kuks, BC.kuks, data.HECTARE_DATA, true, 'vocalizing squirrels', data.BEH_MAXES.kuks),
    };
    
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
          const LRS = layersRef.current;
          
          Object.values(LRS).forEach(l => l.remove());

          if (step === 0 || step === 1) LRS.all?.addTo(map);
          else if (step === 2) LRS.flees?.addTo(map);
          else if (step === 3) LRS.indifferent?.addTo(map);
          else if (step === 4) LRS.approaches?.addTo(map);
          else if (step === 5) LRS.eating?.addTo(map);
          else if (step === 6) LRS.kuks?.addTo(map);

          map?.flyTo(CENTER, ZOOM, { duration: 1 });
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
            <div className="leg-row"><div className="leg-dot" style={{ background: '#555555' }} />Individual sighting</div>
            <div style={{ margin: '8px 0', borderTop: '1px solid var(--line)', opacity: 0.5 }}></div>
            <div className="leg-row"><div className="leg-dot" style={{ background: BC.runs_from }} />Flee density</div>
            <div className="leg-row"><div className="leg-dot" style={{ background: BC.approaches }} />Approach density</div>
            <div className="leg-row"><div className="leg-dot" style={{ background: BC.indifferent }} />Indifferent density</div>
            <div className="leg-row"><div className="leg-dot" style={{ background: BC.eating }} />Eating density</div>
            <div className="leg-row"><div className="leg-dot" style={{ background: BC.kuks }} />Alarm call density</div>
          </div>
          <div className="map-src">2018 NYC Squirrel Census · Hexbins by Hectare</div>
        </div>
      </div>
      <div className="steps-col" ref={stepsRef}>
        <div className="step active" data-step="0">
          <div className="eyebrow">Chapter 2 · Squirrel Geography</div>
          <h3>The individual <em>sightings</em>.</h3>
          <p>Every point on this map represents a single squirrel encounter. Unlike humans, squirrels are much more evenly distributed across the park. Click on any point to see the specific data associated with that sighting, including fur color and observed behaviors.</p>
          <div className="stat-row"><div className="stat-n">3,023</div><div className="stat-l">Total unique sightings mapped</div></div>
        </div>

        <div className="step" data-step="1">
          <div className="eyebrow">Before we go further…</div>
          <h3>When you see a squirrel, <em>what do you do</em>?</h3>
          <p>Pick everything that applies. As you scroll, we'll mark the squirrel responses your habits tend to provoke.</p>
          <div className="act-chips" role="group" aria-label="What you do when you see a squirrel">
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
            {hasAnswered ? '↓ Watch for your mark on the maps below' : 'Pick at least one to continue'}
          </div>
        </div>

        <div className="step" data-step="2">
          <div className="eyebrow">The Flight Zone</div>
          <h3>Where they <em>flee</em>.</h3>
          {hasAnswered && provokes(selectedChips, 'runs_from') && (
            <div className="step-callout">↶ {BEHAVIOR_CALLOUT.runs_from}</div>
          )}
          <p>Flight behavior is an indicator of wildness. The map show hectares with the highest concentration of squirrels that ran away from humans. Notice how this behavior is most common in the most natural and less human dense areas of the park, indicating that the squirrels here are less habituated to humans.</p>
          <div className="stat-row"><div className="stat-n">639</div><div className="stat-l">Squirrels observed fleeing humans</div></div>
        </div>

        <div className="step" data-step="3">
          <div className="eyebrow">The Middle Ground</div>
          <h3>True <em>indifference</em>.</h3>
          {hasAnswered && provokes(selectedChips, 'indifferent') && (
            <div className="step-callout">↶ {BEHAVIOR_CALLOUT.indifferent}</div>
          )}
          <p>Indifference is the most common behavior observed, and is especially common is the areas where humans are present but not intrusive.</p>
          <div className="stat-row"><div className="stat-n">1,454</div><div className="stat-l">Squirrels indifferent to human presence</div></div>
        </div>

        <div className="step" data-step="4">
          <div className="eyebrow">The Urbanized Profile</div>
          <h3>The <em>approachers</em>.</h3>
          {hasAnswered && provokes(selectedChips, 'approaches') && (
            <div className="step-callout">↶ {BEHAVIOR_CALLOUT.approaches}</div>
          )}
          <p>Active approach is the rarest behavior and is heavily concentrated in the high-traffic areas of the park. These squirrels have learned to associate humans with food rewards, and thus approach them more often.</p>
          <div className="stat-row"><div className="stat-n">178</div><div className="stat-l">Squirrels actively approaching humans</div></div>
        </div>

        <div className="step" data-step="5">
          <div className="eyebrow">Resource Usage</div>
          <h3>Eating <em>habits</em>.</h3>
          {hasAnswered && provokes(selectedChips, 'eating') && (
            <div className="step-callout">↶ {BEHAVIOR_CALLOUT.eating}</div>
          )}
          <p>Beyond human interaction, where do squirrels actually consume their food? Squirrels tend to eat most commonly in the human dense areas of the park, again showing that many squirrel rely on humans for their food.</p>
          <div className="stat-row"><div className="stat-n">772</div><div className="stat-l">Squirrels seen eating during the census</div></div>
        </div>

        <div className="step" data-step="6">
          <div className="eyebrow">The Alarm</div>
          <h3>Kuks and <em>vocalizations</em>.</h3>
          {hasAnswered && provokes(selectedChips, 'kuks') && (
            <div className="step-callout">↶ {BEHAVIOR_CALLOUT.kuks}</div>
          )}
          <p>The "Kuk" is a sharp alarm call. High concentrations of alarm calls often point to areas with more predators or perceived threats in the environment. This alarms are more commonly heard in the more natural areas of the parks, where the squirrels act closer to how they would in the wild. </p>
          <div className="stat-row"><div className="stat-n">102</div><div className="stat-l">Instances of kuk vocalizations recorded</div></div>
        </div>
      </div>
    </div>
  );
}

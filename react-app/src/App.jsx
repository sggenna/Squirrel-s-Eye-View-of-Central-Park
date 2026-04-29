import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Chart from 'chart.js/auto';
import { RAW_BASE, CHAPTERS, SPLIT } from './constants';
import Loader from './components/Loader';
import ProgressBar from './components/ProgressBar';
import TopBar from './components/TopBar';
import ChapterBanner from './components/ChapterBanner';
import HeroSection from './components/HeroSection';
import Chapter1 from './components/Chapter1';
import Chapter2 from './components/Chapter2';
import Chapter3 from './components/Chapter3';
import Chapter5 from './components/Chapter5';
import Footer from './components/Footer';

Chart.defaults.font.family = "'IBM Plex Sans',sans-serif";
Chart.defaults.color = '#7A6040';

export default function App() {
  const [progress, setProgress] = useState(0);
  const [loadMsg, setLoadMsg] = useState('Loading data…');
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState(null);
  const [chapter, setChapter] = useState(CHAPTERS[0]);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        setProgress(5); setLoadMsg('Loading map data…');
        const [zR, , intR, sqR, hR] = await Promise.all([
          fetch(RAW_BASE + 'zoneboundries.geojson'),
          fetch(RAW_BASE + 'volume_of_use_by_area.csv'),
          fetch(RAW_BASE + 'intensity_of_use_by_area.csv'),
          fetch(RAW_BASE + 'Squirrel_Data.csv'),
          fetch(RAW_BASE + 'hectares.geojson'),
        ]);
        const ZONE_DATA = await zR.json();
        const HECTARE_DATA = await hR.json();
        
        // Point in polygon for grid_id
        const isInside = (point, vs) => {
          const x = point[0], y = point[1];
          let inside = false;
          for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i][0], yi = vs[i][1];
            const xj = vs[j][0], yj = vs[j][1];
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
          }
          return inside;
        };

        setProgress(30); setLoadMsg('Parsing visitor data…');
        const INTENSITY = Papa.parse(await intR.text(), { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
        setProgress(55); setLoadMsg('Parsing squirrel census…');
        const b = v => v === true || v === 'true' || v === 'TRUE';
        const SQ = Papa.parse(await sqR.text(), { header: true, dynamicTyping: true, skipEmptyLines: true }).data
          .filter(r => r.X && r.Y)
          .map(r => {
            let grid_id = null;
            for (const feat of HECTARE_DATA.features) {
              if (isInside([r.X, r.Y], feat.properties.poly[0])) {
                grid_id = feat.properties.grid_id;
                break;
              }
            }
            return {
              lat: r.Y, lng: r.X,
              grid_id,
              hectare: r.Hectare,
              color: (r['Primary Fur Color'] || 'U')[0],
              age: r.Age,
              shift: r.Shift,
              runs_from: b(r['Runs from']),
              approaches: b(r.Approaches),
              indifferent: b(r.Indifferent),
              foraging: b(r.Foraging),
              eating: b(r.Eating),
              climbing: b(r.Climbing),
              running: b(r.Running),
              kuks: b(r.Kuks),
            };
          });
        const NSQ = SQ.filter(s => s.lat > SPLIT);
        const SSQ = SQ.filter(s => s.lat <= SPLIT);

        // Calculate per-behavior max sightings per hectare for consistent scaling
        const BEH_MAXES = {};
        const behKeys = ['runs_from', 'approaches', 'indifferent', 'foraging', 'eating', 'climbing', 'running', 'kuks'];
        
        behKeys.forEach(key => {
          const counts = {};
          SQ.forEach(s => {
            if (s[key] && s.grid_id) counts[s.grid_id] = (counts[s.grid_id] || 0) + 1;
          });
          BEH_MAXES[key] = Math.max(...Object.values(counts), 1);
        });

        // Also keep a global max for "all sightings"
        const allCounts = {};
        SQ.forEach(s => { if (s.grid_id) allCounts[s.grid_id] = (allCounts[s.grid_id] || 0) + 1; });
        const MAX_HECTARE_COUNT = Math.max(...Object.values(allCounts), 1);

        setProgress(80); setLoadMsg('Drawing maps…');
        setData({ SQ, NSQ, SSQ, INTENSITY, ZONE_DATA, HECTARE_DATA, MAX_HECTARE_COUNT, BEH_MAXES });
        setProgress(100);
        setTimeout(() => setLoaded(true), 350);
      } catch (e) {
        setLoadMsg('Error: ' + e.message);
        console.error(e);
      }
    }
    loadAll();
  }, []);

  useEffect(() => {
    if (!data) return;

    let ticking = false;
    function updateChapter() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const threshold = window.innerHeight * 0.15;
        let active = CHAPTERS[0];
        for (const c of CHAPTERS) {
          const el = document.getElementById(c.id);
          if (!el) continue;
          if (el.getBoundingClientRect().top <= threshold) active = c;
          else break;
        }
        setChapter(active);
        ticking = false;
      });
    }
    window.addEventListener('scroll', updateChapter, { passive: true });
    updateChapter();

    const heroObs = new IntersectionObserver(entries => {
      entries.forEach(e => setBannerVisible(!e.isIntersecting));
    }, { threshold: 0.2 });
    const hero = document.getElementById('hero');
    if (hero) heroObs.observe(hero);

    const revObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
    }, { threshold: .1 });
    document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

    return () => {
      window.removeEventListener('scroll', updateChapter);
      heroObs.disconnect();
      revObs.disconnect();
    };
  }, [data]);

  return (
    <>
      <Loader progress={progress} msg={loadMsg} done={loaded} />
      <ProgressBar />
      {data && (
        <>
          <TopBar />
          <ChapterBanner num={chapter.num} title={chapter.title} visible={bannerVisible} />
          <HeroSection />
          <div id="ch1" />
          <Chapter1 data={data} />
          <div id="ch2" />
          <Chapter2 data={data} />
          <Chapter3 data={data} />
          <Chapter5 data={data} />
          <Footer />
        </>
      )}
    </>
  );
}

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
import Chapter4 from './components/Chapter4';
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
        setProgress(5); setLoadMsg('Loading zone boundaries…');
        const [zR, , intR, sqR] = await Promise.all([
          fetch(RAW_BASE + 'zoneboundries.geojson'),
          fetch(RAW_BASE + 'volume_of_use_by_area.csv'),
          fetch(RAW_BASE + 'intensity_of_use_by_area.csv'),
          fetch(RAW_BASE + 'Squirrel_Data.csv'),
        ]);
        const ZONE_DATA = await zR.json();
        setProgress(30); setLoadMsg('Parsing visitor data…');
        const INTENSITY = Papa.parse(await intR.text(), { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
        setProgress(55); setLoadMsg('Parsing squirrel census…');
        const b = v => v === true || v === 'true' || v === 'TRUE';
        const SQ = Papa.parse(await sqR.text(), { header: true, dynamicTyping: true, skipEmptyLines: true }).data
          .filter(r => r.X && r.Y)
          .map(r => ({
            lat: r.Y, lng: r.X,
            color: (r['Primary Fur Color'] || 'U')[0],
            shift: r.Shift,
            runs_from: b(r['Runs from']),
            approaches: b(r.Approaches),
            indifferent: b(r.Indifferent),
            foraging: b(r.Foraging),
            eating: b(r.Eating),
            climbing: b(r.Climbing),
            running: b(r.Running),
            kuks: b(r.Kuks),
          }));
        const NSQ = SQ.filter(s => s.lat > SPLIT);
        const SSQ = SQ.filter(s => s.lat <= SPLIT);
        setProgress(80); setLoadMsg('Drawing maps…');
        setData({ SQ, NSQ, SSQ, INTENSITY, ZONE_DATA });
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

    const chObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const ch = CHAPTERS.find(c => c.id === e.target.id);
          if (ch) setChapter(ch);
        }
      });
    }, { rootMargin: '-5% 0px -85% 0px' });
    CHAPTERS.forEach(c => {
      const el = document.getElementById(c.id);
      if (el) chObs.observe(el);
    });

    const heroObs = new IntersectionObserver(entries => {
      entries.forEach(e => setBannerVisible(!e.isIntersecting));
    }, { threshold: 0.2 });
    const hero = document.getElementById('hero');
    if (hero) heroObs.observe(hero);

    const revObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
    }, { threshold: .1 });
    document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

    return () => { chObs.disconnect(); heroObs.disconnect(); revObs.disconnect(); };
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
          <Chapter4 data={data} />
          <Chapter5 data={data} />
          <Footer />
        </>
      )}
    </>
  );
}

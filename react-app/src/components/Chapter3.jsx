import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { NC, SC, CF, BEHS, TOOLTIP_STYLE, BL, BC } from '../constants';
import { pct } from '../utils';

export default function Chapter3({ data }) {
  const { NSQ, SSQ, SQ } = data;
  const barRef = useRef(null);
  const divergeRef = useRef(null);
  const ratioRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const NR = BEHS.map(b => pct(NSQ, b.key));
    const SR = BEHS.map(b => pct(SSQ, b.key));
    const labs = BEHS.map(b => b.label);

    const bar = new Chart(barRef.current, {
      type: 'bar',
      data: { labels: labs, datasets: [
        { label: 'North Park', data: NR, backgroundColor: NC + 'cc', borderColor: NC, borderWidth: 1, borderRadius: 3 },
        { label: 'South Park', data: SR, backgroundColor: SC + 'cc', borderColor: SC, borderWidth: 1, borderRadius: 3 },
      ]},
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart', delay: ctx => ctx.dataIndex * 55 },
        plugins: { 
          legend: { display: false }, 
          tooltip: { 
            ...TOOLTIP_STYLE, 
            callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.x.toFixed(1)}% of local sightings` } 
          } 
        },
        scales: {
          x: { grid: { color: 'rgba(43,29,14,.06)' }, ticks: { font: { family: CF, size: 10 }, callback: v => v + '%' }, title: { display: true, text: '% of sightings (normalized)', font: { size: 10, family: CF } } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });

    const diffs = BEHS.map((b, i) => +(SR[i] - NR[i]).toFixed(1));
    const diverge = new Chart(divergeRef.current, {
      type: 'bar',
      data: { labels: labs, datasets: [{ data: diffs, backgroundColor: diffs.map(d => d > 0 ? SC + 'dd' : NC + 'dd'), borderColor: diffs.map(d => d > 0 ? SC : NC), borderWidth: 1, borderRadius: 3 }] },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeOutElastic', delay: ctx => ctx.dataIndex * 75 },
        plugins: { legend: { display: false }, tooltip: { ...TOOLTIP_STYLE, callbacks: { label: ctx => { const v = ctx.parsed.x; return ` ${v > 0 ? '+' : ''}${v.toFixed(1)} pp (${v > 0 ? 'more in south' : 'more in north'})`; } } } },
        scales: {
          x: { grid: { color: 'rgba(43,29,14,.06)' }, ticks: { font: { family: CF, size: 10 }, callback: v => (v > 0 ? '+' : '') + v + ' pp' }, title: { display: true, text: 'Percentage point difference (south − north)', font: { size: 10, family: CF } } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });

    const ratioItems = [
      { key: 'approaches', label: 'Approaches', desc: 'more likely to approach in south', icon: '🐿️', inv: false },
      { key: 'runs_from', label: 'Flees Humans', desc: 'higher flee rate in north vs south', icon: '💨', inv: true },
      { key: 'indifferent', label: 'Indifferent', desc: 'of all squirrels indifferent to humans', icon: '😐', all: true },
      { key: 'climbing', label: 'Climbing', desc: 'higher climbing rate in tree-dense north', icon: '🌲', inv: true },
    ];
    const rg = ratioRef.current;
    rg.innerHTML = '';
    ratioItems.forEach(s => {
      const nr = pct(NSQ, s.key), sr = pct(SSQ, s.key);
      const ratio = s.all ? pct(SQ, s.key) : s.inv ? (nr > 0 && sr > 0 ? +(nr / sr).toFixed(1) : 0) : (nr > 0 ? +(sr / nr).toFixed(1) : 0);
      const col = s.all ? '#7A6040' : s.inv ? NC : SC;
      const card = document.createElement('div'); card.className = 'rc';
      card.innerHTML = `<div class="rc-eyebrow">${s.icon} ${BL[s.key] || s.label}</div>
        <div class="rc-val" style="color:${col}">${s.all ? ratio.toFixed(0) + '%' : ratio.toFixed(1) + '×'}</div>
        <div class="rc-desc">${s.desc}</div>
        <div class="rc-bar-row"><div class="rc-bar-lbl" style="color:${NC}">North</div><div class="rc-track"><div class="rc-fill" style="width:${Math.min(100, nr * 2)}%;background:${NC}"></div></div><div class="rc-pct">${nr.toFixed(1)}%</div></div>
        <div class="rc-bar-row"><div class="rc-bar-lbl" style="color:${SC}">South</div><div class="rc-track"><div class="rc-fill" style="width:${Math.min(100, sr * 2)}%;background:${SC}"></div></div><div class="rc-pct">${sr.toFixed(1)}%</div></div>`;
      rg.appendChild(card);
    });

    return () => { bar.destroy(); diverge.destroy(); };
  }, [data]);

  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
    }, { threshold: .1 });
    sectionRef.current.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div id="ch3" />
      <div className="chapter-mark reveal" ref={sectionRef}>
        <div className="ch-num">3</div>
        <div><div className="ch-label">Behavioral Analysis</div><h2>Eight behaviors, <em>one census</em></h2></div>
      </div>
      <div className="charts-section">
        <div className="chart-card reveal">
          <div className="cc-head">
            <div className="cc-eyebrow">North vs. South</div>
            <div className="cc-title">Behavior rates by park zone</div>
            <div className="cc-sub">Percentage of squirrels exhibiting each behavior, split by park zone. The gap between bars tells the story.</div>
            <div className="cc-legend">
              <div className="cc-leg"><div className="cc-dot" style={{ background: '#5A6A2A' }} />North Park</div>
              <div className="cc-leg"><div className="cc-dot" style={{ background: '#A8421A' }} />South Park</div>
            </div>
          </div>
          <div className="chart-canvas-wrap" style={{ height: 'clamp(240px,32vh,320px)' }}>
            <canvas ref={barRef} />
          </div>
        </div>
        <div className="chart-card reveal">
          <div className="cc-head">
            <div className="cc-eyebrow">The Behavioral Divide</div>
            <div class="cc-title">Normalized Difference (South % − North %)</div>
            <div class="cc-sub">Shows which behaviors are disproportionately common in each region, accounting for the total sighting count.</div>
          </div>
          <div className="chart-canvas-wrap" style={{ height: 'clamp(220px,28vh,280px)' }}>
            <canvas ref={divergeRef} />
          </div>
        </div>
        <div className="ratio-grid reveal" ref={ratioRef} />
      </div>
    </>
  );
}

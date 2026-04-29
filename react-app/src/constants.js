export const RAW_BASE = 'https://raw.githubusercontent.com/sggenna/Squirrel-s-Eye-View-of-Central-Park/main/data/';
export const TILE = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';
export const CENTER = [40.7826, -73.9656];
export const ZOOM = 14;
export const SPLIT = 40.785;
export const NORTH_C = [40.793, -73.960];
export const SOUTH_C = [40.771, -73.972];
export const NC = '#5A6A2A';
export const SC = '#A8421A';
export const CF = "'IBM Plex Mono',monospace";

export const BC = {
  runs_from: '#c94c3a',
  approaches: '#2d7a4f',
  indifferent: '#2b5fa0',
  foraging: '#b86a12',
  eating: '#d4882a',
  climbing: '#6b4fa0',
  running: '#1a7a72',
  kuks: '#a03a6b',
};

export const BL = {
  runs_from: 'Flees',
  approaches: 'Approaches',
  indifferent: 'Indifferent',
  foraging: 'Foraging',
  eating: 'Eating',
  climbing: 'Climbing',
  running: 'Running',
  kuks: 'Alarm calls',
};

export const ZMAP = {
  1: 'Northwest Corner', 2: 'North Woods', 3: 'Harlem Meer & Lasker Rink',
  4: 'Great Hill', 5: 'The Ravine', 6: 'The Mount', 7: 'Conservatory Garden',
  8: 'The Pool', 9: 'North Meadow & Recreation Center', 10: 'East Meadow',
  11: 'W90s Landscape/Playgrounds', 12: 'Tennis Courts', 13: 'The Reservoir',
  14: 'West 86 - 90 Landscape', 15: 'Summit Rock/W 80s Playgrounds',
  16: 'Great Lawn & The Belvedere', 17: 'Metropolitan Museum Landscape',
  18: "Naturalists' Walk", 19: 'Ramble & The Lake', 20: 'Cedar Hill',
  21: 'Strawberry Fields', 22: 'Bethesda Terrace & Cherry Hill',
  23: 'Conservatory Water', 24: "W. 60s/Tavern on Green", 25: 'Sheep Meadow',
  26: 'The Mall', 27: 'The Dene & East Green', 28: 'Southwest Corner',
  29: 'Heckscher Playground/Ball Fields', 30: 'The Pond & Wollman Rink',
  31: 'The Zoo, Arsenal, & Wein Walk', 32: 'Grand Army Plaza', 33: 'Drives & Bridle Trail',
};

export const BEHS = [
  { key: 'runs_from', label: 'Flees', short: 'Flees' },
  { key: 'approaches', label: 'Approaches', short: 'Appr.' },
  { key: 'indifferent', label: 'Indifferent', short: 'Indiff.' },
  { key: 'foraging', label: 'Foraging', short: 'Forage' },
  { key: 'eating', label: 'Eating', short: 'Eating' },
  { key: 'running', label: 'Running', short: 'Run' },
  { key: 'climbing', label: 'Climbing', short: 'Climb' },
  { key: 'kuks', label: 'Alarm calls', short: 'Alarm' },
];

export const CHAPTERS = [
  { id: 'ch1', num: '01', title: 'How you use <em>Central Park</em>' },
  { id: 'ch2', num: '02', title: 'How squirrels use <em>the same space</em>' },
  { id: 'ch3', num: '03', title: 'Behavior shifts — <em>north vs. south</em>' },
  { id: 'ch4', num: '04', title: 'Explore <em>for yourself</em>' },
];

export const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(43,29,14,.92)',
  titleFont: { family: "'Playfair Display',serif", style: 'italic', size: 13 },
  bodyFont: { family: CF, size: 11 },
  padding: 10,
};

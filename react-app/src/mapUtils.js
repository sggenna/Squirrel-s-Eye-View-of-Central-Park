import L from 'leaflet';
import { TILE, ZMAP } from './constants';
import { ZONE_IMAGES } from './landmarks';

export function heatColor(val) {
  const stops = [
    [500000, '#8b0000', '#6b0000', .9],
    [350000, '#c0392b', '#9b2820', .83],
    [250000, '#e05c26', '#b84a1e', .76],
    [180000, '#e8832a', '#c06820', .68],
    [120000, '#e8a92a', '#c08820', .58],
    [70000,  '#e8c82a', '#c0a420', .46],
    [30000,  '#b8d46a', '#90a850', .32],
    [5000,   '#78b87a', '#5a9060', .2],
    [0,      '#aacaaa', '#88a888', .08],
  ];
  for (const [t, f, bd, o] of stops) if (val >= t) return { f, bd, o };
  return { f: '#ccc', bd: '#aaa', o: .05 };
}

export function buildZoneLayer(ZONE_DATA, INTENSITY) {
  return L.geoJSON(ZONE_DATA, {
    style(feat) {
      const name = ZMAP[parseInt(feat.properties.zone)];
      const m = INTENSITY.find(v => v.Name === name);
      const val = m ? (m['Visits/Acre'] || 0) : 0;
      const { f, bd, o } = heatColor(val);
      return { fillColor: f, fillOpacity: o, color: bd, weight: 1, opacity: .45 };
    },
    onEachFeature(feat, layer) {
      const zoneId = parseInt(feat.properties.zone);
      const name = ZMAP[zoneId] || 'Unknown';
      const mi = INTENSITY.find(v => v.Name === name);
      const val = mi ? (mi['Visits/Acre'] || 0) : 0;
      const img = ZONE_IMAGES[zoneId];
      
      let tooltipContent = `<div class="map-tooltip">
        <strong>${name}</strong>
        ${val.toLocaleString()} visits/acre/yr`;
      
      if (img) {
        tooltipContent += `<div class="tooltip-img" style="background-image: url(${img})"></div>`;
      }
      
      tooltipContent += `</div>`;
      
      layer.bindTooltip(tooltipContent, { 
        sticky: false, 
        direction: 'auto',
        className: 'custom-tooltip' 
      });
    },
  });
}

export function buildSqLayer(arr, filterFn, cfn, r, onOver) {
  const lg = L.layerGroup();
  arr.forEach(s => {
    if (!filterFn(s)) return;
    const col = cfn(s);
    const m = L.circleMarker([s.lat, s.lng], {
      radius: r, color: '#fff', weight: 1.2, fillColor: col, fillOpacity: .9, opacity: .6,
    });
    if (onOver) {
      m.on('mouseover', () => { m.setStyle({ weight: 2.2, radius: r + 1.5 }); onOver(s); });
      m.on('mouseout', () => { m.setStyle({ weight: 1.2, radius: r }); onOver(null); });
    }
    m.addTo(lg);
  });
  return lg;
}

export function mkMap(el, center, zoom, scroll) {
  const m = L.map(el, {
    center, zoom,
    zoomControl: zoom > 13,
    scrollWheelZoom: !!scroll,
    doubleClickZoom: false,
    attributionControl: false,
  });
  L.tileLayer(TILE, { maxZoom: 19 }).addTo(m);
  L.control.attribution({ prefix: false }).addTo(m);
  return m;
}

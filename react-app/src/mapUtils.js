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

export function buildZoneLayer(ZONE_DATA, INTENSITY, showTooltips = true) {
  return L.geoJSON(ZONE_DATA, {
    style(feat) {
      const name = ZMAP[parseInt(feat.properties.zone)];
      const m = INTENSITY.find(v => v.Name === name);
      const val = m ? (m['Visits/Acre'] || 0) : 0;
      const { f, bd, o } = heatColor(val);
      return { fillColor: f, fillOpacity: o, color: bd, weight: 1, opacity: .45 };
    },
    onEachFeature(feat, layer) {
      if (!showTooltips) return;

      const zoneId = parseInt(feat.properties.zone);
      const name = ZMAP[zoneId] || 'Unknown';
      const mi = INTENSITY.find(v => v.Name === name);
      const val = mi ? (mi['Visits/Acre'] || 0) : 0;
      const img = ZONE_IMAGES[zoneId];

      let tooltipContent = `<div class="map-tooltip">
        <strong>${name}</strong><br>
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


export function buildHexbinLayer(data, filterFn, color, hectareData, showTooltips = true, label = 'sightings', forcedMax = null) {
  const lg = L.layerGroup();
  if (!hectareData) return lg;

  // Aggregate counts by grid_id
  const counts = {};
  data.forEach(s => {
    if (!filterFn(s)) return;
    if (s.grid_id) {
      counts[s.grid_id] = (counts[s.grid_id] || 0) + 1;
    }
  });

  const vals = Object.values(counts);
  if (vals.length === 0) return lg;
  
  // Use a provided max or calculate local max
  const maxC = forcedMax || Math.max(...vals);

  L.geoJSON(hectareData, {
    pointToLayer: function(feature, latlng) {
      const gid = feature.properties.grid_id;
      const count = counts[gid] || 0;
      if (count === 0) return null;
      
      const intensity = Math.min(1, count / maxC);
      const radius = 20 + intensity * 50; 
      
      const c = L.circle(latlng, {
        radius,
        fillColor: color,
        fillOpacity: 0.3 + intensity * 0.5,
        color: color,
        weight: 1,
        opacity: 0.2
      });
      
      if (showTooltips) {
        const tooltipContent = `
          <div class="map-tooltip">
            <strong>Hectare ${feature.properties.hectare}</strong>
            ${count.toLocaleString()} ${label} observed
          </div>
        `;
        c.bindTooltip(tooltipContent, { 
          sticky: false, 
          direction: 'top',
          className: 'custom-tooltip' 
        });
      }
      
      return c;
    }
  }).addTo(lg);

  return lg;
}

export function buildDetailedSqLayer(arr, filterFn, cfn, r, showTooltips = true) {
  const lg = L.layerGroup();
  arr.forEach(s => {
    if (!filterFn(s)) return;
    // Use neutral dark gray for individual sightings
    const col = '#555555'; 
    const m = L.circleMarker([s.lat, s.lng], {
      radius: r, color: '#fff', weight: 0.5, fillColor: col, fillOpacity: 0.8, opacity: 0.4,
    });

    if (showTooltips) {
      const behaviors = [];
      if (s.runs_from) behaviors.push('Flees');
      if (s.approaches) behaviors.push('Approaches');
      if (s.indifferent) behaviors.push('Indifferent');
      if (s.foraging) behaviors.push('Foraging');
      if (s.eating) behaviors.push('Eating');
      if (s.climbing) behaviors.push('Climbing');
      if (s.running) behaviors.push('Running');
      if (s.kuks) behaviors.push('Alarm calls');

      const tooltipContent = `
        <div class="map-tooltip">
          <strong>Squirrel #${Math.floor(Math.random() * 9000) + 1000}</strong>
          <div class="pop-row"><span>Color</span><span>${s.color === 'G' ? 'Gray' : s.color === 'C' ? 'Cinnamon' : s.color === 'B' ? 'Black' : 'Unknown'}</span></div>
          <div class="pop-row"><span>Shift</span><span>${s.shift}</span></div>
          <div class="pop-row"><span>Hectare</span><span>${s.hectare || 'N/A'}</span></div>
          <div class="pop-row"><span>Activities</span><span>${behaviors.join(', ') || 'None observed'}</span></div>
        </div>
      `;
      m.bindTooltip(tooltipContent, { 
        className: 'custom-tooltip',
        direction: 'top',
        sticky: false
      });
    }
    
    // Quick hover highlight
    m.on('mouseover', function() { this.setStyle({ weight: 2, radius: r + 2, opacity: 1 }); });
    m.on('mouseout', function() { this.setStyle({ weight: 0.5, radius: r, opacity: 0.4 }); });
    
    m.addTo(lg);
  });
  return lg;
}

export function buildSqLayer(arr, filterFn, cfn, r, onOver) {
  const lg = L.layerGroup();
  arr.forEach(s => {
    if (!filterFn(s)) return;
    const col = '#555555'; // Dark gray
    const m = L.circleMarker([s.lat, s.lng], {
      radius: r, color: '#fff', weight: 1.2, fillColor: col, fillOpacity: 0.9, opacity: 0.6,
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

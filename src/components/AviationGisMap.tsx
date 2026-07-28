import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FlaggedNotam } from '../types';
import { extractNotamGeoJson } from '../lib/notamGeoJsonExtractor';
import { saveMapCache } from '../lib/mapCache';
import { Navigation, CloudRain, ShieldAlert, Eye, RefreshCw, Layers } from 'lucide-react';

interface AviationGisMapProps {
  icao: string;
  airportName?: string;
  notams: FlaggedNotam[];
  flightCategory?: string;
  isNight?: boolean;
}

export const AviationGisMap: React.FC<AviationGisMapProps> = ({
  icao,
  airportName,
  notams,
  flightCategory = 'VFR',
  isNight = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const radarTileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapType, setMapType] = useState<'DARK' | 'SATELLITE' | 'STREET'>('DARK');
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showTfrs, setShowTfrs] = useState<boolean>(true);

  // Extract GeoJSON Features
  const geoData = useMemo(() => extractNotamGeoJson(icao, notams), [icao, notams]);

  // Save offline map cache
  useEffect(() => {
    if (geoData.features.length > 0) {
      saveMapCache(icao, geoData);
    }
  }, [icao, geoData]);

  // Tile URL Map
  const tileUrls = {
    DARK: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    SATELLITE: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    STREET: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: geoData.airportCenter,
        zoom: 12,
        zoomControl: false,
      });

      // Add Zoom Control to Top Right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Base Tile Layer
      const baseTile = L.tileLayer(tileUrls[mapType], {
        attribution: '&copy; CARTO &copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);
      baseTileLayerRef.current = baseTile;

      // Layer Group for NOTAM vectors & radar
      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(geoData.airportCenter, 12);
    }
  }, [geoData.airportCenter]);

  // Update Base Tile Layer when mapType changes
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;
    baseTileLayerRef.current.setUrl(tileUrls[mapType]);
  }, [mapType]);

  // Draw GeoJSON NOTAM Layers & Radar
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // Weather Radar Tile Layer
    if (showRadar) {
      const radarLayer = L.tileLayer(
        'https://tilecache.rainviewer.com/v2/radar/1672531200/256/{z}/{x}/{y}/2/1_1.png',
        { opacity: 0.5 }
      );
      layerGroup.addLayer(radarLayer);
    }

    // Render NOTAM GeoJSON Features
    geoData.features.forEach((feature) => {
      const lat = feature.geometry.coordinates[1];
      const lng = feature.geometry.coordinates[0];
      const props = feature.properties;

      // TFR & Airspace Circles
      if (
        showTfrs &&
        (props.category === 'RUNWAYS_TFRS' || props.category === 'FIR_ENROUTE')
      ) {
        const radius = props.radiusMeters || 9260; // 5 NM default
        const color = props.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b';

        const circle = L.circle([lat, lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '4, 4',
        });

        circle.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <div style="font-weight: bold; color: #ef4444; margin-bottom: 4px;">
              🔴 TFR / AIRSPACE RESTRICTION (${props.id})
            </div>
            <p style="font-family: monospace; font-size: 11px; color: #334155; margin-bottom: 4px;">
              ${props.rawText}
            </p>
            <span style="font-size: 10px; background-color: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px;">
              Radius: ${Math.round(radius / 1852)} NM
            </span>
          </div>
        `);
        layerGroup.addLayer(circle);
      }

      // Pin Markers
      const markerColor =
        props.severity === 'CRITICAL' ? '#ef4444' : props.severity === 'WARNING' ? '#f59e0b' : '#3b82f6';

      const customIcon = L.divIcon({
        className: 'vayu-leaflet-pin',
        html: `
          <div style="
            background-color: ${markerColor};
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px ${markerColor};
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px;">
            ${props.category.replace(/_/g, ' ')} (${props.id})
          </div>
          <p style="font-family: monospace; font-size: 11px; color: #334155; margin-bottom: 4px;">
            ${props.rawText}
          </p>
          <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 10px;">
            <span style="font-weight: bold; color: ${markerColor}; font-size: 10px;">
              ${props.severity}
            </span>
            ${props.effectiveStatus ? `<span style="color: #64748b;">${props.effectiveStatus}</span>` : ''}
          </div>
        </div>
      `);
      layerGroup.addLayer(marker);
    });
  }, [geoData, showRadar, showTfrs]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border mb-6 shadow-2xl transition-all ${
        isNight
          ? 'bg-black border-red-900/60 shadow-red-950/20'
          : 'bg-slate-900 border-slate-800 shadow-slate-950/40'
      }`}
    >
      {/* Top Map Header Toolbar */}
      <div className="bg-slate-950/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Navigation size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white font-mono">{icao}</span>
              <span className="text-xs text-slate-400">• {airportName || 'GIS Aviation Vector Map'}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  flightCategory === 'VFR'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : flightCategory === 'IFR'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {flightCategory}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live GeoJSON NOTAM Overlays ({notams.length} items parsed)
            </p>
          </div>
        </div>

        {/* Map Control Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Base Map Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setMapType('DARK')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                mapType === 'DARK' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark Cockpit
            </button>
            <button
              onClick={() => setMapType('SATELLITE')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                mapType === 'SATELLITE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Radar Toggle */}
          <button
            onClick={() => setShowRadar(!showRadar)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              showRadar
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <CloudRain size={13} /> Weather Radar
          </button>

          {/* TFR Toggle */}
          <button
            onClick={() => setShowTfrs(!showTfrs)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              showTfrs
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <ShieldAlert size={13} /> TFR / Airspace
          </button>
        </div>
      </div>

      {/* Leaflet Map Div Container */}
      <div
        ref={mapContainerRef}
        className={`relative h-[380px] w-full z-10 ${
          isNight ? 'filter sepia-[80%] hue-rotate-[310deg] brightness-[75%]' : ''
        }`}
      />

      {/* Bottom Map Legend */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 z-20 relative">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>TFR / Runway Closure</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Navaid Outage</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
            <span>General NOTAM</span>
          </span>
        </div>
        <div className="text-[10px] text-slate-400">
          Click any pin to inspect spatial raw string
        </div>
      </div>
    </div>
  );
};

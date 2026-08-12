"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Real property coordinates for this evaluation — Neralu Farms, a farmland
// listing in Chikkaballapura district, Karnataka (rural/hilly terrain, the
// kind of listing where elevation context is actually meaningful).
const LOCATIONS = [
  { name: "Neralu Farms — Chikkaballapura, Karnataka", lng: 77.636619, lat: 13.717769 },
  { name: "Tallur Circle — Mysore, Karnataka", lng: 76.6394, lat: 12.2958 },
];

// Free, no-API-key data sources:
// - Satellite imagery: Esri World Imagery (public ArcGIS Online basemap)
// - Terrain elevation: AWS Open Data "elevation-tiles-prod" (Mapzen/Tilezen
//   terrarium format), hosted as public open data, no signup required.
function styleFor(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      satellite: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Esri, Maxar, Earthstar Geographics",
      },
      terrain: {
        type: "raster-dem",
        tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
        tileSize: 256,
        encoding: "terrarium",
        maxzoom: 15,
      },
    },
    layers: [{ id: "satellite-layer", type: "raster", source: "satellite" }],
    terrain: { source: "terrain", exaggeration: 1.6 },
  };
}

export default function Test3DMapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [locationIndex, setLocationIndex] = useState(0);
  const [exaggeration, setExaggeration] = useState(1.6);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const loc = LOCATIONS[locationIndex];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleFor(),
      center: [loc.lng, loc.lat],
      zoom: 14,
      pitch: 65,
      bearing: -20,
      maxPitch: 85,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    new maplibregl.Marker({ color: "#F2791E" }).setLngLat([loc.lng, loc.lat]).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flyTo(index: number) {
    setLocationIndex(index);
    const loc = LOCATIONS[index];
    mapRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 14, pitch: 65, bearing: -20, duration: 1500 });
  }

  function updateExaggeration(value: number) {
    setExaggeration(value);
    mapRef.current?.setTerrain({ source: "terrain", exaggeration: value });
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#111" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          background: "rgba(15,20,30,0.85)",
          color: "#eee",
          padding: "14px 18px",
          borderRadius: 12,
          fontFamily: "sans-serif",
          fontSize: 13,
          maxWidth: 320,
          backdropFilter: "blur(6px)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{LOCATIONS[locationIndex].name}</p>
        <p style={{ margin: "4px 0 12px", opacity: 0.6 }}>
          MapLibre GL + Esri satellite + AWS open terrain (all free, no API key)
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {LOCATIONS.map((loc, i) => (
            <button
              key={loc.name}
              onClick={() => flyTo(i)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: i === locationIndex ? "#F2791E" : "transparent",
                color: "#fff",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Location {i + 1}
            </button>
          ))}
        </div>

        <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>
          Terrain exaggeration: {exaggeration.toFixed(1)}x
        </label>
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={exaggeration}
          onChange={(e) => updateExaggeration(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

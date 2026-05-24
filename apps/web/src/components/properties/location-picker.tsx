"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Navigation, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";

type ResolvedLocation = {
  latitude: number;
  longitude: number;
  address: string;
  state: string;
  district: string;
  village: string;
  taluka: string;
  pincode: string;
  displayName: string;
};

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  address: string;
  state: string;
  district: string;
  village: string;
  taluka: string;
  pincode: string;
  onLocationResolved: (location: ResolvedLocation) => void;
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;
const DETAIL_ZOOM = 15;

function buildAddressLine(address: Record<string, string> | undefined, fallback: string) {
  if (!address) return fallback;

  const segments = [
    [address.house_number, address.road].filter(Boolean).join(" ").trim(),
    address.suburb || address.neighbourhood || address.residential || "",
    address.village || address.hamlet || address.town || address.city || "",
    address.county || address.state_district || address.city_district || "",
  ].filter(Boolean);

  return segments.length > 0 ? segments.join(", ") : fallback;
}

function parseResolvedLocation(result: SearchResult): ResolvedLocation {
  const address = result.address || {};

  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    address: buildAddressLine(address, result.display_name),
    state: address.state || "",
    district:
      address.state_district ||
      address.county ||
      address.city_district ||
      address.city ||
      address.town ||
      "",
    village:
      address.village ||
      address.hamlet ||
      address.suburb ||
      address.neighbourhood ||
      address.locality ||
      "",
    taluka:
      address.county ||
      address.municipality ||
      address.subcounty ||
      address.city_district ||
      "",
    pincode: address.postcode || "",
    displayName: result.display_name,
  };
}

export default function LocationPicker(props: LocationPickerProps) {
  const {
    latitude,
    longitude,
    address,
    state,
    district,
    village,
    taluka,
    pincode,
    onLocationResolved,
  } = props;

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResolvedCoordsRef = useRef<string>("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const currentSummary = useMemo(() => {
    return [address, village, taluka, district, state, pincode].filter(Boolean).join(", ");
  }, [address, district, pincode, state, taluka, village]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    async function initMap() {
      const leaflet = await import("leaflet");
      if (cancelled || !mapRef.current) return;

      leafletRef.current = leaflet;
      delete (leaflet.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const initialCenter: [number, number] =
        latitude !== null && longitude !== null ? [latitude, longitude] : DEFAULT_CENTER;
      const initialZoom = latitude !== null && longitude !== null ? DETAIL_ZOOM : DEFAULT_ZOOM;

      const map = leaflet.map(mapRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        scrollWheelZoom: true,
      });

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        })
        .addTo(map);

      const marker = leaflet.marker(initialCenter, { draggable: true }).addTo(map);

      marker.on("dragend", async () => {
        const latlng = marker.getLatLng();
        await reverseGeocode(latlng.lat, latlng.lng);
      });

      map.on("click", async (event: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(event.latlng);
        await reverseGeocode(event.latlng.lat, event.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setMapReady(true);
    }

    void initMap();

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
      leafletRef.current = null;
    };
  }, [latitude, longitude]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markerRef.current) return;
    if (latitude === null || longitude === null) return;

    const next = `${latitude}:${longitude}`;
    if (lastResolvedCoordsRef.current === next) return;

    markerRef.current.setLatLng([latitude, longitude]);
    mapInstanceRef.current.setView([latitude, longitude], DETAIL_ZOOM);
    lastResolvedCoordsRef.current = next;
  }, [latitude, longitude, mapReady]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim() || query.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=in&q=${encodeURIComponent(
            query.trim()
          )}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = (await response.json()) as SearchResult[];
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  async function reverseGeocode(lat: number, lng: number) {
    setLocating(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );
      const data = (await response.json()) as SearchResult;
      if (!data?.lat || !data?.lon) return;

      const resolved = parseResolvedLocation({
        ...data,
        lat: String(lat),
        lon: String(lng),
      });

      lastResolvedCoordsRef.current = `${lat}:${lng}`;
      onLocationResolved(resolved);
    } finally {
      setLocating(false);
    }
  }

  function handleResultSelect(result: SearchResult) {
    const resolved = parseResolvedLocation(result);
    setQuery(result.display_name);
    setResults([]);
    setSearchOpen(false);
    lastResolvedCoordsRef.current = `${resolved.latitude}:${resolved.longitude}`;
    onLocationResolved(resolved);

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([resolved.latitude, resolved.longitude]);
      mapInstanceRef.current.setView([resolved.latitude, resolved.longitude], DETAIL_ZOOM);
    }
  }

  function useBrowserLocation() {
    if (!navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await reverseGeocode(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  return (
    <div className="relative isolate space-y-4 rounded-2xl border border-cream/10 bg-onyx-950/35 p-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/25" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search exact plot location, village, survey road..."
            className="w-full rounded-xl border border-cream/10 bg-onyx-900/70 py-3 pl-10 pr-4 text-sm text-cream placeholder:text-cream/20 focus:border-gold/40 focus:outline-none"
          />

          {searchOpen && (searching || results.length > 0) && (
            <div className="absolute z-[1200] mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-cream/10 bg-onyx-900 shadow-2xl shadow-black/40">
              {searching ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-cream/45">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching locations...
                </div>
              ) : (
                results.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    onClick={() => handleResultSelect(result)}
                    className="block w-full border-b border-cream/5 px-4 py-3 text-left text-sm text-cream/65 transition hover:bg-gold/5 hover:text-cream"
                  >
                    {result.display_name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={useBrowserLocation}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/20 px-4 py-3 text-sm text-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          Use My Location
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),280px]">
        <div className="relative z-0 overflow-hidden rounded-2xl border border-cream/10">
          <div ref={mapRef} className="h-[320px] w-full" />
        </div>

        <div className="rounded-2xl border border-cream/10 bg-onyx-900/55 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-cream">
            <MapPin className="h-4 w-4 text-gold" />
            Selected Location
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-cream/25">Coordinates</p>
              <p className="mt-1 font-mono text-cream/70">
                {latitude !== null && longitude !== null
                  ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                  : "Pin not selected yet"}
              </p>
            </div>

            <div>
              <p className="text-cream/25">Resolved address</p>
              <p className="mt-1 leading-relaxed text-cream/60">
                {currentSummary || "Search, click, or drag the marker to fill the location fields."}
              </p>
            </div>

            <div className="rounded-xl border border-cream/10 bg-onyx-950/50 p-3 text-xs leading-relaxed text-cream/40">
              Click on the map or drag the marker to pin the exact plot. You can still edit the address fields manually after autofill.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

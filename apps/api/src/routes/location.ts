import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { logger } from "../lib/logger";

export const locationRoutes = Router();
const OLA_MAPS_BASE_API = "https://api.olamaps.io";

const autocompleteSchema = z.object({
  q: z.string().trim().min(2).max(200),
  country: z.string().trim().min(2).max(5).optional().default("in"),
  limit: z.coerce.number().int().min(1).max(10).optional().default(8),
});

const reverseSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

type LocationResult = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

type OlaRequestHeaders = Record<string, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumberString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const next = readNumberString(value);
    if (next) return next;
  }
  return null;
}

function normalizeAddress(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;

  const entries = Object.entries(value)
    .map(([key, raw]) => [key, readString(raw)] as const)
    .filter((entry): entry is readonly [string, string] => Boolean(entry[1]));

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeOlaAddressComponents(value: unknown): Record<string, string> | undefined {
  if (!Array.isArray(value)) return undefined;

  const address: Record<string, string> = {};

  for (const item of value) {
    if (!isRecord(item) || !Array.isArray(item.types)) continue;
    const longName = readString(item.long_name);
    if (!longName) continue;

    for (const type of item.types) {
      if (typeof type === "string" && type.trim()) {
        address[type] = longName;
      }
    }
  }

  return Object.keys(address).length > 0 ? address : undefined;
}

function getOlaHeaders(): OlaRequestHeaders {
  const referer = env.APP_URL.endsWith("/") ? env.APP_URL : `${env.APP_URL}/`;

  return {
    Accept: "application/json",
    Origin: env.APP_URL,
    Referer: referer,
    "User-Agent": "OnyxPropcare/1.0",
  };
}

function normalizeOlaItem(item: unknown, index: number): LocationResult | null {
  if (!isRecord(item)) return null;

  const position = isRecord(item.position) ? item.position : null;
  const geometry = isRecord(item.geometry) ? item.geometry : null;
  const location = isRecord(item.location) ? item.location : null;
  const coordinates = Array.isArray(geometry?.coordinates) ? geometry.coordinates : null;

  const lat = firstString(
    item.lat,
    item.latitude,
    position?.lat,
    position?.latitude,
    location?.lat,
    location?.latitude,
    coordinates?.[1]
  );
  const lon = firstString(
    item.lon,
    item.lng,
    item.longitude,
    position?.lng,
    position?.lon,
    position?.longitude,
    location?.lng,
    location?.lon,
    location?.longitude,
    coordinates?.[0]
  );

  if (!lat || !lon) return null;

  const displayName = firstString(
    item.description,
    item.display_name,
    item.displayName,
    item.formatted_address,
    item.formattedAddress,
    item.address,
    item.name,
    item.title
  );

  if (!displayName) return null;

  return {
    place_id:
      firstString(item.place_id, item.placeId, item.id, item.reference, item.mapplsPin, `${index}`) || `${index}`,
    display_name: displayName,
    lat,
    lon,
    address:
      normalizeAddress(item.address) ||
      normalizeAddress(item.address_components) ||
      normalizeAddress(item.addressComponents),
  };
}

function normalizeOlaGeocodeItem(item: unknown, index: number): LocationResult | null {
  if (!isRecord(item)) return null;

  const geometry = isRecord(item.geometry) ? item.geometry : null;
  const location = isRecord(geometry?.location) ? geometry.location : null;
  const lat = firstString(location?.lat, item.lat, item.latitude);
  const lon = firstString(location?.lng, location?.lon, item.lon, item.lng, item.longitude);
  const displayName = firstString(item.formatted_address, item.name, item.display_name);

  if (!lat || !lon || !displayName) {
    return null;
  }

  return {
    place_id: firstString(item.place_id, item.id, `${index}`) || `${index}`,
    display_name: displayName,
    lat,
    lon,
    address: normalizeOlaAddressComponents(item.address_components),
  };
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

async function searchWithNominatim(query: string, country: string, limit: number): Promise<LocationResult[]> {
  const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
  searchUrl.searchParams.set("format", "jsonv2");
  searchUrl.searchParams.set("addressdetails", "1");
  searchUrl.searchParams.set("countrycodes", country.toLowerCase());
  searchUrl.searchParams.set("limit", String(limit));
  searchUrl.searchParams.set("q", query);

  const payload = await fetchJson(searchUrl.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "OnyxPropcare/1.0",
    },
  });

  return Array.isArray(payload) ? (payload as LocationResult[]).slice(0, limit) : [];
}

async function reverseWithNominatim(lat: number, lng: number): Promise<LocationResult | null> {
  const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
  reverseUrl.searchParams.set("format", "jsonv2");
  reverseUrl.searchParams.set("addressdetails", "1");
  reverseUrl.searchParams.set("zoom", "18");
  reverseUrl.searchParams.set("lat", String(lat));
  reverseUrl.searchParams.set("lon", String(lng));

  const payload = await fetchJson(reverseUrl.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "OnyxPropcare/1.0",
    },
  });

  return isRecord(payload) && readString(payload.lat) && readString(payload.lon)
    ? (payload as LocationResult)
    : null;
}

async function searchWithOlaMaps(query: string, country: string, limit: number): Promise<LocationResult[]> {
  if (!env.OLA_MAPS_API_KEY) {
    return [];
  }

  const searchUrl = new URL(`${OLA_MAPS_BASE_API}/places/v1/geocode`);
  searchUrl.searchParams.set("address", query);
  searchUrl.searchParams.set("api_key", env.OLA_MAPS_API_KEY);
  void country;

  const payload = await fetchJson(searchUrl.toString(), { headers: getOlaHeaders() });

  const container = isRecord(payload) ? payload.geocodingResults : null;

  if (!Array.isArray(container)) {
    return [];
  }

  return container
    .map((item, index) => normalizeOlaGeocodeItem(item, index))
    .filter((item): item is LocationResult => Boolean(item))
    .slice(0, limit);
}

async function reverseWithOlaMaps(lat: number, lng: number): Promise<LocationResult | null> {
  if (!env.OLA_MAPS_API_KEY) {
    return null;
  }

  const reverseUrl = new URL(`${OLA_MAPS_BASE_API}/places/v1/reverse-geocode`);
  reverseUrl.searchParams.set("latlng", `${lat},${lng}`);
  reverseUrl.searchParams.set("api_key", env.OLA_MAPS_API_KEY);

  const payload = await fetchJson(reverseUrl.toString(), { headers: getOlaHeaders() });

  if (!isRecord(payload) || !Array.isArray(payload.results) || payload.results.length === 0) {
    return null;
  }

  return normalizeOlaItem(payload.results[0], 0);
}

locationRoutes.get("/autocomplete", async (req, res) => {
  try {
    const { q, country, limit } = autocompleteSchema.parse(req.query);

    let results: LocationResult[] = [];
    let providerUsed = "nominatim";

    if (env.LOCATION_SEARCH_PROVIDER === "olamaps") {
      try {
        results = await searchWithOlaMaps(q, country, limit);
        if (results.length > 0) {
          providerUsed = "olamaps";
        }
      } catch (err) {
        logger.warn({ err }, "Ola Maps autocomplete failed, falling back to Nominatim");
      }
    }

    if (results.length === 0) {
      results = await searchWithNominatim(q, country, limit);
      providerUsed = "nominatim";
    }

    res.json({
      success: true,
      data: results,
      meta: {
        provider: providerUsed,
        fallback: providerUsed !== env.LOCATION_SEARCH_PROVIDER,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors });
    }

    logger.error({ err }, "Location autocomplete failed");
    res.status(500).json({ success: false, error: "Failed to search locations" });
  }
});

locationRoutes.get("/reverse", async (req, res) => {
  try {
    const { lat, lng } = reverseSchema.parse(req.query);
    let providerUsed = "nominatim";
    let result: LocationResult | null = null;

    if (env.LOCATION_SEARCH_PROVIDER === "olamaps") {
      try {
        result = await reverseWithOlaMaps(lat, lng);
        if (result) {
          providerUsed = "olamaps";
        }
      } catch (err) {
        logger.warn({ err }, "Ola Maps reverse geocoding failed, falling back to Nominatim");
      }
    }

    if (!result) {
      result = await reverseWithNominatim(lat, lng);
      providerUsed = "nominatim";
    }

    if (!result) {
      return res.status(404).json({ success: false, error: "Location not found" });
    }

    res.json({
      success: true,
      data: result,
      meta: {
        provider: providerUsed,
        fallback: providerUsed !== env.LOCATION_SEARCH_PROVIDER,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors });
    }

    logger.error({ err }, "Location reverse geocoding failed");
    res.status(500).json({ success: false, error: "Failed to resolve location" });
  }
});

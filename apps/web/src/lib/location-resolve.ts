// Pure parsing logic shared between LocationPicker (the map/search widget)
// and LockedLocationField's manual-entry suggestions. Kept dependency-free
// (no React, no Leaflet) so importing it doesn't drag Leaflet's CSS/JS into
// every page that just wants the district-parsing logic.

export type ResolvedLocation = {
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

export type SearchResult = {
  place_id: string | number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

// The API's /location/autocomplete and /reverse endpoints are backed by
// either Nominatim (OSM-style address keys: state, state_district, county,
// city_district, city, town...) or Ola Maps (Google-Places-style keys, one
// per Google address "type": administrative_area_level_1/2, locality,
// sublocality, postal_code...) depending on LOCATION_SEARCH_PROVIDER, and it
// can fall back from one to the other mid-request if the primary provider
// errors. Every lookup here checks both vocabularies so autofill works
// regardless of which provider actually answered.
export function buildAddressLine(address: Record<string, string> | undefined, fallback: string) {
  if (!address) return fallback;

  const segments = [
    [address.house_number, address.road].filter(Boolean).join(" ").trim(),
    address.suburb || address.neighbourhood || address.residential || address.sublocality || "",
    address.village || address.hamlet || address.town || address.city || address.locality || "",
    address.county || address.state_district || address.city_district || address.administrative_area_level_2 || "",
  ].filter(Boolean);

  return segments.length > 0 ? segments.join(", ") : fallback;
}

export function parseResolvedLocation(result: SearchResult): ResolvedLocation {
  const address = result.address || {};

  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    address: buildAddressLine(address, result.display_name),
    state: address.state || address.administrative_area_level_1 || "",
    district:
      address.state_district ||
      address.county ||
      address.city_district ||
      address.administrative_area_level_2 ||
      address.administrative_area_level_3 ||
      address.city ||
      address.town ||
      address.locality ||
      "",
    village:
      address.village ||
      address.hamlet ||
      address.suburb ||
      address.neighbourhood ||
      address.locality ||
      address.sublocality ||
      "",
    taluka:
      address.county ||
      address.municipality ||
      address.subcounty ||
      address.city_district ||
      address.administrative_area_level_3 ||
      "",
    pincode: address.postcode || address.postal_code || "",
    displayName: result.display_name,
  };
}

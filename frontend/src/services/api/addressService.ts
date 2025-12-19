// Photon API (OpenStreetMap-based) address service
// Free, no API key required

const PHOTON_API_BASE = 'https://photon.komoot.io/api/';
const US_CENTER_LAT = 39.8;
const US_CENTER_LON = -98.5;

export interface AddressSuggestion {
  displayName: string;
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  lat: number;
  lon: number;
}

export interface AddressSearchResult {
  suggestions: AddressSuggestion[];
  error?: string;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

function formatDisplayName(props: PhotonFeature['properties']): string {
  const parts: string[] = [];

  // Street address
  if (props.housenumber && props.street) {
    parts.push(`${props.housenumber} ${props.street}`);
  } else if (props.street) {
    parts.push(props.street);
  } else if (props.name) {
    parts.push(props.name);
  }

  // City
  if (props.city) {
    parts.push(props.city);
  }

  // State
  if (props.state) {
    parts.push(props.state);
  }

  // Postcode
  if (props.postcode) {
    parts.push(props.postcode);
  }

  return parts.join(', ');
}

export async function searchAddresses(
  query: string,
  limit: number = 5
): Promise<AddressSearchResult> {
  if (!query || query.trim().length < 3) {
    return { suggestions: [] };
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString(),
      lat: US_CENTER_LAT.toString(),
      lon: US_CENTER_LON.toString(),
    });

    const response = await fetch(`${PHOTON_API_BASE}?${params}`);

    if (!response.ok) {
      throw new Error(`Photon API error: ${response.status}`);
    }

    const data: PhotonResponse = await response.json();

    const suggestions: AddressSuggestion[] = data.features.map((feature) => ({
      displayName: formatDisplayName(feature.properties),
      street: feature.properties.housenumber
        ? `${feature.properties.housenumber} ${feature.properties.street || ''}`
        : feature.properties.street,
      city: feature.properties.city,
      state: feature.properties.state,
      postcode: feature.properties.postcode,
      country: feature.properties.country,
      lon: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
    }));

    return { suggestions };
  } catch (error) {
    console.error('Address search error:', error);
    return {
      suggestions: [],
      error: error instanceof Error ? error.message : 'Failed to search addresses',
    };
  }
}

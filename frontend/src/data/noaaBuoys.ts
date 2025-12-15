/**
 * NOAA Buoy Reference Data
 * Coordinates from https://www.ndbc.noaa.gov/activestations.xml
 *
 * Used to calculate nearest buoy for each surf spot
 */

export interface NOAABuoy {
  id: string;
  name: string;
  lat: number;
  lon: number;
  region: string;
}

export const NOAA_BUOYS: NOAABuoy[] = [
  // Gulf of Mexico - Texas
  { id: "42035", name: "Galveston (22nm SE)", lat: 29.235, lon: -94.41, region: "Texas" },
  { id: "42019", name: "Freeport (60nm S)", lat: 27.908, lon: -95.343, region: "Texas" },
  { id: "42020", name: "Corpus Christi (60nm SSE)", lat: 26.97, lon: -96.679, region: "Texas" },
  { id: "42002", name: "West Gulf (207nm E of Brownsville)", lat: 25.95, lon: -93.78, region: "Texas" },
  { id: "42044", name: "South Padre (TABS J)", lat: 26.191, lon: -97.051, region: "Texas" },

  // Gulf of Mexico - Alabama/Florida Panhandle
  { id: "42012", name: "Orange Beach (44nm SE Mobile)", lat: 30.06, lon: -87.548, region: "Alabama" },
  { id: "42040", name: "Dauphin Island (63nm S)", lat: 29.207, lon: -88.237, region: "Alabama" },
  { id: "42039", name: "Pensacola (115nm SSE)", lat: 28.787, lon: -86.007, region: "Florida Panhandle" },

  // Gulf of Mexico - Florida West Coast
  { id: "42036", name: "West Tampa (112nm WNW)", lat: 28.5, lon: -84.505, region: "Florida West" },
  { id: "42013", name: "WFS Central (25m)", lat: 27.173, lon: -82.924, region: "Florida West" },
  { id: "42099", name: "St. Petersburg Offshore", lat: 27.352, lon: -84.275, region: "Florida West" },

  // Florida East Coast
  { id: "41009", name: "Cape Canaveral (20nm E)", lat: 28.508, lon: -80.185, region: "Florida East" },
  { id: "41113", name: "Cape Canaveral Nearshore", lat: 28.4, lon: -80.533, region: "Florida East" },
  { id: "41114", name: "Fort Pierce", lat: 27.552, lon: -80.216, region: "Florida East" },
  { id: "41117", name: "St. Augustine", lat: 29.999, lon: -81.079, region: "Florida East" },
  { id: "41112", name: "Fernandina Beach Offshore", lat: 30.709, lon: -81.292, region: "Florida East" },
  { id: "41122", name: "Hollywood Beach", lat: 26.001, lon: -80.096, region: "Florida East" },

  // Southeast Atlantic - Georgia/SC/NC
  { id: "41008", name: "Grays Reef (40nm SE Savannah)", lat: 31.4, lon: -80.866, region: "Georgia" },
  { id: "41004", name: "Edisto (41nm SE Charleston)", lat: 32.502, lon: -79.099, region: "South Carolina" },
  { id: "41013", name: "Frying Pan Shoals", lat: 33.441, lon: -77.764, region: "North Carolina" },
  { id: "41025", name: "Diamond Shoals", lat: 35.026, lon: -75.38, region: "North Carolina" },
  { id: "41037", name: "Wrightsville Beach Offshore", lat: 33.988, lon: -77.362, region: "North Carolina" },

  // Mid-Atlantic
  { id: "41001", name: "East Hatteras (150nm E)", lat: 34.791, lon: -72.42, region: "Virginia" },
  { id: "44009", name: "Delaware Bay", lat: 38.464, lon: -74.702, region: "Delaware" },
  { id: "44025", name: "Long Island (33nm S)", lat: 40.251, lon: -73.164, region: "New York" },

  // New England
  { id: "44017", name: "Montauk Point", lat: 40.693, lon: -72.048, region: "New York" },
  { id: "44097", name: "Block Island", lat: 40.969, lon: -71.126, region: "Rhode Island" },
  { id: "44013", name: "Boston (16nm E)", lat: 42.346, lon: -70.651, region: "Massachusetts" },

  // California - Southern
  { id: "46025", name: "Santa Monica Basin", lat: 33.749, lon: -119.053, region: "Southern California" },
  { id: "46221", name: "Santa Monica Bay", lat: 33.855, lon: -118.633, region: "Southern California" },
  { id: "46222", name: "San Pedro Channel", lat: 33.618, lon: -118.317, region: "Southern California" },
  { id: "46253", name: "San Pedro (nearshore)", lat: 33.769, lon: -118.193, region: "Southern California" },
  { id: "46086", name: "San Clemente Basin", lat: 32.491, lon: -118.034, region: "Southern California" },
  { id: "46225", name: "Torrey Pines Outer", lat: 32.933, lon: -117.391, region: "San Diego" },
  { id: "46232", name: "Point Loma South", lat: 32.53, lon: -117.431, region: "San Diego" },
  { id: "46254", name: "Oceanside Offshore", lat: 33.22, lon: -117.44, region: "San Diego" },

  // California - Central
  { id: "46011", name: "Santa Maria (21nm NW)", lat: 34.956, lon: -120.857, region: "Central California" },
  { id: "46054", name: "Santa Barbara W", lat: 34.265, lon: -120.477, region: "Central California" },
  { id: "46218", name: "Harvest", lat: 34.454, lon: -120.783, region: "Central California" },
  { id: "46028", name: "Cape San Martin", lat: 35.741, lon: -121.884, region: "Central California" },

  // California - Northern
  { id: "46026", name: "San Francisco (18nm W)", lat: 37.759, lon: -122.833, region: "Northern California" },
  { id: "46012", name: "Half Moon Bay (24nm SSW)", lat: 37.361, lon: -122.881, region: "Northern California" },
  { id: "46042", name: "Monterey", lat: 36.789, lon: -122.398, region: "Northern California" },
  { id: "46013", name: "Bodega Bay (48nm NW)", lat: 38.242, lon: -123.301, region: "Northern California" },
  { id: "46014", name: "Point Arena (19nm NW)", lat: 39.235, lon: -123.969, region: "Northern California" },
  { id: "46022", name: "Eel River (17nm WSW)", lat: 40.749, lon: -124.577, region: "Northern California" },

  // Pacific Northwest
  { id: "46029", name: "Columbia River Bar", lat: 46.144, lon: -124.51, region: "Oregon" },
  { id: "46050", name: "Stonewall Bank", lat: 44.669, lon: -124.526, region: "Oregon" },
  { id: "46015", name: "Port Orford (15nm W)", lat: 42.764, lon: -124.823, region: "Oregon" },
  { id: "46041", name: "Cape Elizabeth (45nm W)", lat: 47.353, lon: -124.731, region: "Washington" },
  { id: "46005", name: "West Washington (300nm W)", lat: 46.143, lon: -131.09, region: "Washington" },

  // Hawaii
  { id: "51201", name: "Waimea Bay (2nm SW)", lat: 21.673, lon: -158.116, region: "Hawaii" },
  { id: "51202", name: "Mokapu Point", lat: 21.417, lon: -157.68, region: "Hawaii" },
  { id: "51203", name: "Kaneohe Bay", lat: 21.477, lon: -157.752, region: "Hawaii" },
  { id: "51204", name: "Kaneohe Bay (nearshore)", lat: 21.482, lon: -157.79, region: "Hawaii" },
  { id: "51207", name: "Pauwela", lat: 20.993, lon: -156.427, region: "Hawaii (Maui)" },
  { id: "51000", name: "N Pacific (offshore)", lat: 23.546, lon: -153.933, region: "Hawaii" },
  { id: "51001", name: "NW Hawaii", lat: 24.453, lon: -162.058, region: "Hawaii" },
  { id: "51002", name: "SW Hawaii", lat: 17.094, lon: -157.808, region: "Hawaii" },

  // Alaska (limited but included for completeness)
  { id: "46001", name: "Western Gulf of Alaska", lat: 56.296, lon: -148.027, region: "Alaska" },
  { id: "46061", name: "Kodiak Island (67nm SW)", lat: 57.023, lon: -154.185, region: "Alaska" },

  // Mexico - Pacific
  { id: "42055", name: "Bay of Campeche", lat: 22.14, lon: -94.112, region: "Mexico Gulf" },
  { id: "42056", name: "Yucatan Basin", lat: 19.82, lon: -84.98, region: "Mexico Caribbean" },

  // Canada - West Coast
  { id: "46004", name: "Middle Nomad", lat: 50.93, lon: -136.1, region: "British Columbia" },
  { id: "46036", name: "South Nomad", lat: 48.353, lon: -133.94, region: "British Columbia" },
  { id: "46132", name: "South Brooks", lat: 49.737, lon: -127.927, region: "British Columbia" },
  { id: "46131", name: "Sentry Shoal", lat: 49.91, lon: -124.99, region: "British Columbia" },

  // Canada - East Coast
  { id: "44137", name: "Halifax East", lat: 44.27, lon: -63.407, region: "Nova Scotia" },
  { id: "44139", name: "East Scotian Slope", lat: 44.238, lon: -57.1, region: "Nova Scotia" },
  { id: "44150", name: "Halifax Harbour", lat: 44.5, lon: -63.4, region: "Nova Scotia" },
];

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest NOAA buoy to a given coordinate
 */
export function findNearestBuoy(
  lat: number,
  lon: number
): { buoy: NOAABuoy; distance: number } | null {
  let nearest: NOAABuoy | null = null;
  let minDistance = Infinity;

  for (const buoy of NOAA_BUOYS) {
    const distance = calculateDistance(lat, lon, buoy.lat, buoy.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = buoy;
    }
  }

  if (!nearest) return null;
  return { buoy: nearest, distance: minDistance };
}

export interface BuoyWithDistance extends NOAABuoy {
  distance: number;
}

/**
 * Get recommended buoys for a spot, sorted by distance
 * @param lat Spot latitude
 * @param lon Spot longitude
 * @param maxDistance Maximum distance in miles (default 500)
 * @param limit Maximum number of buoys to return (default 10)
 */
export function getRecommendedBuoys(
  lat: number,
  lon: number,
  maxDistance: number = 500,
  limit: number = 10
): BuoyWithDistance[] {
  const buoysWithDistance: BuoyWithDistance[] = NOAA_BUOYS.map((buoy) => ({
    ...buoy,
    distance: calculateDistance(lat, lon, buoy.lat, buoy.lon),
  }));

  // Filter by max distance and sort by proximity
  return buoysWithDistance
    .filter((b) => b.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 1) {
    return "< 1 mi";
  }
  return `${Math.round(miles)} mi`;
}

// ============================================
// SWELL-AWARE BUOY RECOMMENDATIONS
// ============================================

/**
 * Exposure types based on which direction swells typically arrive from
 */
export type Exposure = 'gulf' | 'atlantic' | 'pacific' | 'caribbean' | 'north' | 'south' | 'unknown';

/**
 * Extended buoy recommendation with scoring
 */
export interface BuoyRecommendation extends BuoyWithDistance {
  bearing: number;           // Bearing from spot to buoy (0-360°)
  swellPathScore: number;    // 0-1, how well positioned for incoming swells
  combinedScore: number;     // Weighted combination of swell path + proximity
}

/**
 * Calculate bearing from point 1 to point 2
 * @returns Bearing in degrees (0-360, where 0=N, 90=E, 180=S, 270=W)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360; // Normalize to 0-360
}

/**
 * Infer exposure from region/country strings and latitude
 */
export function inferExposure(
  region: string,
  country: string,
  lat: number
): Exposure {
  const combined = `${region} ${country}`.toLowerCase();

  // Gulf Coast - spots facing south into Gulf of Mexico
  if (combined.includes('gulf coast') || combined.includes('gulf of mexico')) {
    return 'gulf';
  }

  // Caribbean - spots facing east/southeast
  if (combined.includes('caribbean')) {
    return 'caribbean';
  }

  // Atlantic / East Coast
  if (
    combined.includes('atlantic') ||
    combined.includes('east coast') ||
    combined.includes('south east') ||
    combined.includes('north east')
  ) {
    return 'atlantic';
  }

  // Pacific / West Coast
  if (
    combined.includes('pacific') ||
    combined.includes('west coast') ||
    combined.includes('north west')
  ) {
    return 'pacific';
  }

  // Hawaii - use latitude to determine north vs south shore
  if (combined.includes('hawaii')) {
    // North shores of Hawaiian islands are roughly above lat 21.5
    // Kauai north shore (Hanalei): ~22.2
    // Oahu north shore (Pipeline): ~21.67
    // Maui north shore: ~20.9 (lower, but still north-facing)
    // Use 21.0 as cutoff for better coverage
    if (lat > 21.0) {
      return 'north'; // North shore - NW swells
    } else {
      return 'south'; // South shore - S swells
    }
  }

  // California - most spots face west/southwest
  if (combined.includes('california')) {
    return 'pacific';
  }

  // Oregon / Washington - face west
  if (combined.includes('oregon') || combined.includes('washington')) {
    return 'pacific';
  }

  // Florida - check for specific coasts
  if (combined.includes('florida')) {
    if (combined.includes('east') || combined.includes('atlantic')) {
      return 'atlantic';
    }
    if (combined.includes('gulf') || combined.includes('west')) {
      return 'gulf';
    }
    // Default Florida to Atlantic (more surf spots on east coast)
    return 'atlantic';
  }

  // Mexico - check for Pacific vs Caribbean/Gulf
  if (combined.includes('mexico')) {
    if (combined.includes('pacific') || combined.includes('baja')) {
      return 'pacific';
    }
    if (combined.includes('caribbean') || combined.includes('yucatan')) {
      return 'caribbean';
    }
    // Default to Pacific for Mexico (more prominent surf)
    return 'pacific';
  }

  // Central America
  if (
    combined.includes('costa rica') ||
    combined.includes('nicaragua') ||
    combined.includes('panama') ||
    combined.includes('el salvador') ||
    combined.includes('guatemala')
  ) {
    if (combined.includes('caribbean')) {
      return 'caribbean';
    }
    return 'pacific'; // Most Central American surf is Pacific-facing
  }

  // Canada
  if (combined.includes('canada')) {
    if (combined.includes('west') || combined.includes('british columbia')) {
      return 'pacific';
    }
    if (combined.includes('east') || combined.includes('nova scotia')) {
      return 'atlantic';
    }
  }

  return 'unknown';
}

/**
 * Get the preferred bearing range for an exposure type
 * Returns [min, max] in degrees where buoys should ideally be located
 */
function getPreferredBearingRange(exposure: Exposure): [number, number] | null {
  switch (exposure) {
    case 'gulf':
      // Gulf spots face south - prefer buoys to the south (135-225°)
      return [135, 225];
    case 'atlantic':
      // Atlantic spots face east - prefer buoys to the east (45-135°)
      return [45, 135];
    case 'pacific':
      // Pacific spots face west - prefer buoys to the west/northwest (225-315°)
      return [225, 315];
    case 'caribbean':
      // Caribbean spots face east/southeast - prefer buoys to the east (45-135°)
      return [45, 135];
    case 'north':
      // North-facing (Hawaii north shore) - prefer buoys to the north/northwest (270-360 or 0-45)
      // This wraps around 0°, handled specially in scoring
      return [270, 45]; // Special case: wraps around north
    case 'south':
      // South-facing (Hawaii south shore) - prefer buoys to the south (135-225°)
      return [135, 225];
    default:
      return null;
  }
}

/**
 * Calculate how well a bearing matches the preferred range
 * @returns Score from 0 to 1 (1 = perfect match, decays with angular distance)
 */
function calculateBearingScore(
  bearing: number,
  preferredRange: [number, number] | null
): number {
  if (!preferredRange) {
    return 0.5; // Neutral score if no preference
  }

  const [min, max] = preferredRange;

  // Handle wrap-around case (north-facing: 270-45)
  if (min > max) {
    // Bearing is in range if >= min OR <= max
    if (bearing >= min || bearing <= max) {
      return 1.0;
    }
    // Calculate distance to nearest edge
    const distToMin = Math.min(Math.abs(bearing - min), 360 - Math.abs(bearing - min));
    const distToMax = Math.min(Math.abs(bearing - max), 360 - Math.abs(bearing - max));
    const minDist = Math.min(distToMin, distToMax);
    // Decay score based on angular distance (90° = 0.5, 180° = 0)
    return Math.max(0, 1 - minDist / 90);
  }

  // Normal case: min < max
  if (bearing >= min && bearing <= max) {
    return 1.0; // Perfect match
  }

  // Calculate angular distance to range
  const distToMin = Math.abs(bearing - min);
  const distToMax = Math.abs(bearing - max);
  const minDist = Math.min(distToMin, distToMax);

  // Decay score based on angular distance (90° away = 0.5, 180° away = 0)
  return Math.max(0, 1 - minDist / 90);
}

/**
 * Calculate proximity score (closer = higher score)
 * @returns Score from 0 to 1
 */
function calculateProximityScore(distance: number, maxDistance: number): number {
  if (distance <= 0) return 1.0;
  if (distance >= maxDistance) return 0;
  // Linear decay
  return 1 - distance / maxDistance;
}

/**
 * Get recommended buoys for a spot using exposure-weighted scoring
 * Shows all buoys but ranks those in the swell path higher
 */
export function getRecommendedBuoysWithScoring(
  lat: number,
  lon: number,
  region: string = '',
  country: string = '',
  maxDistance: number = 500,
  limit: number = 10
): BuoyRecommendation[] {
  // Infer exposure from region/country
  const exposure = inferExposure(region, country, lat);
  const preferredRange = getPreferredBearingRange(exposure);

  // Calculate scores for all buoys
  const recommendations: BuoyRecommendation[] = NOAA_BUOYS.map((buoy) => {
    const distance = calculateDistance(lat, lon, buoy.lat, buoy.lon);
    const bearing = calculateBearing(lat, lon, buoy.lat, buoy.lon);
    const swellPathScore = calculateBearingScore(bearing, preferredRange);
    const proximityScore = calculateProximityScore(distance, maxDistance);

    // Combined score: 60% swell path, 40% proximity
    const combinedScore = swellPathScore * 0.6 + proximityScore * 0.4;

    return {
      ...buoy,
      distance,
      bearing,
      swellPathScore,
      combinedScore,
    };
  });

  // Filter by max distance and sort by combined score (highest first)
  return recommendations
    .filter((b) => b.distance <= maxDistance)
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit);
}

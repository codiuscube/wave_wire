/**
 * NOAA CO-OPS Tide Station Reference Data
 * Source: https://tidesandcurrents.noaa.gov/tide_predictions.html
 *
 * Used to find nearest tide station for surf spots
 */

import { calculateDistance } from './noaaBuoys';

export interface TideStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  region: string;
}

export const TIDE_STATIONS: TideStation[] = [
  // California - San Diego County
  { id: "9410230", name: "La Jolla", lat: 32.8669, lon: -117.2571, region: "San Diego" },
  { id: "9410170", name: "San Diego", lat: 32.7142, lon: -117.1736, region: "San Diego" },
  { id: "9410120", name: "Point Loma", lat: 32.6667, lon: -117.2417, region: "San Diego" },
  { id: "9410660", name: "Los Angeles", lat: 33.72, lon: -118.2717, region: "Los Angeles" },
  { id: "9410840", name: "Santa Monica", lat: 34.0083, lon: -118.5, region: "Los Angeles" },
  { id: "9410580", name: "Newport Bay Entrance", lat: 33.6033, lon: -117.8833, region: "Orange County" },
  { id: "9410680", name: "Long Beach", lat: 33.7517, lon: -118.2267, region: "Los Angeles" },

  // California - Orange County / North San Diego
  { id: "9410500", name: "Dana Point Harbor", lat: 33.4617, lon: -117.6967, region: "Orange County" },
  { id: "9410370", name: "Oceanside Harbor", lat: 33.21, lon: -117.395, region: "San Diego" },

  // California - Central Coast
  { id: "9412110", name: "Port San Luis", lat: 35.1767, lon: -120.76, region: "Central California" },
  { id: "9413450", name: "Monterey", lat: 36.605, lon: -121.8883, region: "Central California" },
  { id: "9414290", name: "San Francisco", lat: 37.8067, lon: -122.465, region: "San Francisco Bay" },
  { id: "9414750", name: "Alameda", lat: 37.7717, lon: -122.2983, region: "San Francisco Bay" },

  // California - Northern
  { id: "9415020", name: "Point Reyes", lat: 37.9961, lon: -122.9767, region: "Northern California" },
  { id: "9416841", name: "Arena Cove", lat: 38.9133, lon: -123.71, region: "Northern California" },
  { id: "9418767", name: "North Spit", lat: 40.7667, lon: -124.2167, region: "Northern California" },

  // Texas - Gulf Coast
  { id: "8775870", name: "Corpus Christi", lat: 27.58, lon: -97.2167, region: "Texas" },
  { id: "8775241", name: "Port Aransas", lat: 27.8367, lon: -97.0733, region: "Texas" },
  { id: "8773037", name: "Seadrift", lat: 28.4067, lon: -96.7117, region: "Texas" },
  { id: "8771450", name: "Galveston Pier 21", lat: 29.31, lon: -94.7933, region: "Texas" },
  { id: "8771341", name: "Galveston Bay Entrance", lat: 29.3575, lon: -94.725, region: "Texas" },
  { id: "8770613", name: "Morgans Point", lat: 29.6817, lon: -94.985, region: "Texas" },
  { id: "8770570", name: "Sabine Pass", lat: 29.7283, lon: -93.87, region: "Texas" },
  { id: "8779770", name: "Port Isabel", lat: 26.0617, lon: -97.215, region: "Texas" },

  // Florida - Atlantic
  { id: "8720218", name: "Mayport", lat: 30.3967, lon: -81.4317, region: "Florida Atlantic" },
  { id: "8721604", name: "Trident Pier", lat: 28.4158, lon: -80.5931, region: "Florida Atlantic" },
  { id: "8722670", name: "Lake Worth Pier", lat: 26.6125, lon: -80.0342, region: "Florida Atlantic" },
  { id: "8723214", name: "Virginia Key", lat: 25.7317, lon: -80.1617, region: "Florida Atlantic" },

  // Florida - Gulf
  { id: "8726520", name: "St. Petersburg", lat: 27.7606, lon: -82.6269, region: "Florida Gulf" },
  { id: "8725110", name: "Naples", lat: 26.1317, lon: -81.8075, region: "Florida Gulf" },
  { id: "8729108", name: "Panama City", lat: 30.1522, lon: -85.6672, region: "Florida Gulf" },
  { id: "8729840", name: "Pensacola", lat: 30.4044, lon: -87.2108, region: "Florida Gulf" },

  // East Coast
  { id: "8658120", name: "Wilmington", lat: 34.2267, lon: -77.9533, region: "North Carolina" },
  { id: "8656483", name: "Beaufort", lat: 34.72, lon: -76.67, region: "North Carolina" },
  { id: "8665530", name: "Charleston", lat: 32.7817, lon: -79.925, region: "South Carolina" },
  { id: "8670870", name: "Fort Pulaski", lat: 32.0333, lon: -80.9017, region: "Georgia" },

  // Mid-Atlantic
  { id: "8638863", name: "Chesapeake Bay Bridge", lat: 36.9667, lon: -76.1133, region: "Virginia" },
  { id: "8534720", name: "Atlantic City", lat: 39.355, lon: -74.4183, region: "New Jersey" },
  { id: "8518750", name: "The Battery", lat: 40.7006, lon: -74.0142, region: "New York" },
  { id: "8516945", name: "Kings Point", lat: 40.8103, lon: -73.7649, region: "New York" },
  { id: "8510560", name: "Montauk", lat: 41.0483, lon: -71.96, region: "New York" },

  // New England
  { id: "8447930", name: "Woods Hole", lat: 41.5233, lon: -70.6717, region: "Massachusetts" },
  { id: "8443970", name: "Boston", lat: 42.3539, lon: -71.0503, region: "Massachusetts" },

  // Hawaii
  { id: "1612340", name: "Honolulu", lat: 21.3067, lon: -157.8667, region: "Hawaii" },
  { id: "1615680", name: "Kahului", lat: 20.895, lon: -156.4767, region: "Hawaii" },
  { id: "1617760", name: "Hilo", lat: 19.7303, lon: -155.0656, region: "Hawaii" },

  // Oregon
  { id: "9432780", name: "Charleston", lat: 43.345, lon: -124.3217, region: "Oregon" },
  { id: "9435380", name: "South Beach", lat: 44.625, lon: -124.0433, region: "Oregon" },
  { id: "9439040", name: "Astoria", lat: 46.2073, lon: -123.7683, region: "Oregon" },

  // Washington
  { id: "9441102", name: "Westport", lat: 46.9043, lon: -124.1047, region: "Washington" },
  { id: "9447130", name: "Seattle", lat: 47.6026, lon: -122.3393, region: "Washington" },
];

/**
 * Find the nearest tide station to a given coordinate
 */
export function findNearestTideStation(
  lat: number,
  lon: number
): { station: TideStation; distance: number } | null {
  let nearest: TideStation | null = null;
  let minDistance = Infinity;

  for (const station of TIDE_STATIONS) {
    const distance = calculateDistance(lat, lon, station.lat, station.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = station;
    }
  }

  if (!nearest) return null;
  return { station: nearest, distance: minDistance };
}

export interface TideStationWithDistance extends TideStation {
  distance: number;
}

/**
 * Get recommended tide stations for a spot, sorted by distance
 */
export function getRecommendedTideStations(
  lat: number,
  lon: number,
  maxDistance: number = 100,
  limit: number = 5
): TideStationWithDistance[] {
  const stationsWithDistance: TideStationWithDistance[] = TIDE_STATIONS.map((station) => ({
    ...station,
    distance: calculateDistance(lat, lon, station.lat, station.lon),
  }));

  return stationsWithDistance
    .filter((s) => s.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

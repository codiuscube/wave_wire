const https = require('https');
const fs = require('fs');
const path = require('path');

const GIST_URL = 'https://gist.githubusercontent.com/naotokui/01c384bf58ca43261eafe6a5e2ad6e85/raw';

const COUNTRY_GROUPS = {
  'USA': ['USA'],
  'Mexico': ['Mexico'],
  'Central America': ['Costa Rica', 'Nicaragua', 'Panama', 'Guatemala', 'El Salvador', 'Honduras', 'Belize'],
  'Canada': ['Canada']
};

function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseRegion(country) {
  const parts = country.split(', ');
  const mainCountry = parts[0].trim();

  // Determine country group
  let countryGroup = 'USA';
  for (const [group, countries] of Object.entries(COUNTRY_GROUPS)) {
    if (countries.some(c => mainCountry.startsWith(c))) {
      countryGroup = group;
      break;
    }
  }

  // Extract region
  let region = '';
  if (mainCountry === 'USA' && parts.length >= 3) {
    const state = parts[parts.length - 1];
    const subRegion = parts.slice(1, -1).join(' ');
    region = subRegion ? `${state} ${subRegion}` : state;
  } else if (parts.length > 1) {
    region = parts.slice(1).join(', ');
  } else {
    region = mainCountry;
  }

  return { countryGroup, region };
}

function generateId(name, lat, lon) {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const latStr = lat.toFixed(2).replace('.', '').replace('-', 's');
  const lonStr = Math.abs(lon).toFixed(2).replace('.', '') + (lon < 0 ? 'w' : 'e');
  return `${slug}-${latStr}-${lonStr}`;
}

async function main() {
  console.log('Fetching surf spots data...');
  const spots = await fetchData(GIST_URL);
  console.log(`Total spots in gist: ${spots.length}`);

  // Flatten country list for filtering
  const includedCountries = Object.values(COUNTRY_GROUPS).flat();

  // Filter and transform spots
  const transformed = [];
  for (const spot of spots) {
    const mainCountry = spot.country.split(',')[0].trim();
    const isIncluded = includedCountries.some(c => mainCountry.startsWith(c));
    if (!isIncluded) continue;

    const lat = parseFloat(spot.lat);
    const lon = parseFloat(spot.lng);
    const { countryGroup, region } = parseRegion(spot.country);
    const id = generateId(spot.name, lat, lon);

    transformed.push({
      id,
      name: spot.name,
      lat,
      lon,
      region,
      countryGroup,
      country: spot.country
    });
  }

  // Remove duplicates by id
  const spotMap = new Map();
  for (const spot of transformed) {
    if (!spotMap.has(spot.id)) {
      spotMap.set(spot.id, spot);
    }
  }
  const uniqueSpots = Array.from(spotMap.values());

  // Sort by country group then name
  const groupOrder = ['USA', 'Mexico', 'Central America', 'Canada'];
  uniqueSpots.sort((a, b) => {
    const aOrder = groupOrder.indexOf(a.countryGroup);
    const bOrder = groupOrder.indexOf(b.countryGroup);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });

  // Count by group
  const counts = {};
  for (const group of groupOrder) {
    counts[group] = uniqueSpots.filter(s => s.countryGroup === group).length;
  }

  console.log('Spot counts by group:');
  console.log(JSON.stringify(counts, null, 2));
  console.log(`Total unique spots: ${uniqueSpots.length}`);

  // Generate JSON data file
  const spotsData = uniqueSpots.map(s => ({
    ...s,
    verified: true,
    source: 'official'
  }));

  const jsonPath = path.join(__dirname, '../src/data/surfSpots.json');
  fs.writeFileSync(jsonPath, JSON.stringify(spotsData, null, 2));
  console.log(`\nWritten JSON to: ${jsonPath}`);

  // Generate TypeScript file content
  const tsContent = `/**
 * Surf Spots Database
 * Generated from: ${GIST_URL}
 *
 * Total spots: ${uniqueSpots.length}
 * - USA: ${counts['USA']}
 * - Mexico: ${counts['Mexico']}
 * - Central America: ${counts['Central America']}
 * - Canada: ${counts['Canada']}
 */

import { findNearestBuoy } from './noaaBuoys';
import spotsData from './surfSpots.json';

export type CountryGroup = 'USA' | 'Mexico' | 'Central America' | 'Canada';

export interface SurfSpot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  region: string;
  countryGroup: CountryGroup;
  country: string;
  buoyId?: string;
  buoyName?: string;
  verified: boolean;
  source: 'official' | 'community' | 'user';
}

export const COUNTRY_GROUPS: Record<CountryGroup, string[]> = {
  'USA': ['USA'],
  'Mexico': ['Mexico'],
  'Central America': ['Costa Rica', 'Nicaragua', 'Panama', 'Guatemala', 'El Salvador', 'Honduras', 'Belize'],
  'Canada': ['Canada']
};

export const COUNTRY_GROUP_LABELS: Record<CountryGroup, { label: string; flag: string; count: number }> = {
  'USA': { label: 'USA', flag: '🇺🇸', count: ${counts['USA']} },
  'Mexico': { label: 'Mexico', flag: '🇲🇽', count: ${counts['Mexico']} },
  'Central America': { label: 'Central America', flag: '🌎', count: ${counts['Central America']} },
  'Canada': { label: 'Canada', flag: '🇨🇦', count: ${counts['Canada']} }
};

// Raw spot data without buoy assignments (loaded from JSON)
const RAW_SPOTS = spotsData as Omit<SurfSpot, 'buoyId' | 'buoyName'>[];

// Add nearest buoy to each spot (calculated on first access)
let _spotsWithBuoys: SurfSpot[] | null = null;

export function getSurfSpots(): SurfSpot[] {
  if (_spotsWithBuoys) return _spotsWithBuoys;

  _spotsWithBuoys = RAW_SPOTS.map(spot => {
    const result = findNearestBuoy(spot.lat, spot.lon);
    return {
      ...spot,
      buoyId: result?.buoy.id,
      buoyName: result?.buoy.name
    };
  });

  return _spotsWithBuoys;
}

// For direct import without buoy calculation
export const SURF_SPOTS_RAW = RAW_SPOTS;

// Alias for backwards compatibility
export const SURF_SPOTS = getSurfSpots;
`;

  // Write TypeScript file
  const outputPath = path.join(__dirname, '../src/data/surfSpots.ts');
  fs.writeFileSync(outputPath, tsContent);
  console.log(`Written TS to: ${outputPath}`);
}

main().catch(console.error);

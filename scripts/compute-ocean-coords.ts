/**
 * Compute Ocean Coordinates for Surf Spots
 *
 * This script calculates offshore coordinates for each spot that will hit
 * valid ocean grid points for coarse-resolution wave models (like GFS).
 *
 * Strategy:
 * 1. Get the spot's swell direction window (which direction the ocean is)
 * 2. Calculate the center bearing of that window
 * 3. Nudge coordinates in that direction by increasing amounts
 * 4. Test each position with the GFS model until we get valid data
 * 5. Save the first valid ocean coordinates to the database
 *
 * Usage: npx tsx compute-ocean-coords.ts [--dry-run]
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load .env from frontend directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env') });

import { createClient } from '@supabase/supabase-js';

// Types
interface Spot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  region: string | null;
  country: string | null;
  ocean_lat: number | null;
  ocean_lon: number | null;
}

interface MarineApiResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  hourly: {
    wave_height: number[];
  };
}

// Exposure types matching frontend/src/data/noaaBuoys.ts
type Exposure = 'gulf' | 'atlantic' | 'pacific' | 'caribbean' | 'north' | 'south' | 'unknown';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Infer the coastal exposure from region/country
 * Simplified version of frontend/src/data/noaaBuoys.ts inferExposure
 */
function inferExposure(region: string | null, country: string | null, lat: number): Exposure {
  const combined = `${region || ''} ${country || ''}`.toLowerCase();

  if (combined.includes('gulf') || combined.includes('texas') || combined.includes('louisiana') ||
      combined.includes('alabama') || combined.includes('mississippi')) {
    return 'gulf';
  }

  if (combined.includes('caribbean')) {
    return 'caribbean';
  }

  if (combined.includes('atlantic') || combined.includes('east coast') ||
      combined.includes('south east') || combined.includes('north east') ||
      combined.includes('florida') || combined.includes('georgia') ||
      combined.includes('carolina') || combined.includes('virginia') ||
      combined.includes('new york') || combined.includes('new jersey') ||
      combined.includes('massachusetts') || combined.includes('rhode island')) {
    return 'atlantic';
  }

  if (combined.includes('pacific') || combined.includes('west coast') ||
      combined.includes('california') || combined.includes('oregon') ||
      combined.includes('washington') || combined.includes('baja')) {
    return 'pacific';
  }

  if (combined.includes('hawaii')) {
    // North shores are roughly above lat 21.0
    return lat > 21.0 ? 'north' : 'south';
  }

  // Default: try to guess from longitude
  // West of -100 is likely Pacific facing
  // East of -80 is likely Atlantic facing
  return 'unknown';
}

/**
 * Get the offshore direction (center of swell window)
 * Returns the bearing in degrees (0=N, 90=E, 180=S, 270=W)
 */
function getOffshoreDirection(exposure: Exposure): number {
  switch (exposure) {
    case 'gulf':
      return 180; // Ocean is to the south
    case 'atlantic':
      return 90;  // Ocean is to the east
    case 'pacific':
      return 270; // Ocean is to the west
    case 'caribbean':
      return 90;  // Ocean is to the east
    case 'north':
      return 0;   // Ocean is to the north (Hawaii north shore)
    case 'south':
      return 180; // Ocean is to the south (Hawaii south shore)
    default:
      return 270; // Default to west (most common for US)
  }
}

/**
 * Calculate new coordinates given a starting point, bearing, and distance
 * @param lat Starting latitude
 * @param lon Starting longitude
 * @param bearing Direction in degrees (0=N, 90=E, 180=S, 270=W)
 * @param distanceKm Distance in kilometers
 */
function moveCoordinate(lat: number, lon: number, bearing: number, distanceKm: number): [number, number] {
  const R = 6371; // Earth's radius in km
  const d = distanceKm / R;
  const brng = (bearing * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI];
}

/**
 * Test if coordinates return valid wave data from the GFS model
 */
async function testCoordinates(lat: number, lon: number): Promise<{ valid: boolean; elevation: number; waveHeight: number }> {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height&models=ncep_gfswave025&forecast_days=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { valid: false, elevation: -1, waveHeight: 0 };
    }

    const data = await response.json() as MarineApiResponse;
    const elevation = data.elevation || 0;
    const waveHeight = data.hourly?.wave_height?.[0] || 0;

    // Valid if elevation is 0 (ocean) and wave height is non-zero
    const valid = elevation === 0 && waveHeight > 0;

    return { valid, elevation, waveHeight };
  } catch (error) {
    console.error(`  Error testing ${lat}, ${lon}:`, error);
    return { valid: false, elevation: -1, waveHeight: 0 };
  }
}

/**
 * Find valid ocean coordinates for a spot
 */
async function findOceanCoordinates(spot: Spot): Promise<[number, number] | null> {
  const exposure = inferExposure(spot.region, spot.country, spot.lat);
  const offshoreDirection = getOffshoreDirection(exposure);

  console.log(`  Exposure: ${exposure}, Offshore direction: ${offshoreDirection}°`);

  // Test original coordinates first
  const originalTest = await testCoordinates(spot.lat, spot.lon);
  if (originalTest.valid) {
    console.log(`  Original coords valid! Elevation: ${originalTest.elevation}, Wave: ${originalTest.waveHeight}m`);
    return [spot.lat, spot.lon];
  }
  console.log(`  Original coords: Elevation ${originalTest.elevation}m, Wave ${originalTest.waveHeight}m (invalid)`);

  // Try nudging in the offshore direction at increasing distances
  const distances = [5, 10, 15, 20, 25, 30, 40, 50]; // km

  for (const distance of distances) {
    const [newLat, newLon] = moveCoordinate(spot.lat, spot.lon, offshoreDirection, distance);
    const test = await testCoordinates(newLat, newLon);

    if (test.valid) {
      console.log(`  Found valid at ${distance}km offshore: (${newLat.toFixed(4)}, ${newLon.toFixed(4)}) Wave: ${test.waveHeight}m`);
      return [newLat, newLon];
    }
    console.log(`  ${distance}km: Elevation ${test.elevation}m, Wave ${test.waveHeight}m`);

    // Rate limit: wait 100ms between API calls
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // If primary direction didn't work, try adjacent directions
  const adjacentDirections = [
    (offshoreDirection + 45) % 360,
    (offshoreDirection - 45 + 360) % 360,
  ];

  for (const direction of adjacentDirections) {
    console.log(`  Trying adjacent direction: ${direction}°`);
    for (const distance of [15, 25, 40]) {
      const [newLat, newLon] = moveCoordinate(spot.lat, spot.lon, direction, distance);
      const test = await testCoordinates(newLat, newLon);

      if (test.valid) {
        console.log(`  Found valid at ${distance}km, ${direction}°: (${newLat.toFixed(4)}, ${newLon.toFixed(4)})`);
        return [newLat, newLon];
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`  Could not find valid ocean coordinates`);
  return null;
}

/**
 * Main function
 */
interface OceanCoordsResult {
  id: string;
  name: string;
  table: string;
  originalLat: number;
  originalLon: number;
  oceanLat: number;
  oceanLon: number;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const saveResults = process.argv.includes('--save');

  console.log('='.repeat(60));
  console.log('Computing Ocean Coordinates for Surf Spots');
  console.log(dryRun ? '(DRY RUN - no database updates)' : '(LIVE - will update database)');
  if (saveResults) console.log('(SAVING results to ocean-coords-results.json)');
  console.log('='.repeat(60));
  console.log('');

  const results: OceanCoordsResult[] = [];

  // Fetch all surf_spots
  const { data: surfSpots, error: surfError } = await supabase
    .from('surf_spots')
    .select('id, name, lat, lon, region, country, ocean_lat, ocean_lon')
    .order('name');

  if (surfError) {
    console.error('Error fetching surf_spots:', surfError);
    process.exit(1);
  }

  // Fetch all user_spots (uses latitude/longitude instead of lat/lon)
  const { data: userSpots, error: userError } = await supabase
    .from('user_spots')
    .select('id, name, latitude, longitude, region, ocean_lat, ocean_lon')
    .order('name');

  if (userError) {
    console.error('Error fetching user_spots:', userError);
    process.exit(1);
  }

  const allSpots = [
    ...(surfSpots || []).map(s => ({ ...s, table: 'surf_spots' })),
    // Normalize user_spots to use lat/lon like surf_spots
    ...(userSpots || []).map(s => ({
      ...s,
      lat: s.latitude,
      lon: s.longitude,
      country: null, // user_spots doesn't have country field
      table: 'user_spots'
    })),
  ];

  console.log(`Found ${surfSpots?.length || 0} surf_spots and ${userSpots?.length || 0} user_spots`);
  console.log('');

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const spot of allSpots) {
    // Skip if already has ocean coordinates
    if (spot.ocean_lat !== null && spot.ocean_lon !== null) {
      console.log(`[${spot.table}] ${spot.name}: Already has ocean coords, skipping`);
      skipped++;
      continue;
    }

    // Skip if missing lat/lon
    if (spot.lat === null || spot.lon === null) {
      console.log(`[${spot.table}] ${spot.name}: Missing lat/lon, skipping`);
      skipped++;
      continue;
    }

    console.log(`[${spot.table}] ${spot.name} (${spot.lat}, ${spot.lon}):`);

    const oceanCoords = await findOceanCoordinates(spot as Spot);

    if (oceanCoords) {
      const [oceanLat, oceanLon] = oceanCoords;

      // Save to results array for JSON export
      results.push({
        id: spot.id,
        name: spot.name,
        table: spot.table,
        originalLat: spot.lat,
        originalLon: spot.lon,
        oceanLat,
        oceanLon,
      });

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from(spot.table)
          .update({ ocean_lat: oceanLat, ocean_lon: oceanLon })
          .eq('id', spot.id);

        if (updateError) {
          console.error(`  Error updating: ${updateError.message}`);
          failed++;
        } else {
          console.log(`  Updated: (${oceanLat.toFixed(4)}, ${oceanLon.toFixed(4)})`);
          updated++;
        }
      } else {
        console.log(`  Would update to: (${oceanLat.toFixed(4)}, ${oceanLon.toFixed(4)})`);
        updated++;
      }
    } else {
      failed++;
    }

    console.log('');
  }

  // Save results to JSON if requested
  if (saveResults && results.length > 0) {
    const fs = await import('fs');
    const outputPath = path.resolve(__dirname, 'ocean-coords-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nSaved ${results.length} results to ${outputPath}`);
  }

  console.log('='.repeat(60));
  console.log('Summary:');
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log('='.repeat(60));
}

main().catch(console.error);

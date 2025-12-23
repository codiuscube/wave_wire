/**
 * Parse dry run output and generate ocean-coords-results.json
 * by matching spots from the database with parsed coordinates
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parsed results from dry run output
const parsedResults: { table: string; name: string; lat: number; lon: number; oceanLat: number; oceanLon: number }[] = [];

// Read input file
const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: npx tsx parse-dry-run.ts <dry-run-output.txt>');
  process.exit(1);
}

const input = fs.readFileSync(inputPath, 'utf-8');
const lines = input.split('\n');

let currentSpot: { table: string; name: string; lat: number; lon: number } | null = null;

for (const line of lines) {
  // Match: [surf_spots] Name (lat, lon):
  const spotMatch = line.match(/^\[(\w+)\] (.+?) \(([\d.-]+), ([\d.-]+)\):$/);
  if (spotMatch) {
    currentSpot = {
      table: spotMatch[1],
      name: spotMatch[2],
      lat: parseFloat(spotMatch[3]),
      lon: parseFloat(spotMatch[4]),
    };
    continue;
  }

  // Match: Would update to: (lat, lon)
  const updateMatch = line.match(/Would update to: \(([\d.-]+), ([\d.-]+)\)/);
  if (updateMatch && currentSpot) {
    parsedResults.push({
      ...currentSpot,
      oceanLat: parseFloat(updateMatch[1]),
      oceanLon: parseFloat(updateMatch[2]),
    });
    currentSpot = null;
  }
}

console.log(`Parsed ${parsedResults.length} spots from dry run output`);

async function main() {
  // Fetch all spots from DB to get IDs
  const { data: surfSpots } = await supabase
    .from('surf_spots')
    .select('id, name, lat, lon');

  const { data: userSpots } = await supabase
    .from('user_spots')
    .select('id, name, latitude, longitude');

  const results: any[] = [];

  for (const parsed of parsedResults) {
    let id: string | null = null;

    if (parsed.table === 'surf_spots') {
      const match = surfSpots?.find(s => 
        s.name === parsed.name && 
        Math.abs(s.lat - parsed.lat) < 0.0001 && 
        Math.abs(s.lon - parsed.lon) < 0.0001
      );
      if (match) id = match.id;
    } else if (parsed.table === 'user_spots') {
      const match = userSpots?.find(s => 
        s.name === parsed.name && 
        Math.abs((s.latitude || 0) - parsed.lat) < 0.0001 && 
        Math.abs((s.longitude || 0) - parsed.lon) < 0.0001
      );
      if (match) id = match.id;
    }

    if (id) {
      results.push({
        id,
        name: parsed.name,
        table: parsed.table,
        originalLat: parsed.lat,
        originalLon: parsed.lon,
        oceanLat: parsed.oceanLat,
        oceanLon: parsed.oceanLon,
      });
    } else {
      console.warn(`Could not find ID for: [${parsed.table}] ${parsed.name}`);
    }
  }

  const outputPath = path.resolve(__dirname, 'ocean-coords-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} results to ${outputPath}`);
}

main().catch(console.error);

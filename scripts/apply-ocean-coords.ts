/**
 * Apply Ocean Coordinates from JSON file
 *
 * Reads pre-computed ocean coordinates from ocean-coords-results.json
 * and applies them to the database without making any API calls.
 *
 * Usage: npx tsx apply-ocean-coords.ts [--dry-run]
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Load .env from frontend directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env') });

import { createClient } from '@supabase/supabase-js';

interface OceanCoordsResult {
  id: string;
  name: string;
  table: string;
  originalLat: number;
  originalLon: number;
  oceanLat: number;
  oceanLon: number;
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const inputPath = path.resolve(__dirname, 'ocean-coords-results.json');

  console.log('='.repeat(60));
  console.log('Applying Ocean Coordinates from JSON');
  console.log(dryRun ? '(DRY RUN - no database updates)' : '(LIVE - will update database)');
  console.log('='.repeat(60));
  console.log('');

  // Check if results file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: ${inputPath} not found.`);
    console.error('Run "npx tsx compute-ocean-coords.ts --dry-run --save" first to generate it.');
    process.exit(1);
  }

  // Read results
  const results: OceanCoordsResult[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`Found ${results.length} spots to update\n`);

  let updated = 0;
  let failed = 0;

  for (const spot of results) {
    if (dryRun) {
      console.log(`[${spot.table}] ${spot.name}: Would update to (${spot.oceanLat.toFixed(4)}, ${spot.oceanLon.toFixed(4)})`);
      updated++;
    } else {
      const { error } = await supabase
        .from(spot.table)
        .update({ ocean_lat: spot.oceanLat, ocean_lon: spot.oceanLon })
        .eq('id', spot.id);

      if (error) {
        console.error(`[${spot.table}] ${spot.name}: Error - ${error.message}`);
        failed++;
      } else {
        console.log(`[${spot.table}] ${spot.name}: Updated to (${spot.oceanLat.toFixed(4)}, ${spot.oceanLon.toFixed(4)})`);
        updated++;
      }
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Summary:');
  console.log(`  Updated: ${updated}`);
  console.log(`  Failed: ${failed}`);
  console.log('='.repeat(60));
}

main().catch(console.error);

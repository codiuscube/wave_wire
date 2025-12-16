/**
 * Migration Script: Seed surf_spots table with 1,225 spots
 *
 * Usage:
 *   npx tsx scripts/migrate-surf-spots.ts
 *
 * Environment variables:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
 *
 * Get these from: Supabase Dashboard > Settings > API
 */

import { createClient } from '@supabase/supabase-js';
import { getSurfSpots } from '../src/data/surfSpots.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('Error: SUPABASE_URL environment variable is required');
  console.error('Set it to your Supabase project URL from Dashboard > Settings > API');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Get it from: Supabase Dashboard > Settings > API > service_role key');
  console.error('');
  console.error('Run with:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-key npx tsx scripts/migrate-surf-spots.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
  console.log('Starting surf spots migration...\n');

  // Get all spots with buoy assignments, filter out any with null coordinates
  const allSpots = getSurfSpots();
  const spots = allSpots.filter(s => s.lat != null && s.lon != null);
  console.log(`Found ${allSpots.length} total spots, ${spots.length} with valid coordinates\n`);

  if (spots.length !== allSpots.length) {
    console.log(`Skipping ${allSpots.length - spots.length} spots with null lat/lon\n`);
  }

  // Check if spots already exist
  const { count, error: countError } = await supabase
    .from('surf_spots')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error checking existing spots:', countError.message);
    process.exit(1);
  }

  if (count && count > 0) {
    console.log(`Warning: surf_spots table already has ${count} records.`);
    console.log('To re-run migration, first clear the table:');
    console.log('  DELETE FROM public.surf_spots;');
    console.log('');
    const response = await new Promise<string>((resolve) => {
      process.stdout.write('Continue anyway? (y/N): ');
      process.stdin.once('data', (data) => resolve(data.toString().trim().toLowerCase()));
    });
    if (response !== 'y') {
      console.log('Migration cancelled.');
      process.exit(0);
    }
  }

  // Batch insert 100 at a time
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < spots.length; i += BATCH_SIZE) {
    const batch = spots.slice(i, i + BATCH_SIZE).map(spot => ({
      id: spot.id,
      name: spot.name,
      lat: spot.lat,
      lon: spot.lon,
      region: spot.region,
      country_group: spot.countryGroup,
      country: spot.country,
      buoy_id: spot.buoyId || null,
      buoy_name: spot.buoyName || null,
      verified: spot.verified,
      source: spot.source
    }));

    const { error } = await supabase
      .from('surf_spots')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Error inserting batch ${i}-${i + batch.length}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      process.stdout.write(`\rInserted ${inserted}/${spots.length} spots...`);
    }
  }

  console.log('\n');
  console.log('Migration complete!');
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Errors: ${errors}`);

  // Verify by country group
  const { data: summary } = await supabase
    .from('surf_spots')
    .select('country_group')
    .then(({ data }) => {
      const counts: Record<string, number> = {};
      data?.forEach(row => {
        counts[row.country_group] = (counts[row.country_group] || 0) + 1;
      });
      return { data: counts };
    });

  console.log('\nSpots by country group:');
  Object.entries(summary || {}).forEach(([group, count]) => {
    console.log(`  ${group}: ${count}`);
  });
}

migrate().catch(console.error);

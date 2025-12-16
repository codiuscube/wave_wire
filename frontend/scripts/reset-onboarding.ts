import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.error('Please run with: SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/reset-onboarding.ts');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const email = 'cody.a.iddings@gmail.com';

async function reset() {
    console.log(`Resetting onboarding for ${email}...`);

    const { data, error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: false })
        .eq('email', email)
        .select();

    if (error) {
        console.error('Error updating profile:', error.message);
    } else if (!data || data.length === 0) {
        console.log('No user found with that email.');
    } else {
        console.log('Success! Onboarding reset for:', data[0].email);
        console.log('New state:', data[0]);
    }
}

reset().catch(console.error);

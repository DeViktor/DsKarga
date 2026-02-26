const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function investigate() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        console.error('❌ Missing Supabase environment variables.');
        return;
    }

    const supabase = createClient(url, anonKey);

    console.log('--- Checking "workers" table structure ---');
    const { data, error } = await supabase.from('workers').select('*').limit(1);

    if (error) {
        console.error('❌ Error fetching from workers:', error.message);
    } else if (data && data.length > 0) {
        console.log('✅ Success! Columns found:', Object.keys(data[0]).join(', '));
        console.log('Sample row:', JSON.stringify(data[0], null, 2));

        if (!('photo_url' in data[0]) && !('photoUrl' in data[0])) {
            console.warn('⚠️ WARNING: Neither "photo_url" nor "photoUrl" column found in workers table!');
        }
    } else {
        console.log('ℹ️ Table "workers" is empty.');
    }

    console.log('\n--- Checking RLS on "workers" update ---');
    // Attempt a dummy update (will likely fail or do nothing if ID is wrong, but helps check RLS)
    const { error: updateError } = await supabase.from('workers').update({ updated_at: new Date().toISOString() }).eq('id', '999999');
    if (updateError) {
        console.log('Update error (expected if RLS or ID wrong):', updateError.message);
    } else {
        console.log('✅ Update operation accepted by API.');
    }
}

investigate();

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedPasswords() {
  console.log('Fetching all schools...');
  const { data: schools, error } = await supabase
    .from('app_data')
    .select('*')
    .eq('collection', 'schools');

  if (error) {
    console.error('Error fetching schools:', error);
    process.exit(1);
  }

  if (!schools || schools.length === 0) {
    console.log('No schools found. Checking app_data collections...');

    const { data: allCollections } = await supabase
      .from('app_data')
      .select('collection')
      .limit(100);

    const uniqueCollections = [...new Set((allCollections || []).map((r: any) => r.collection))];
    console.log('Available collections:', uniqueCollections);
    process.exit(1);
  }

  console.log(`Found ${schools.length} schools`);
  const passwordHash = hashPassword('123456');
  const now = Date.now();
  let count = 0;

  for (const school of schools) {
    const schoolData = school.data as Record<string, any>;
    const npsn = school.id || schoolData.npsn;
    if (!npsn) {
      console.warn(`  Skipping school with no NPSN: ${school.id}`);
      continue;
    }

    const schoolName = schoolData.schoolName || schoolData.nama || `Sekolah ${npsn}`;
    const { error: upsertError } = await supabase
      .from('app_data')
      .upsert({
        id: String(npsn),
        collection: 'school_passwords',
        data: {
          npsn: String(npsn),
          schoolName,
          passwordHash,
          createdAt: now,
          updatedAt: now,
        },
      });

    if (upsertError) {
      console.error(`  Error seeding ${npsn} (${schoolName}):`, upsertError.message);
    } else {
      count++;
    }
  }

  console.log(`\nDone! Seeded ${count} / ${schools.length} schools with password: 123456`);
}

seedPasswords();

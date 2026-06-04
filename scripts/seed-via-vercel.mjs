import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Fetching schools...');
  const { data: schools, error } = await supabase
    .from('app_data')
    .select('*')
    .eq('collection', 'schools');

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Found ${schools?.length || 0} schools`);
  const passwordHash = hashPassword('123456');
  const now = Date.now();
  let count = 0;

  for (const school of schools || []) {
    const d = school.data as Record<string, any>;
    const npsn = school.id || d.npsn;
    if (!npsn) continue;
    const name = d.schoolName || d.nama || '';
    const { error: upsertError } = await supabase.from('app_data').upsert({
      id: String(npsn),
      collection: 'school_passwords',
      data: { npsn: String(npsn), schoolName: name, passwordHash, createdAt: now, updatedAt: now },
    });
    if (!upsertError) count++;
    else console.error(`  Error ${npsn}:`, upsertError.message);
  }

  console.log(`Done! ${count}/${schools?.length || 0} seeded`);
}

main();

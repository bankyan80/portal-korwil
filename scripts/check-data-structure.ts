async function query(supabaseAdmin: any, collection: string, limit: number) {
  console.log(`\n=== ${collection} (limit ${limit}) ===`);
  const { data, error } = await supabaseAdmin!
    .from('app_data')
    .select('id, data')
    .eq('collection', collection)
    .limit(limit);

  if (error) {
    console.error(`Error querying ${collection}:`, error);
    return;
  }

  for (const row of data) {
    console.log(`id: ${row.id}`);
    console.log(JSON.stringify(row.data, null, 2));
    console.log('---');
  }
}

async function main() {
  const { supabaseAdmin } = await import('../src/lib/supabase-admin');
  console.log('supabaseAdmin is null:', supabaseAdmin === null);
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

  await query(supabaseAdmin, 'employees', 3);
  await query(supabaseAdmin, 'students', 3);
  await query(supabaseAdmin, 'schools', 5);

  console.log('\n=== All unique schoolId/sekolahId from employees ===');
  const { data: empData, error: empError } = await supabaseAdmin!
    .from('app_data')
    .select('data')
    .eq('collection', 'employees');

  if (empError) {
    console.error('Error querying employees for schoolId:', empError);
    return;
  }

  const schoolIds = new Set<string>();
  for (const row of empData) {
    const d = row.data as Record<string, unknown>;
    if (d && typeof d.schoolId === 'string') {
      schoolIds.add(d.schoolId);
    }
    if (d && typeof d.sekolahId === 'string') {
      schoolIds.add(d.sekolahId);
    }
  }

  console.log(JSON.stringify([...schoolIds].sort(), null, 2));
  console.log(`Total unique schoolId/sekolahId values: ${schoolIds.size}`);
}

main().catch(console.error);

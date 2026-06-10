import { supabaseAdmin } from '../src/lib/supabase-admin';

async function main() {
  if (!supabaseAdmin) {
    console.error('supabaseAdmin is null — check env vars');
    process.exit(1);
  }

  const counts: Record<string, number> = {};
  let from = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin
      .from('app_data')
      .select('collection')
      .not('collection', 'is', null)
      .range(from, from + limit - 1);

    if (error) {
      console.error('Query error:', error);
      process.exit(1);
    }

    for (const row of data) {
      const c = row.collection as string;
      counts[c] = (counts[c] || 0) + 1;
    }

    hasMore = data.length === limit;
    from += limit;
  }

  const entries = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  console.log('Collection counts in app_data:');
  console.log('');
  for (const [col, cnt] of entries) {
    console.log(`  ${col.padEnd(25)} ${cnt}`);
  }
  console.log('');
  console.log(`Total collections: ${entries.length}`);
  console.log(`Total rows:        ${entries.reduce((s, [, c]) => s + c, 0)}`);
}

main();

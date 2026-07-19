const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('c:\\xampp\\htdocs\\ExtintoresApp\\.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log("Fetching MP and SKU...");
  const { data: mps } = await supabase.from('stock_mp').select('id');
  const { data: skus } = await supabase.from('skus').select('id');
  
  const validMpIds = new Set(mps.map(m => m.id));
  const validSkuIds = new Set(skus.map(s => s.id));

  console.log("Fetching reposicion_items...");
  const { data: items } = await supabase.from('reposicion_items').select('*');

  let orphanedReposicionIds = new Set();
  
  for (const item of items) {
    if (item.tipo_entidad === 'MP' && !validMpIds.has(item.entidad_id)) {
      orphanedReposicionIds.add(item.reposicion_id);
    }
    if (item.tipo_entidad === 'SKU' && !validSkuIds.has(item.entidad_id)) {
      orphanedReposicionIds.add(item.reposicion_id);
    }
  }

  console.log(`Found ${orphanedReposicionIds.size} orphaned reposiciones.`);

  for (const repId of orphanedReposicionIds) {
    console.log(`Deleting reposicion ${repId}`);
    await supabase.from('reposiciones').delete().eq('id', repId);
  }
  console.log("Done.");
}
run();

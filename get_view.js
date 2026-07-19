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
  const { data, error } = await supabase.from('vendedores').select('*').ilike('nombre', '%Santiago%');
  if (data) {
    for (const v of data) {
      if (v.id !== '12431e80-fe91-4a79-978c-ec784df7565c' && v.id !== '310eb21d-6859-4648-bbae-14a663afb25a') {
        console.log("Deleting id:", v.id);
        await supabase.from('vendedores').delete().eq('id', v.id);
      }
    }
  }
}
run();

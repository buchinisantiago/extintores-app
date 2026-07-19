const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('c:\\xampp\\htdocs\\ExtintoresApp\\.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('vendedores').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Vendedores schema:", Object.keys(data[0] || {}));
  }
}
run();

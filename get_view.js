const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('c:\\xampp\\htdocs\\ExtintoresApp\\.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const sql = `
    DROP FUNCTION IF EXISTS crear_venta(uuid, numeric, jsonb);
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
  if (error) {
    // If exec_sql doesn't exist, we can't run raw SQL from client directly without an RPC.
    console.error("RPC error:", error);
  } else {
    console.log("Success:", data);
  }
}
run();

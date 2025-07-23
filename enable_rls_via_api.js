// Enable RLS via Supabase REST API
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: supabaseUrl.replace('https://', '').replace('http://', ''),
      port: 443,
      path: '/rest/v1/rpc/sql_query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function enableRLS() {
  console.log('🔧 Attempting to enable RLS via API...');
  
  try {
    // Try Method 1: Direct SQL execution
    console.log('\n📋 Method 1: Direct SQL via RPC...');
    
    const sqlCommands = [
      'ALTER TABLE projects ENABLE ROW LEVEL SECURITY;',
      `CREATE POLICY "users_own_projects" ON projects FOR ALL USING (auth.uid()::text = created_by::text) WITH CHECK (auth.uid()::text = created_by::text);`,
      'GRANT ALL ON projects TO authenticated;',
      'GRANT ALL ON projects TO service_role;'
    ];
    
    for (const sql of sqlCommands) {
      try {
        console.log(`Executing: ${sql.substring(0, 50)}...`);
        const result = await executeSQL(sql);
        console.log('✅ Success:', result);
      } catch (error) {
        console.log('❌ Failed:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ API method failed:', error.message);
    
    // Try Method 2: Using curl command
    console.log('\n📋 Method 2: Using curl command...');
    console.log('Please run these commands manually:');
    console.log('');
    console.log(`curl -X POST "${supabaseUrl}/rest/v1/rpc/sql_query" \\`);
    console.log(`  -H "Authorization: Bearer ${supabaseServiceKey}" \\`);
    console.log(`  -H "apikey: ${supabaseServiceKey}" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"query": "ALTER TABLE projects ENABLE ROW LEVEL SECURITY;"}'`);
  }
}

enableRLS()
  .then(() => {
    console.log('\n✨ RLS enablement attempt completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('🚨 Failed:', error);
    process.exit(1);
  });
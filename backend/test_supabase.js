import { testSupabaseConnection, pgPool } from './src/config/supabase.js';

console.log('====================================================');
console.log('🚀 Testing Supabase Connection for UandMe...');
console.log('====================================================');

async function run() {
  const result = await testSupabaseConnection();

  console.log(`\n📡 Supabase PostgreSQL Database: ${result.postgresDb ? '✅ CONNECTED' : '❌ FAILED'}`);
  if (result.dbTime) {
    console.log(`   ⏰ Server Time:    ${result.dbTime}`);
    console.log(`   🐘 Engine Version: ${result.dbVersion}`);
  }

  console.log(`\n🔐 Supabase API / Auth:          ${result.supabaseApi ? '✅ CONNECTED' : '⚠️ NOTICE'}`);

  if (result.error) {
    console.error(`\n❌ Error Details: ${result.error}`);
  } else {
    console.log('\n🎉 Supabase database connection verified successfully!');
  }

  console.log('====================================================\n');
  await pgPool.end();
  process.exit(result.postgresDb ? 0 : 1);
}

run();

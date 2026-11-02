import { pgPool, supabaseAdmin } from '../src/config/supabase.js';

async function main() {
  if (pgPool) {
    try {
      const res = await pgPool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'contacts'
        ORDER BY ordinal_position;
      `);
      console.log('Postgres contacts columns:', res.rows);
      await pgPool.end();
      return;
    } catch (e) {
      console.error('pgPool query error:', e.message);
    }
  }

  // Fallback: Test select with supabaseAdmin
  const { data, error } = await supabaseAdmin.from('contacts').select('*').limit(1);
  console.log('Supabase contacts result:', { data, error });
}

main().catch(console.error);


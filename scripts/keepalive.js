import pg from 'pg';
const { DATABASE_URL } = process.env;

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  try {
    await pool.query('SELECT 1');
    console.log('keep-alive OK');
  } catch (e) {
    console.error('keep-alive FAIL', e);
  } finally {
    await pool.end();
  }
}
main();

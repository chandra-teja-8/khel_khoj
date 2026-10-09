import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import fs from 'fs';

async function main() {
  const dataDir = path.resolve(__dirname, '../.pgdata');
  console.log('Target data directory:', dataDir);
  const exists = fs.existsSync(dataDir);

  const PgClass = (EmbeddedPostgres as any).default || EmbeddedPostgres;
  const pg = new PgClass({
    databaseDir: dataDir,
    port: 5433,
    user: 'postgres',
    password: 'password',
    initialDatabase: 'khelkhoj',
    persistent: true
  });

  if (!exists) {
    console.log('First time setup: initialising database cluster...');
    await pg.initialise();
  }

  console.log('Starting postgres...');
  await pg.start();
  console.log('Postgres successfully started on port 5433!');

  // Test connection
  const client = pg.getPgClient();
  await client.connect();
  const res = await client.query('SELECT version();');
  console.log('PostgreSQL version:', res.rows[0].version);
  await client.end();
  await pg.stop();
  console.log('PostgreSQL cleanly stopped test.');
}

main().catch(console.error);

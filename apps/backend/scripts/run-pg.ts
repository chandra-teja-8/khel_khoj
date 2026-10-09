import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(__dirname, '../.pgdata');
const PgClass = (EmbeddedPostgres as any).default || EmbeddedPostgres;

const pg = new PgClass({
  databaseDir: dataDir,
  port: 5433,
  user: 'postgres',
  password: 'password',
  initialDatabase: 'khelkhoj',
  persistent: true
});

async function run() {
  if (!fs.existsSync(dataDir)) {
    console.log('[PostgreSQL] Initialising cluster in', dataDir);
    await pg.initialise();
  }

  console.log('[PostgreSQL] Starting on port 5433...');
  await pg.start();
  console.log('[PostgreSQL] Running and ready on postgresql://postgres:password@localhost:5433/khelkhoj');

  // Keep node process alive
  setInterval(() => {}, 60000);

  const shutdown = async () => {
    console.log('[PostgreSQL] Stopping service...');
    try {
      await pg.stop();
    } catch (e) {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

run().catch((err) => {
  console.error('[PostgreSQL Error]', err);
  process.exit(1);
});

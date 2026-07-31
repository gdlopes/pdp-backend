import dataSource from './typeOrm.migration-config';

async function runMigrations() {
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}

runMigrations().catch((error: unknown) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

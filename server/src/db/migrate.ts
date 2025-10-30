import { migrate } from 'drizzle-orm/libsql/migrator';
import { db, client } from '../config/database';

async function runMigrate() {
  console.log('⏳ Ejecutando migraciones...');
  
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  
  console.log('✅ Migraciones completadas');
  
  client.close();
  process.exit(0);
}

runMigrate().catch((err) => {
  console.error('❌ Error en migraciones:', err);
  process.exit(1);
});
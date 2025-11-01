import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';

export function iniciarBackupsAutomaticos() {
  // Backup diario a las 11:00 PM
  cron.schedule('0 23 * * *', () => {
    console.log('📦 Ejecutando backup automático programado...');
    
    exec('node backup.js create', { cwd: path.join(__dirname, '../..') }, (error) => {
      if (error) {
        console.error('❌ Error en backup automático:', error);
      } else {
        console.log('✅ Backup automático completado');
      }
    });
  });

  console.log('⏰ Backups automáticos programados: Diario a las 11:00 PM');
}
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuración
const DB_PATH = path.join(__dirname, 'data', 'inventario.db');
const BACKUP_DIR = path.join(__dirname, 'backups');
const MAX_BACKUPS = 30; // Mantener últimos 30 backups

// Crear directorio de backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Función para crear backup
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
  const date = timestamp[0];
  const time = timestamp[1].substring(0, 8);
  const backupName = `backup_${date}_${time}.db`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  // Copiar base de datos
  fs.copyFile(DB_PATH, backupPath, (err) => {
    if (err) {
      console.error('❌ Error al crear backup:', err);
      return;
    }

    console.log('✅ Backup creado exitosamente:', backupName);

    // Limpiar backups antiguos
    cleanOldBackups();
  });
}

// Función para limpiar backups antiguos
function cleanOldBackups() {
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) {
      console.error('Error al leer directorio de backups:', err);
      return;
    }

    // Filtrar solo archivos .db
    const backups = files
      .filter(f => f.endsWith('.db'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // Eliminar backups excedentes
    if (backups.length > MAX_BACKUPS) {
      const toDelete = backups.slice(MAX_BACKUPS);
      toDelete.forEach(backup => {
        fs.unlink(backup.path, (err) => {
          if (err) {
            console.error('Error al eliminar backup antiguo:', err);
          } else {
            console.log('🗑️  Backup antiguo eliminado:', backup.name);
          }
        });
      });
    }
  });
}

// Función para restaurar backup
function restoreBackup(backupName) {
  const backupPath = path.join(BACKUP_DIR, backupName);

  if (!fs.existsSync(backupPath)) {
    console.error('❌ Backup no encontrado:', backupName);
    return;
  }

  // Crear backup de seguridad antes de restaurar
  const safetyBackup = path.join(BACKUP_DIR, `pre-restore_${Date.now()}.db`);
  fs.copyFileSync(DB_PATH, safetyBackup);

  // Restaurar backup
  fs.copyFile(backupPath, DB_PATH, (err) => {
    if (err) {
      console.error('❌ Error al restaurar backup:', err);
      return;
    }

    console.log('✅ Backup restaurado exitosamente:', backupName);
    console.log('ℹ️  Backup de seguridad guardado en:', safetyBackup);
  });
}

// Función para listar backups
function listBackups() {
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) {
      console.error('Error al leer backups:', err);
      return;
    }

    const backups = files
      .filter(f => f.endsWith('.db'))
      .map(f => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          name: f,
          size: (stats.size / 1024).toFixed(2) + ' KB',
          date: stats.mtime.toLocaleString('es-GT')
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log('\n📦 BACKUPS DISPONIBLES:\n');
    console.log('═══════════════════════════════════════════════════════════');
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.name}`);
      console.log(`   Tamaño: ${backup.size} | Fecha: ${backup.date}`);
      console.log('───────────────────────────────────────────────────────────');
    });
    console.log('\n');
  });
}

// CLI
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'create':
    createBackup();
    break;
  case 'restore':
    if (!arg) {
      console.error('❌ Debes especificar el nombre del backup a restaurar');
      console.log('Uso: node backup.js restore <nombre-del-backup.db>');
    } else {
      restoreBackup(arg);
    }
    break;
  case 'list':
    listBackups();
    break;
  default:
    console.log('\n📦 SISTEMA DE BACKUPS - Hospital Regional de Huehuetenango\n');
    console.log('Uso:');
    console.log('  node backup.js create              - Crear nuevo backup');
    console.log('  node backup.js list                - Listar backups disponibles');
    console.log('  node backup.js restore <nombre>    - Restaurar un backup\n');
}
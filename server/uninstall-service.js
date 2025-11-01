const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'Hospital Inventory System',
  script: path.join(__dirname, 'dist', 'index.js')
});

svc.on('uninstall', function() {
  console.log('✅ Servicio desinstalado exitosamente');
});

console.log('🗑️  Desinstalando servicio...');
svc.uninstall();
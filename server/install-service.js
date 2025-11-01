const Service = require('node-windows').Service;
const path = require('path');

// Crear objeto de servicio
const svc = new Service({
  name: 'Hospital Inventory System',
  description: 'Sistema de Control de Inventarios - Hospital Regional de Huehuetenango',
  script: path.join(__dirname, 'dist', 'index.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    },
    {
      name: 'PORT',
      value: '3000'
    }
  ]
});

// Escuchar evento de instalación
svc.on('install', function() {
  console.log('✅ Servicio instalado exitosamente');
  console.log('▶️  Iniciando servicio...');
  svc.start();
});

svc.on('start', function() {
  console.log('✅ Servicio iniciado');
  console.log('\n═══════════════════════════════════════');
  console.log('  Sistema de Inventario Hospitalario');
  console.log('═══════════════════════════════════════');
  console.log('✅ El servicio se ejecutará automáticamente al iniciar Windows');
  console.log('🌐 Acceso: http://localhost:3000');
  console.log('═══════════════════════════════════════\n');
});

// Instalar servicio
console.log('📦 Instalando servicio de Windows...');
svc.install();
import { db } from '../config/database';
import { roles, usuarios, areas, subgrupos, estados } from './schema';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Iniciando seed de base de datos...');

  try {
    // 1. ROLES
    console.log('📝 Creando roles...');
    const rolesData = await db.insert(roles).values([
      {
        nombre: 'Admin',
        permisos: JSON.stringify(['*']), // Todos los permisos
      },
      {
        nombre: 'Inventarios',
        permisos: JSON.stringify([
          'equipos.create',
          'equipos.read',
          'equipos.update',
          'traslados.create',
          'reportes.generate',
        ]),
      },
      {
        nombre: 'Jefe Servicio',
        permisos: JSON.stringify([
          'equipos.read',
          'traslados.create',
          'reportes.generate',
        ]),
      },
      {
        nombre: 'Informatica',
        permisos: JSON.stringify([
          'equipos.read',
          'equipos.update', // Solo equipos de cómputo
        ]),
      },
      {
        nombre: 'Mantenimiento',
        permisos: JSON.stringify([
          'equipos.read',
          'bajas.create',
        ]),
      },
      {
        nombre: 'Lectura',
        permisos: JSON.stringify([
          'equipos.read',
          'reportes.view',
        ]),
      },
    ]).returning();
    console.log(`✅ ${rolesData.length} roles creados`);

    // 2. ÁREAS
    console.log('📝 Creando áreas...');
    const areasData = await db.insert(areas).values([
      { nombre: 'Administración', jefe: 'Por asignar' },
      { nombre: 'Emergencia', jefe: 'Por asignar' },
      { nombre: 'Hospitalización', jefe: 'Por asignar' },
      { nombre: 'Quirófano', jefe: 'Por asignar' },
      { nombre: 'Consulta Externa', jefe: 'Por asignar' },
      { nombre: 'Laboratorio', jefe: 'Por asignar' },
      { nombre: 'Farmacia', jefe: 'Por asignar' },
      { nombre: 'Radiología', jefe: 'Por asignar' },
      { nombre: 'Mantenimiento', jefe: 'Por asignar' },
      { nombre: 'Informática', jefe: 'Por asignar' },
      { nombre: 'Almacén', jefe: 'Por asignar' },
      { nombre: 'Inventarios', jefe: 'Jefa Departamento' },
    ]).returning();
    console.log(`✅ ${areasData.length} áreas creadas`);

    // 3. SUBGRUPOS SICOIN
    console.log('📝 Creando subgrupos SICOIN...');
    const subgruposData = await db.insert(subgrupos).values([
      {
        codigo: '321',
        nombre: 'De producción',
        descripcion: 'Equipo médico de producción',
      },
      {
        codigo: '322',
        nombre: 'De oficina y muebles',
        descripcion: 'Mobiliario y equipo de oficina',
      },
      {
        codigo: '323',
        nombre: 'Médico, sanitario y laboratorio',
        descripcion: 'Equipo médico y de laboratorio',
      },
      {
        codigo: '324',
        nombre: 'Educacional, cultural y recreativo',
        descripcion: 'Equipo educacional y cultural',
      },
      {
        codigo: '325',
        nombre: 'Transporte, tracción y elevación',
        descripcion: 'Vehículos y equipo de transporte',
      },
      {
        codigo: '326',
        nombre: 'De comunicaciones',
        descripcion: 'Equipo de comunicación',
      },
      {
        codigo: '328',
        nombre: 'De cómputo',
        descripcion: 'Equipo informático y computadoras',
      },
      {
        codigo: '329',
        nombre: 'Otros activos',
        descripcion: 'Otros activos no clasificados',
      },
    ]).returning();
    console.log(`✅ ${subgruposData.length} subgrupos creados`);

    // 4. ESTADOS
    console.log('📝 Creando estados...');
    const estadosData = await db.insert(estados).values([
      { nombre: 'Activo', color: 'green' },
      { nombre: 'En reparación', color: 'yellow' },
      { nombre: 'En resguardo', color: 'blue' },
      { nombre: 'En préstamo', color: 'orange' },
      { nombre: 'De baja (pendiente)', color: 'red' },
      { nombre: 'Dado de baja', color: 'gray' },
    ]).returning();
    console.log(`✅ ${estadosData.length} estados creados`);

    // 5. USUARIO ADMINISTRADOR
    console.log('📝 Creando usuario administrador...');
    const adminRole = rolesData.find((r) => r.nombre === 'Admin');
    const areaInventarios = areasData.find((a) => a.nombre === 'Inventarios');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await db.insert(usuarios).values({
      username: 'admin',
      password: hashedPassword,
      nombre: 'Administrador del Sistema',
      email: 'admin@hospital.gob.gt',
      rolId: adminRole!.id,
      areaId: areaInventarios!.id,
      activo: true,
    }).returning();
    console.log(`✅ Usuario admin creado (username: admin, password: admin123)`);

    console.log('\n🎉 ¡Seed completado exitosamente!');
    console.log('\n📊 RESUMEN:');
    console.log(`   - Roles: ${rolesData.length}`);
    console.log(`   - Áreas: ${areasData.length}`);
    console.log(`   - Subgrupos: ${subgruposData.length}`);
    console.log(`   - Estados: ${estadosData.length}`);
    console.log(`   - Usuario admin: 1`);
    console.log('\n🔑 CREDENCIALES DE ACCESO:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  CAMBIAR PASSWORD EN PRODUCCIÓN\n');

  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  }
}

seed()
  .catch((err) => {
    console.error('Error fatal:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
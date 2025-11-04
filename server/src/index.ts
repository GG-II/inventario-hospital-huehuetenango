import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
import path from 'path';
import { exec } from 'child_process';
import authRoutes from './routes/auth';
import equiposRoutes from './routes/equipos';
import trasladosRoutes from './routes/traslados';
import bajasRoutes from './routes/bajas';
import reportesRoutes from './routes/reportes';
import dashboardRoutes from './routes/dashboard';
import areasRoutes from './routes/areas';
import multipart from '@fastify/multipart';
import usuarioRoutes from './routes/usuario';
import { iniciarBackupsAutomaticos } from './config/backup-scheduler';

dotenv.config();

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Rutas básicas
server.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}));

server.get('/', async () => ({
  message: 'API Sistema de Control de Inventario',
  version: '1.0.0',
  endpoints: {
    health: '/health',
    auth: '/api/auth',
    equipos: '/api/equipos',
  },
}));

const start = async () => {
  try {
    // Configurar CORS DENTRO de la función start
    await server.register(cors, {
      origin: process.env.NODE_ENV === 'production' 
        ? true 
        : 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    await server.register(multipart);

    // Registrar rutas API
    server.register(authRoutes, { prefix: '/api/auth' });
    server.register(equiposRoutes, { prefix: '/api/equipos' });
    server.register(trasladosRoutes, { prefix: '/api/traslados' });
    server.register(bajasRoutes, { prefix: '/api/bajas' });
    server.register(reportesRoutes, { prefix: '/api/reportes' });
    server.register(dashboardRoutes, { prefix: '/api/dashboard' });
    server.register(areasRoutes, { prefix: '/api/areas' });
    server.register(usuarioRoutes, { prefix: '/api/usuario' });

    // Servir archivos estáticos del frontend (PRODUCCIÓN)
    if (process.env.NODE_ENV === 'production') {
      console.log('📦 Configurando servidor en modo PRODUCCIÓN...');
      
      server.register(fastifyStatic, {
        root: path.join(__dirname, '../public'),
        prefix: '/',
      });

      // Ruta catch-all para SPA (Single Page Application)
      server.setNotFoundHandler((request, reply) => {
        // Si la ruta empieza con /api, es un endpoint no encontrado
        if (request.url.startsWith('/api')) {
          reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Ruta API no encontrada',
            },
          });
        } else {
          // Para cualquier otra ruta, servir index.html (SPA)
          reply.sendFile('index.html');
        }
      });
    }

    // Iniciar servidor
    const port = parseInt(process.env.PORT || '3000');
    await server.listen({ port, host: '0.0.0.0' });
    
    // Obtener IP local para mostrar en consola
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    for (const interfaceName in networkInterfaces) {
      const addresses = networkInterfaces[interfaceName];
      if (addresses) {
        for (const address of addresses) {
          if (address.family === 'IPv4' && !address.internal) {
            localIP = address.address;
            break;
          }
        }
      }
    }
    
    console.log('\n🚀 ════════════════════════════════════════════════');
    console.log('   SERVIDOR INICIADO');
    console.log('   ════════════════════════════════════════════════');
    console.log(`   🌐 URL Local: http://localhost:${port}`);
    console.log(`   🌐 URL Red Local: http://${localIP}:${port}`);
    console.log(`   📊 Health: http://localhost:${port}/health`);
    console.log(`   🔐 Auth: http://localhost:${port}/api/auth`);
    console.log(`   📦 Equipos: http://localhost:${port}/api/equipos`);
    console.log(`   📦 Traslados: http://localhost:${port}/api/traslados`);
    console.log(`   🗑️  Bajas: http://localhost:${port}/api/bajas`);
    console.log(`   📄 Reportes: http://localhost:${port}/api/reportes`);
    
    if (process.env.NODE_ENV === 'production') {
      console.log('   ════════════════════════════════════════════════');
      console.log('   ⚠️  MODO: PRODUCCIÓN');
      console.log(`   📱 Acceso Web: http://${localIP}:${port}`);
      console.log('   ════════════════════════════════════════════════');
    } else {
      console.log('   ════════════════════════════════════════════════');
      console.log('   🔧 MODO: DESARROLLO');
      console.log(`   💻 Frontend: http://localhost:5173`);
      console.log('   ════════════════════════════════════════════════');
    }
    
    console.log('\n   ℹ️  Los demás equipos pueden acceder usando:');
    console.log(`   http://${localIP}:${port}\n`);

    // Crear backup automático al iniciar
    console.log('📦 Creando backup automático de la base de datos...');
    exec('node backup.js create', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('⚠️  Error al crear backup automático:', error.message);
      } else {
        console.log('✅ Backup automático creado exitosamente\n');
      }
    });

    // Iniciar backups automáticos programados
    iniciarBackupsAutomaticos();
    
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
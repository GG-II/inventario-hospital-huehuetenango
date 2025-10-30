import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import equiposRoutes from './routes/equipos';
import trasladosRoutes from './routes/traslados';
import bajasRoutes from './routes/bajas';
import reportesRoutes from './routes/reportes';
import dashboardRoutes from './routes/dashboard';
import areasRoutes from './routes/areas';
import usuarioRoutes from './routes/usuario';

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
      origin: 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Registrar rutas
    server.register(authRoutes, { prefix: '/api/auth' });
    server.register(equiposRoutes, { prefix: '/api/equipos' });
    server.register(trasladosRoutes, { prefix: '/api/traslados' });
    server.register(bajasRoutes, { prefix: '/api/bajas' });
    server.register(reportesRoutes, { prefix: '/api/reportes' });
    server.register(dashboardRoutes, { prefix: '/api/dashboard' });
    server.register(areasRoutes, { prefix: '/api/areas' });
    server.register(usuarioRoutes, { prefix: '/api/usuario' });

    // Iniciar servidor
    const port = parseInt(process.env.PORT || '3000');
    await server.listen({ port, host: '0.0.0.0' });
    
    console.log('\n🚀 ════════════════════════════════════════════════');
    console.log('   SERVIDOR INICIADO');
    console.log('   ════════════════════════════════════════════════');
    console.log(`   🌐 URL: http://localhost:${port}`);
    console.log(`   📊 Health: http://localhost:${port}/health`);
    console.log(`   🔐 Auth: http://localhost:${port}/api/auth`);
    console.log(`   📦 Equipos: http://localhost:${port}/api/equipos`);
    console.log(`   📦 Traslados: http://localhost:${port}/api/traslados`);
    console.log(`   🗑️  Bajas: http://localhost:${port}/api/bajas`);
    console.log(`   📄 Reportes: http://localhost:${port}/api/reportes`);
    console.log('   ════════════════════════════════════════════════\n');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
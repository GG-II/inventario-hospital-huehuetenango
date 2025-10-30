import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import equiposRoutes from './routes/equipos';
import trasladosRoutes from './routes/traslados';
import bajasRoutes from './routes/bajas';

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

server.register(cors, { origin: true });

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

server.register(authRoutes, { prefix: '/api/auth' });
server.register(equiposRoutes, { prefix: '/api/equipos' });
server.register(trasladosRoutes, { prefix: '/api/traslados' });
server.register(bajasRoutes, { prefix: '/api/bajas' });

const start = async () => {
  try {
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
    console.log('   ════════════════════════════════════════════════\n');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
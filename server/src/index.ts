import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

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

// Configurar CORS
server.register(cors, {
  origin: true, // En producción, especificar dominios permitidos
});

// Ruta de health check
server.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});

// Ruta raíz
server.get('/', async (request, reply) => {
  return {
    message: 'API Sistema de Control de Inventario - Hospital Regional Huehuetenango',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  };
});

// Iniciar servidor
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await server.listen({ port, host: '0.0.0.0' });
    
    console.log('\n🚀 ════════════════════════════════════════════════');
    console.log('   SERVIDOR INICIADO EXITOSAMENTE');
    console.log('   ════════════════════════════════════════════════');
    console.log(`   🌐 URL: http://localhost:${port}`);
    console.log(`   📊 Health: http://localhost:${port}/health`);
    console.log('   ════════════════════════════════════════════════\n');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
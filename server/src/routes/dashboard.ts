import { FastifyPluginAsync } from 'fastify';
import { dashboardService } from '../services/dashboardService';
import { requireAuth } from '../middleware/auth';

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/dashboard/estadisticas
   * Obtener estadísticas del dashboard
   */
  fastify.get(
    '/estadisticas',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const estadisticas = await dashboardService.obtenerEstadisticas();

        return reply.code(200).send({
          success: true,
          data: estadisticas,
        });
      } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'STATS_ERROR',
            message: 'Error al obtener estadísticas',
          },
        });
      }
    }
  );
};

export default dashboardRoutes;
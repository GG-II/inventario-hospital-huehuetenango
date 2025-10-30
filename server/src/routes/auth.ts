import { FastifyPluginAsync } from 'fastify';
import { authService } from '../services/authService';
import { requireAuth } from '../middleware/auth';
import { loginSchema } from '../types/auth';
import type { LoginDto } from '../types/auth';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/auth/login
   * Iniciar sesión
   */
  fastify.post<{ Body: LoginDto }>('/login', async (request, reply) => {
    try {
      // Validar datos de entrada
      const credentials = loginSchema.parse(request.body);

      // Autenticar usuario
      const result = await authService.login(credentials);

      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'AUTH_FAILED',
            message: error.message,
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  });

  /**
   * GET /api/auth/me
   * Obtener usuario actual (requiere autenticación)
   */
  fastify.get('/me', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      try {
        if (!request.user) {
          return reply.code(401).send({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'No autenticado',
            },
          });
        }

        const user = await authService.getCurrentUser(request.user.userId);

        return reply.code(200).send({
          success: true,
          user,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al obtener usuario',
          },
        });
      }
    },
  });

  /**
   * POST /api/auth/logout
   * Cerrar sesión (actualmente solo confirma)
   */
  fastify.post('/logout', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      // En JWT stateless, el logout es manejado en el cliente
      // borrando el token. Aquí solo confirmamos.
      return reply.code(200).send({
        success: true,
        message: 'Sesión cerrada exitosamente',
      });
    },
  });
};

export default authRoutes;
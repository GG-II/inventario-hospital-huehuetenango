import { FastifyPluginAsync } from 'fastify';
import { usuarioService } from '../services/usuarioService';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';

const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'La contraseña actual es requerida'),
  passwordNuevo: z
    .string()
    .min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmarPassword: z.string().min(1, 'Debes confirmar la nueva contraseña'),
});

const usuarioRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * PUT /api/usuario/cambiar-password
   * Cambiar contraseña del usuario actual
   */
  fastify.put<{
    Body: z.infer<typeof cambiarPasswordSchema>;
  }>(
    '/cambiar-password',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const user = request.user;

        // El token usa 'userId' en lugar de 'id'
        const usuarioId = user?.userId;

        if (!usuarioId) {
          return reply.code(401).send({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Usuario no autenticado',
            },
          });
        }

        console.log('\n🔐 ════════════════════════════════════════');
        console.log('   CAMBIO DE CONTRASEÑA');
        console.log('   ════════════════════════════════════════');
        console.log('📥 Body recibido:', request.body);
        console.log('👤 Usuario autenticado:', {
          userId: user.userId,
          username: user.username,
          rol: user.rolNombre,
        });

        // Validar datos
        const validacion = cambiarPasswordSchema.safeParse(request.body);
        if (!validacion.success) {
          console.log('❌ Validación fallida:', validacion.error.errors);
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validacion.error.errors[0].message,
            },
          });
        }

        console.log('✅ Validación exitosa');

        const { passwordActual, passwordNuevo, confirmarPassword } =
          validacion.data;

        // Verificar que las contraseñas coincidan
        if (passwordNuevo !== confirmarPassword) {
          console.log('❌ Las contraseñas no coinciden');
          return reply.code(400).send({
            success: false,
            error: {
              code: 'PASSWORD_MISMATCH',
              message: 'Las contraseñas no coinciden',
            },
          });
        }

        console.log('✅ Las contraseñas coinciden');

        // Verificar que la nueva contraseña sea diferente
        if (passwordActual === passwordNuevo) {
          console.log('❌ La nueva contraseña es igual a la actual');
          return reply.code(400).send({
            success: false,
            error: {
              code: 'SAME_PASSWORD',
              message: 'La nueva contraseña debe ser diferente a la actual',
            },
          });
        }

        console.log('✅ Nueva contraseña es diferente');
        console.log('🔄 Llamando a usuarioService.cambiarPassword...');

        // Cambiar contraseña
        await usuarioService.cambiarPassword(
          usuarioId,
          passwordActual,
          passwordNuevo
        );

        console.log('✅ Contraseña cambiada exitosamente');
        console.log('   ════════════════════════════════════════\n');

        return reply.code(200).send({
          success: true,
          message: 'Contraseña actualizada exitosamente',
        });
      } catch (error) {
        console.error('\n❌ ════════════════════════════════════════');
        console.error('   ERROR AL CAMBIAR CONTRASEÑA');
        console.error('   ════════════════════════════════════════');
        console.error('Error completo:', error);
        console.error('   ════════════════════════════════════════\n');

        if (error instanceof Error) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'PASSWORD_ERROR',
              message: error.message,
            },
          });
        }

        return reply.code(500).send({
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Error al cambiar la contraseña',
          },
        });
      }
    }
  );
};

export default usuarioRoutes;
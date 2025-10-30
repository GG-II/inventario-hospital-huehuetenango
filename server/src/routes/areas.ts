import { FastifyPluginAsync } from 'fastify';
import { db } from '../config/database';
import { areas, equipos } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const updateAreaSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  jefe: z.string().optional(),
});

const areasRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/areas
   * Listar todas las áreas con cantidad de equipos
   */
  fastify.get(
    '/',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        // Obtener áreas con conteo de equipos
        const areasConEquipos = await db
          .select({
            id: areas.id,
            nombre: areas.nombre,
            jefe: areas.jefe,
            cantidadEquipos: sql<number>`count(${equipos.id})`,
          })
          .from(areas)
          .leftJoin(equipos, eq(areas.id, equipos.areaId))
          .groupBy(areas.id, areas.nombre, areas.jefe)
          .orderBy(areas.nombre);

        return reply.code(200).send({
          success: true,
          data: areasConEquipos,
        });
      } catch (error) {
        console.error('Error al listar áreas:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'AREAS_ERROR',
            message: 'Error al obtener las áreas',
          },
        });
      }
    }
  );

  /**
   * GET /api/areas/:id
   * Obtener área por ID
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const areaId = parseInt(request.params.id);

        if (isNaN(areaId)) {
          return reply.code(400).send({
            success: false,
            error: { code: 'INVALID_ID', message: 'ID inválido' },
          });
        }

        const [area] = await db
          .select()
          .from(areas)
          .where(eq(areas.id, areaId))
          .limit(1);

        if (!area) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Área no encontrada' },
          });
        }

        return reply.code(200).send({
          success: true,
          data: area,
        });
      } catch (error) {
        console.error('Error al obtener área:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'AREA_ERROR',
            message: 'Error al obtener el área',
          },
        });
      }
    }
  );

  /**
   * PUT /api/areas/:id
   * Actualizar área (verificación de rol en el código)
   */
  fastify.put<{
    Params: { id: string };
    Body: z.infer<typeof updateAreaSchema>;
  }>(
    '/:id',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;

        const areaId = parseInt(request.params.id);

        if (isNaN(areaId)) {
          return reply.code(400).send({
            success: false,
            error: { code: 'INVALID_ID', message: 'ID inválido' },
          });
        }

        // Validar datos
        const validacion = updateAreaSchema.safeParse(request.body);
        if (!validacion.success) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validacion.error.errors[0].message,
            },
          });
        }

        const { nombre, jefe } = validacion.data;

        // Verificar que el área existe
        const [areaExistente] = await db
          .select()
          .from(areas)
          .where(eq(areas.id, areaId))
          .limit(1);

        if (!areaExistente) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Área no encontrada' },
          });
        }

        // Actualizar área
        const [areaActualizada] = await db
          .update(areas)
          .set({
            nombre,
            jefe: jefe || null,
          })
          .where(eq(areas.id, areaId))
          .returning();

        return reply.code(200).send({
          success: true,
          data: areaActualizada,
          message: 'Área actualizada exitosamente',
        });
      } catch (error) {
        console.error('Error al actualizar área:', error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: 'Error al actualizar el área',
          },
        });
      }
    }
  );
};

export default areasRoutes;
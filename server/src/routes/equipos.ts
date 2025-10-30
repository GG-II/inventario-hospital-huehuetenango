import { FastifyPluginAsync } from 'fastify';
import { equipoService } from '../services/equipoService';
import { requireAuth, requireRole } from '../middleware/auth';
import { trasladoService } from '../services/trasladoService';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { equipos, areas, estados } from '../db/schema';
import {
  crearEquipoSchema,
  actualizarEquipoSchema,
  buscarEquiposSchema,
  type CrearEquipoDto,
  type ActualizarEquipoDto,
  type BuscarEquiposDto,
} from '../types/equipo';

const equiposRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/equipos
   * Crear nuevo equipo
   */
  fastify.post<{ Body: CrearEquipoDto }>(
    '/',
    {
      preHandler: [requireAuth, requireRole(['Admin', 'Inventarios'])],
    },
    async (request, reply) => {
      try {
        const data = crearEquipoSchema.parse(request.body);
        const ip = request.ip;

        const equipo = await equipoService.crear(
          data,
          request.user!.userId,
          ip
        );

        return reply.code(201).send({
          success: true,
          data: equipo,
          message: 'Equipo creado exitosamente',
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: error.message,
            },
          });
        }

        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al crear equipo',
          },
        });
      }
    }
  );

  /**
   * GET /api/equipos
   * Listar equipos con filtros
   */
  fastify.get<{ Querystring: BuscarEquiposDto }>(
    '/',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const filtros = buscarEquiposSchema.parse(request.query);

        const resultado = await equipoService.listar(filtros);

        return reply.code(200).send({
          success: true,
          ...resultado,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al listar equipos',
          },
        });
      }
    }
  );

  /**
   * GET /api/equipos/:id
   * Obtener detalle de un equipo
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const id = parseInt(request.params.id);

        if (isNaN(id)) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_ID',
              message: 'ID inválido',
            },
          });
        }

        const equipo = await equipoService.obtenerPorId(id);

        if (!equipo) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Equipo no encontrado',
            },
          });
        }

        return reply.code(200).send({
          success: true,
          data: equipo,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al obtener equipo',
          },
        });
      }
    }
  );

  /**
 * PUT /api/equipos/:id
 * Actualizar equipo
 */
fastify.put<{ Params: { id: string }; Body: ActualizarEquipoDto }>(
  '/:id',
  {
    preHandler: [requireAuth, requireRole(['Admin', 'Inventarios'])],
  },
  async (request, reply) => {
    try {
      const id = parseInt(request.params.id);

      if (isNaN(id)) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID inválido',
          },
        });
      }

      console.log('📝 Datos recibidos:', request.body);
      console.log('🆔 ID a actualizar:', id);

      const data = actualizarEquipoSchema.parse(request.body);
      const ip = request.ip;

      console.log('✅ Datos validados:', data);

      const equipo = await equipoService.actualizar(
        id,
        data,
        request.user!.userId,
        ip
      );

      console.log('✅ Equipo actualizado:', equipo);

      return reply.code(200).send({
        success: true,
        data: equipo,
        message: 'Equipo actualizado exitosamente',
      });
    } catch (error) {
      console.error('❌ Error al actualizar:', error);
      
      if (error instanceof Error) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: error.message,
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al actualizar equipo',
        },
      });
    }
  }
);

  /**
   * GET /api/equipos/:id/historial
   * Obtener historial completo de un equipo
   */
  fastify.get<{ Params: { id: string } }>(
    '/:id/historial',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const id = parseInt(request.params.id);

        if (isNaN(id)) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_ID',
              message: 'ID inválido',
            },
          });
        }

        const historial = await trasladoService.obtenerHistorialEquipo(id);

        return reply.code(200).send({
          success: true,
          data: historial,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al obtener historial',
          },
        });
      }
    }
  );

  /**
 * GET /api/equipos/buscar/rapida
 * Búsqueda rápida de equipos (optimizada)
 */
fastify.get<{
  Querystring: { q: string };
}>(
  '/buscar/rapida',
  {
    preHandler: [requireAuth],
  },
  async (request, reply) => {
    try {
      const { q } = request.query;

      if (!q || q.trim().length < 2) {
        return reply.code(200).send({
          success: true,
          data: [],
        });
      }

      const termino = q.trim().toLowerCase();

      // Búsqueda limitada a 10 resultados
      const resultados = await db
        .select({
          id: equipos.id,
          codigoSICOIN: equipos.codigoSICOIN,
          descripcion: equipos.descripcion,
          marca: equipos.marca,
          numeroSerie: equipos.numeroSerie,
          area: areas.nombre,
          estado: estados.nombre,
          estadoColor: estados.color,
        })
        .from(equipos)
        .leftJoin(areas, eq(equipos.areaId, areas.id))
        .leftJoin(estados, eq(equipos.estadoId, estados.id))
        .where(
          or(
            sql`LOWER(${equipos.codigoSICOIN}) LIKE ${`%${termino}%`}`,
            sql`LOWER(${equipos.descripcion}) LIKE ${`%${termino}%`}`,
            sql`LOWER(${equipos.marca}) LIKE ${`%${termino}%`}`,
            sql`LOWER(${equipos.numeroSerie}) LIKE ${`%${termino}%`}`
          )
        )
        .limit(10);

      return reply.code(200).send({
        success: true,
        data: resultados,
      });
    } catch (error) {
      console.error('Error en búsqueda rápida:', error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Error al realizar la búsqueda',
        },
      });
    }
  }
);
};  
  
export default equiposRoutes;
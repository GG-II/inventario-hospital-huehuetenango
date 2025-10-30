import { FastifyPluginAsync } from 'fastify';
import { bajaService } from '../services/bajaService';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  solicitarBajaSchema,
  procesarBajaSchema,
  listarBajasSchema,
  type SolicitarBajaDto,
  type ProcesarBajaDto,
  type ListarBajasDto,
} from '../types/baja';

const bajasRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/bajas
   * Solicitar baja de un equipo
   */
  fastify.post<{ Body: SolicitarBajaDto }>(
    '/',
    {
      preHandler: [requireAuth, requireRole(['Admin', 'Inventarios', 'Mantenimiento'])],
    },
    async (request, reply) => {
      try {
        const data = solicitarBajaSchema.parse(request.body);
        const ip = request.ip;

        const baja = await bajaService.solicitar(data, request.user!.userId, ip);

        return reply.code(201).send({
          success: true,
          data: baja,
          message: 'Solicitud de baja registrada exitosamente',
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'BAJA_ERROR',
              message: error.message,
            },
          });
        }

        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al solicitar baja',
          },
        });
      }
    }
  );

  /**
   * GET /api/bajas
   * Listar bajas con filtros
   */
  fastify.get<{ Querystring: ListarBajasDto }>(
    '/',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const filtros = listarBajasSchema.parse(request.query);

        const resultado = await bajaService.listar(filtros);

        return reply.code(200).send({
          success: true,
          ...resultado,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al listar bajas',
          },
        });
      }
    }
  );

  /**
   * GET /api/bajas/:id
   * Obtener detalle de una baja
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

        const baja = await bajaService.obtenerPorId(id);

        if (!baja) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Solicitud de baja no encontrada',
            },
          });
        }

        return reply.code(200).send({
          success: true,
          data: baja,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al obtener baja',
          },
        });
      }
    }
  );

  /**
   * PUT /api/bajas/:id/procesar
   * Aprobar o rechazar una baja
   */
  fastify.put<{ Params: { id: string }; Body: ProcesarBajaDto }>(
    '/:id/procesar',
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

        const data = procesarBajaSchema.parse(request.body);
        const ip = request.ip;

        const baja = await bajaService.procesar(id, data, request.user!.userId, ip);

        return reply.code(200).send({
          success: true,
          data: baja,
          message: `Baja ${data.aprobado ? 'aprobada' : 'rechazada'} exitosamente`,
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'PROCESAR_ERROR',
              message: error.message,
            },
          });
        }

        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al procesar baja',
          },
        });
      }
    }
  );
};

export default bajasRoutes;
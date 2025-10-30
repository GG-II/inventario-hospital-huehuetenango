import { FastifyPluginAsync } from 'fastify';
import { trasladoService } from '../services/trasladoService';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  crearTrasladoSchema,
  listarTrasladosSchema,
  type CrearTrasladoDto,
  type ListarTrasladosDto,
} from '../types/traslado';

const trasladosRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/traslados
   * Crear nuevo traslado
   */
  fastify.post<{ Body: CrearTrasladoDto }>(
    '/',
    {
      preHandler: [
        requireAuth,
        requireRole(['Admin', 'Inventarios', 'Jefe Servicio']),
      ],
    },
    async (request, reply) => {
      try {
        const data = crearTrasladoSchema.parse(request.body);
        const ip = request.ip;

        const traslado = await trasladoService.crear(
          data,
          request.user!.userId,
          ip
        );

        return reply.code(201).send({
          success: true,
          data: traslado,
          message: 'Traslado registrado exitosamente',
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'TRASLADO_ERROR',
              message: error.message,
            },
          });
        }

        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al crear traslado',
          },
        });
      }
    }
  );

  /**
   * GET /api/traslados
   * Listar traslados con filtros
   */
  fastify.get<{ Querystring: ListarTrasladosDto }>(
    '/',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const filtros = listarTrasladosSchema.parse(request.query);

        const resultado = await trasladoService.listar(filtros);

        return reply.code(200).send({
          success: true,
          ...resultado,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al listar traslados',
          },
        });
      }
    }
  );

  /**
   * GET /api/traslados/:id
   * Obtener detalle de un traslado
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

        const traslado = await trasladoService.obtenerPorId(id);

        if (!traslado) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Traslado no encontrado',
            },
          });
        }

        return reply.code(200).send({
          success: true,
          data: traslado,
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error al obtener traslado',
          },
        });
      }
    }
  );
};

export default trasladosRoutes;
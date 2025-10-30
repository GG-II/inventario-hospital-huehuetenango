import { FastifyPluginAsync } from 'fastify';
import { qrService } from '../services/qrService';
import { reporteService } from '../services/reporteService';
import { requireAuth } from '../middleware/auth';

const reportesRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/reportes/qr/:equipoId
   * Generar código QR de un equipo
   */
  fastify.get<{ Params: { equipoId: string } }>(
    '/qr/:equipoId',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const equipoId = parseInt(request.params.equipoId);

        if (isNaN(equipoId)) {
          return reply.code(400).send({
            success: false,
            error: { code: 'INVALID_ID', message: 'ID inválido' },
          });
        }

        const qrDataURL = await qrService.generarQR(equipoId);

        return reply.code(200).send({
          success: true,
          data: { qr: qrDataURL },
        });
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: { code: 'QR_ERROR', message: 'Error al generar QR' },
        });
      }
    }
  );

  /**
   * GET /api/reportes/inventario
   * Generar reporte de inventario anual en PDF
   */
  fastify.get(
    '/inventario',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const pdf = await reporteService.generarReporteInventario();

        return reply
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="inventario-${new Date().toISOString().split('T')[0]}.pdf"`)
          .send(pdf);
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: { code: 'PDF_ERROR', message: 'Error al generar reporte' },
        });
      }
    }
  );

  /**
   * GET /api/reportes/tarjeta/:areaId
   * Generar tarjeta de responsabilidad por área
   */
  fastify.get<{ Params: { areaId: string } }>(
    '/tarjeta/:areaId',
    {
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const areaId = parseInt(request.params.areaId);

        if (isNaN(areaId)) {
          return reply.code(400).send({
            success: false,
            error: { code: 'INVALID_ID', message: 'ID inválido' },
          });
        }

        const pdf = await reporteService.generarTarjetaResponsabilidad(areaId);

        return reply
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="tarjeta-responsabilidad-area-${areaId}.pdf"`)
          .send(pdf);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({
            success: false,
            error: { code: 'PDF_ERROR', message: error.message },
          });
        }

        return reply.code(500).send({
          success: false,
          error: { code: 'PDF_ERROR', message: 'Error al generar tarjeta' },
        });
      }
    }
  );
};

export default reportesRoutes;
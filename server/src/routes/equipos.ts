import { FastifyPluginAsync } from 'fastify';
import { equipoService } from '../services/equipoService';
import { requireAuth, requireRole } from '../middleware/auth';
import { trasladoService } from '../services/trasladoService';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { equipos, areas, estados } from '../db/schema';
import path from 'path';
import multer from 'multer';
import { auditService } from '../services/auditService';
import { fotoService } from '../services/fotoService';
import {
  crearEquipoSchema,
  actualizarEquipoSchema,
  buscarEquiposSchema,
  type CrearEquipoDto,
  type ActualizarEquipoDto,
  type BuscarEquiposDto,
} from '../types/equipo';

// Configurar multer para memoria (no guardar en disco directamente)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Solo aceptar imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
});

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

/**
 * PUT /api/equipos/:id/cambiar-estado
 * Cambiar estado de un equipo rápidamente
 */
fastify.put<{
  Params: { id: string };
  Body: { estadoId: number; observaciones?: string };
}>(
  '/:id/cambiar-estado',
  {
    preHandler: [requireAuth, requireRole(['Admin', 'Inventarios', 'Mantenimiento'])],
  },
  async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const { estadoId, observaciones } = request.body;

      if (isNaN(id)) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID inválido',
          },
        });
      }

      if (!estadoId) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El estado es requerido',
          },
        });
      }

      console.log(`🔄 Cambiando estado del equipo ${id} a ${estadoId}`);

      // Verificar que el equipo existe
      const equipoActual = await equipoService.obtenerPorId(id);
      if (!equipoActual) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Equipo no encontrado',
          },
        });
      }

      // Verificar que el estado existe
      const [estadoNuevo] = await db
        .select()
        .from(estados)
        .where(eq(estados.id, estadoId))
        .limit(1);

      if (!estadoNuevo) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Estado no encontrado',
          },
        });
      }

      // No permitir cambiar a "De baja (pendiente)" o "Dado de baja"
      // Estos estados solo se cambian mediante el proceso de bajas
      if (estadoNuevo.nombre === 'De baja (pendiente)' || estadoNuevo.nombre === 'Dado de baja') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: 'No se puede cambiar a este estado directamente. Use el proceso de bajas.',
          },
        });
      }

      // Actualizar estado
      const equipoActualizado = await equipoService.actualizar(
        id,
        {
          estadoId,
          observaciones: observaciones || `Cambio de estado a: ${estadoNuevo.nombre}`,
        },
        request.user!.userId,
        request.ip
      );

      console.log('✅ Estado actualizado exitosamente');

      return reply.code(200).send({
        success: true,
        data: equipoActualizado,
        message: `Estado cambiado a: ${estadoNuevo.nombre}`,
      });
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);

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
          message: 'Error al cambiar estado del equipo',
        },
      });
    }
  }
);

/**
 * POST /api/equipos/:id/foto
 * Subir foto de un equipo
 */
fastify.post<{ Params: { id: string } }>(
  '/:id/foto',
  {
    preHandler: [requireAuth, requireRole(['Admin', 'Inventarios'])],
  },
  async (request, reply) => {
    try {
      const equipoId = parseInt(request.params.id);

      if (isNaN(equipoId)) {
        return reply.code(400).send({
          success: false,
          error: { code: 'INVALID_ID', message: 'ID inválido' },
        });
      }

      // Verificar que el equipo existe
      const equipo = await equipoService.obtenerPorId(equipoId);
      if (!equipo) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Equipo no encontrado' },
        });
      }

      // Obtener archivo del multipart
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          success: false,
          error: { code: 'NO_FILE', message: 'No se recibió ningún archivo' },
        });
      }

      // Validar tipo de archivo
      if (!data.mimetype.startsWith('image/')) {
        return reply.code(400).send({
          success: false,
          error: { code: 'INVALID_FILE', message: 'Solo se permiten imágenes' },
        });
      }

      // Leer el buffer del archivo
      const buffer = await data.toBuffer();

      // Validar tamaño (5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.code(400).send({
          success: false,
          error: { code: 'FILE_TOO_LARGE', message: 'El archivo es muy grande (máx 5MB)' },
        });
      }

      // Eliminar foto anterior si existe
      if (equipo.fotoUrl) {
        await fotoService.eliminarFoto(equipo.fotoUrl);
      }

      // Procesar y guardar nueva foto
      const fotoUrl = await fotoService.procesarFoto(buffer, equipoId);

      // Actualizar equipo en BD
      await db
        .update(equipos)
        .set({
          fotoUrl,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(equipos.id, equipoId));

      // Registrar en auditoría
      await auditService.registrar({
        usuarioId: request.user!.userId,
        accion: 'SUBIR_FOTO',
        tabla: 'equipos',
        registroId: equipoId,
        datosDespues: { fotoUrl },
        ip: request.ip,
      });

      return reply.code(200).send({
        success: true,
        data: { fotoUrl },
        message: 'Foto subida exitosamente',
      });
    } catch (error) {
      console.error('Error al subir foto:', error);
      return reply.code(500).send({
        success: false,
        error: { code: 'UPLOAD_ERROR', message: 'Error al subir foto' },
      });
    }
  }
);

/**
 * GET /api/equipos/:id/foto
 * Obtener foto de un equipo
 */
fastify.get<{ Params: { id: string } }>(
  '/:id/foto',
  async (request, reply) => {
    try {
      const equipoId = parseInt(request.params.id);

      if (isNaN(equipoId)) {
        return reply.code(400).send({
          success: false,
          error: { code: 'INVALID_ID', message: 'ID inválido' },
        });
      }

      // Obtener equipo
      const equipo = await equipoService.obtenerPorId(equipoId);
      
      if (!equipo || !equipo.fotoUrl) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Foto no encontrada' },
        });
      }

      // Obtener nombre del archivo
      const filename = path.basename(equipo.fotoUrl);
      
      // Leer archivo
      const foto = await fotoService.obtenerFoto(filename);

      return reply
        .header('Content-Type', 'image/jpeg')
        .send(foto);
    } catch (error) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Foto no encontrada' },
      });
    }
  }
);
};  
  
export default equiposRoutes;
import { db } from '../config/database';
import {
  movimientos,
  equipos,
  areas,
  usuarios,
  auditoria,
} from '../db/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { auditService } from './auditService';
import type {
  CrearTrasladoDto,
  ListarTrasladosDto,
  TrasladoCompleto,
  HistorialEquipo,
} from '../types/traslado';

export class TrasladoService {
  /**
   * Generar folio de conocimiento único
   */
  private async generarFolio(): Promise<string> {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    
    // Contar traslados del mes actual
    const [resultado] = await db
      .select({ count: sql<number>`count(*)` })
      .from(movimientos)
      .where(
        sql`strftime('%Y-%m', ${movimientos.fechaMovimiento}) = ${`${año}-${mes}`}`
      );

    const consecutivo = Number(resultado.count) + 1;
    
    return `CONOC-${año}${mes}-${String(consecutivo).padStart(4, '0')}`;
  }

  /**
   * Crear un traslado
   */
  async crear(
    data: CrearTrasladoDto,
    usuarioId: number,
    ip?: string
  ): Promise<TrasladoCompleto> {
    // 1. Obtener información del equipo
    const [equipo] = await db
      .select({
        id: equipos.id,
        codigoSICOIN: equipos.codigoSICOIN,
        descripcion: equipos.descripcion,
        areaActual: equipos.areaId,
      })
      .from(equipos)
      .where(eq(equipos.id, data.equipoId))
      .limit(1);

    if (!equipo) {
      throw new Error('Equipo no encontrado');
    }

    // 2. Validar que el área destino sea diferente al área actual
    if (equipo.areaActual === data.areaDestinoId) {
      throw new Error('El equipo ya está en esa área');
    }

    // 3. Verificar que el área destino existe
    const [areaDestino] = await db
      .select()
      .from(areas)
      .where(eq(areas.id, data.areaDestinoId))
      .limit(1);

    if (!areaDestino) {
      throw new Error('Área destino no encontrada');
    }

    // 4. Generar folio de conocimiento
    const folio = await this.generarFolio();

    // 5. Crear el movimiento
    const [traslado] = await db
      .insert(movimientos)
      .values({
        equipoId: data.equipoId,
        tipo: 'TRASLADO',
        areaOrigenId: equipo.areaActual,
        areaDestinoId: data.areaDestinoId,
        folioConocimiento: folio,
        observaciones: data.observaciones || null,
        usuarioId,
        fechaMovimiento: new Date().toISOString(),
      })
      .returning();

    // 6. Actualizar la ubicación del equipo
    await db
      .update(equipos)
      .set({
        areaId: data.areaDestinoId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(equipos.id, data.equipoId));

    // 7. Registrar en auditoría
    await auditService.registrar({
      usuarioId,
      accion: 'TRASLADO_EQUIPO',
      tabla: 'movimientos',
      registroId: traslado.id,
      datosDespues: {
        equipoId: data.equipoId,
        areaOrigen: equipo.areaActual,
        areaDestino: data.areaDestinoId,
        folio,
      },
      ip,
    });

    // 8. Obtener traslado completo
    const trasladoCompleto = await this.obtenerPorId(traslado.id);

    if (!trasladoCompleto) {
      throw new Error('Error al crear traslado');
    }

    return trasladoCompleto;
  }

  /**
   * Listar traslados con filtros
   */
  async listar(filtros: ListarTrasladosDto) {
    const {
      equipoId,
      areaOrigenId,
      areaDestinoId,
      fechaInicio,
      fechaFin,
      page,
      limit,
    } = filtros;
    
    const offset = (page - 1) * limit;

    // Construir condiciones
    const condiciones = [];

    if (equipoId) {
      condiciones.push(eq(movimientos.equipoId, equipoId));
    }

    if (areaOrigenId) {
      condiciones.push(eq(movimientos.areaOrigenId, areaOrigenId));
    }

    if (areaDestinoId) {
      condiciones.push(eq(movimientos.areaDestinoId, areaDestinoId));
    }

    if (fechaInicio) {
      condiciones.push(gte(movimientos.fechaMovimiento, fechaInicio));
    }

    if (fechaFin) {
      condiciones.push(lte(movimientos.fechaMovimiento, fechaFin));
    }

    // Obtener total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(movimientos)
      .where(condiciones.length > 0 ? and(...condiciones) : undefined);

    // Obtener registros
    // Nota: Usamos alias para las tablas de áreas
    const areaOrigen = alias(areas, 'areaOrigen');
    const areaDestino = alias(areas, 'areaDestino');

    const resultados = await db
      .select({
        id: movimientos.id,
        tipo: movimientos.tipo,
        folioConocimiento: movimientos.folioConocimiento,
        observaciones: movimientos.observaciones,
        fechaMovimiento: movimientos.fechaMovimiento,
        equipo: {
          id: equipos.id,
          codigoSICOIN: equipos.codigoSICOIN,
          descripcion: equipos.descripcion,
        },
        areaOrigen: {
          id: areaOrigen.id,
          nombre: areaOrigen.nombre,
        },
        areaDestino: {
          id: areaDestino.id,
          nombre: areaDestino.nombre,
        },
        usuario: {
          id: usuarios.id,
          nombre: usuarios.nombre,
        },
      })
      .from(movimientos)
      .leftJoin(equipos, eq(movimientos.equipoId, equipos.id))
      .leftJoin(areaOrigen, eq(movimientos.areaOrigenId, areaOrigen.id))
      .leftJoin(areaDestino, eq(movimientos.areaDestinoId, areaDestino.id))
      .leftJoin(usuarios, eq(movimientos.usuarioId, usuarios.id))
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(desc(movimientos.fechaMovimiento))
      .limit(limit)
      .offset(offset);

    return {
      data: resultados as TrasladoCompleto[],
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / limit),
      },
    };
  }

  /**
   * Obtener traslado por ID
   */
  async obtenerPorId(id: number): Promise<TrasladoCompleto | null> {
    const areaOrigen = alias(areas, 'areaOrigen');
    const areaDestino = alias(areas, 'areaDestino');

    const [traslado] = await db
      .select({
        id: movimientos.id,
        tipo: movimientos.tipo,
        folioConocimiento: movimientos.folioConocimiento,
        observaciones: movimientos.observaciones,
        fechaMovimiento: movimientos.fechaMovimiento,
        equipo: {
          id: equipos.id,
          codigoSICOIN: equipos.codigoSICOIN,
          descripcion: equipos.descripcion,
        },
        areaOrigen: {
          id: areaOrigen.id,
          nombre: areaOrigen.nombre,
        },
        areaDestino: {
          id: areaDestino.id,
          nombre: areaDestino.nombre,
        },
        usuario: {
          id: usuarios.id,
          nombre: usuarios.nombre,
        },
      })
      .from(movimientos)
      .leftJoin(equipos, eq(movimientos.equipoId, equipos.id))
      .leftJoin(areaOrigen, eq(movimientos.areaOrigenId, areaOrigen.id))
      .leftJoin(areaDestino, eq(movimientos.areaDestinoId, areaDestino.id))
      .leftJoin(usuarios, eq(movimientos.usuarioId, usuarios.id))
      .where(eq(movimientos.id, id))
      .limit(1);

    return (traslado as TrasladoCompleto) || null;
  }

  /**
   * Obtener historial completo de un equipo
   */
  async obtenerHistorialEquipo(equipoId: number): Promise<HistorialEquipo> {
    const areaOrigen = alias(areas, 'areaOrigen');
    const areaDestino = alias(areas, 'areaDestino');

    // 1. Obtener movimientos
    const movimientosEquipo = await db
      .select({
        id: movimientos.id,
        tipo: movimientos.tipo,
        folioConocimiento: movimientos.folioConocimiento,
        observaciones: movimientos.observaciones,
        fechaMovimiento: movimientos.fechaMovimiento,
        equipo: {
          id: equipos.id,
          codigoSICOIN: equipos.codigoSICOIN,
          descripcion: equipos.descripcion,
        },
        areaOrigen: {
          id: areaOrigen.id,
          nombre: areaOrigen.nombre,
        },
        areaDestino: {
          id: areaDestino.id,
          nombre: areaDestino.nombre,
        },
        usuario: {
          id: usuarios.id,
          nombre: usuarios.nombre,
        },
      })
      .from(movimientos)
      .leftJoin(equipos, eq(movimientos.equipoId, equipos.id))
      .leftJoin(areaOrigen, eq(movimientos.areaOrigenId, areaOrigen.id))
      .leftJoin(areaDestino, eq(movimientos.areaDestinoId, areaDestino.id))
      .leftJoin(usuarios, eq(movimientos.usuarioId, usuarios.id))
      .where(eq(movimientos.equipoId, equipoId))
      .orderBy(desc(movimientos.fechaMovimiento));

    // 2. Obtener auditoría
    const auditoriaEquipo = await db
      .select({
        id: auditoria.id,
        accion: auditoria.accion,
        datosAntes: auditoria.datosAntes,
        datosDespues: auditoria.datosDespues,
        createdAt: auditoria.createdAt,
        usuario: {
          id: usuarios.id,
          nombre: usuarios.nombre,
        },
      })
      .from(auditoria)
      .leftJoin(usuarios, eq(auditoria.usuarioId, usuarios.id))
      .where(
        and(
          eq(auditoria.tabla, 'equipos'),
          eq(auditoria.registroId, equipoId)
        )
      )
      .orderBy(desc(auditoria.createdAt));

    // 3. Formatear auditoría
    const auditoriaFormateada = auditoriaEquipo.map((item) => ({
      id: item.id,
      accion: item.accion,
      usuario: item.usuario?.nombre || 'Desconocido',
      fecha: item.createdAt,
      cambios: {
        antes: item.datosAntes ? JSON.parse(item.datosAntes) : null,
        despues: item.datosDespues ? JSON.parse(item.datosDespues) : null,
      },
    }));

    return {
      movimientos: movimientosEquipo as TrasladoCompleto[],
      auditoria: auditoriaFormateada,
    };
  }
}

export const trasladoService = new TrasladoService();
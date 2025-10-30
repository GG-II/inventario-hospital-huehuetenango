import { db } from '../config/database';
import { bajas, equipos, usuarios, estados } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auditService } from './auditService';
import type {
  SolicitarBajaDto,
  ProcesarBajaDto,
  ListarBajasDto,
  BajaCompleta,
} from '../types/baja';

export class BajaService {
  /**
   * Solicitar baja de un equipo
   */
  async solicitar(
    data: SolicitarBajaDto,
    usuarioId: number,
    ip?: string
  ): Promise<BajaCompleta> {
    // 1. Verificar que el equipo existe y no está ya dado de baja
    const [equipo] = await db
      .select({
        id: equipos.id,
        estadoId: equipos.estadoId,
      })
      .from(equipos)
      .where(eq(equipos.id, data.equipoId))
      .limit(1);

    if (!equipo) {
      throw new Error('Equipo no encontrado');
    }

    // 2. Verificar que el equipo no esté dado de baja
    const [estadoEquipo] = await db
      .select()
      .from(estados)
      .where(eq(estados.id, equipo.estadoId))
      .limit(1);

    if (estadoEquipo?.nombre === 'Dado de baja') {
      throw new Error('El equipo ya está dado de baja');
    }

    // 3. Verificar que no haya una solicitud pendiente para este equipo
    const [solicitudPendiente] = await db
      .select()
      .from(bajas)
      .where(
        and(
          eq(bajas.equipoId, data.equipoId),
          eq(bajas.estado, 'PENDIENTE')
        )
      )
      .limit(1);

    if (solicitudPendiente) {
      throw new Error('Ya existe una solicitud de baja pendiente para este equipo');
    }

    // 4. Obtener el estado "De baja (pendiente)"
    const [estadoPendiente] = await db
      .select()
      .from(estados)
      .where(eq(estados.nombre, 'De baja (pendiente)'))
      .limit(1);

    if (!estadoPendiente) {
      throw new Error('Estado "De baja (pendiente)" no encontrado');
    }

    // 5. Crear la solicitud de baja
    const [nuevaBaja] = await db
      .insert(bajas)
      .values({
        equipoId: data.equipoId,
        motivo: data.motivo,
        observaciones: data.observaciones,
        estado: 'PENDIENTE',
        creadoPor: usuarioId,
        fechaCreacion: new Date().toISOString(),
      })
      .returning();

    // 6. Actualizar el estado del equipo a "De baja (pendiente)"
    await db
      .update(equipos)
      .set({
        estadoId: estadoPendiente.id,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(equipos.id, data.equipoId));

    // 7. Registrar en auditoría
    await auditService.registrar({
      usuarioId,
      accion: 'SOLICITAR_BAJA',
      tabla: 'bajas',
      registroId: nuevaBaja.id,
      datosDespues: {
        equipoId: data.equipoId,
        motivo: data.motivo,
      },
      ip,
    });

    // 8. Obtener baja completa
    const bajaCompleta = await this.obtenerPorId(nuevaBaja.id);

    if (!bajaCompleta) {
      throw new Error('Error al crear solicitud de baja');
    }

    return bajaCompleta;
  }

  /**
   * Aprobar o rechazar una baja
   */
  async procesar(
    bajaId: number,
    data: ProcesarBajaDto,
    usuarioId: number,
    ip?: string
  ): Promise<BajaCompleta> {
    // 1. Obtener la baja
    const [baja] = await db
      .select()
      .from(bajas)
      .where(eq(bajas.id, bajaId))
      .limit(1);

    if (!baja) {
      throw new Error('Solicitud de baja no encontrada');
    }

    // 2. Verificar que esté pendiente
    if (baja.estado !== 'PENDIENTE') {
      throw new Error(`Esta baja ya fue ${baja.estado.toLowerCase()}`);
    }

    // 3. Si se rechaza, validar motivo
    if (!data.aprobado && !data.motivoRechazo) {
      throw new Error('Debe proporcionar un motivo de rechazo');
    }

    const nuevoEstado = data.aprobado ? 'APROBADO' : 'RECHAZADO';

    // 4. Obtener el estado correspondiente del equipo
    let nombreEstadoEquipo: string;
    if (data.aprobado) {
      nombreEstadoEquipo = 'Dado de baja';
    } else {
      // Si se rechaza, volver al estado "Activo"
      nombreEstadoEquipo = 'Activo';
    }

    const [estadoEquipo] = await db
      .select()
      .from(estados)
      .where(eq(estados.nombre, nombreEstadoEquipo))
      .limit(1);

    if (!estadoEquipo) {
      throw new Error(`Estado "${nombreEstadoEquipo}" no encontrado`);
    }

    // 5. Actualizar la baja
    await db
      .update(bajas)
      .set({
        estado: nuevoEstado,
        aprobadoPor: usuarioId,
        motivoRechazo: data.motivoRechazo || null,
        fechaAprobacion: new Date().toISOString(),
      })
      .where(eq(bajas.id, bajaId));

    // 6. Actualizar el estado del equipo
    await db
      .update(equipos)
      .set({
        estadoId: estadoEquipo.id,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(equipos.id, baja.equipoId));

    // 7. Registrar en auditoría
    await auditService.registrar({
      usuarioId,
      accion: data.aprobado ? 'APROBAR_BAJA' : 'RECHAZAR_BAJA',
      tabla: 'bajas',
      registroId: bajaId,
      datosAntes: { estado: 'PENDIENTE' },
      datosDespues: {
        estado: nuevoEstado,
        motivoRechazo: data.motivoRechazo,
      },
      ip,
    });

    // 8. Obtener baja actualizada
    const bajaActualizada = await this.obtenerPorId(bajaId);

    if (!bajaActualizada) {
      throw new Error('Error al procesar baja');
    }

    return bajaActualizada;
  }

  /**
   * Listar bajas con filtros
   */
  async listar(filtros: ListarBajasDto) {
    const { equipoId, estado, motivo, page, limit } = filtros;
    const offset = (page - 1) * limit;

    // Construir condiciones
    const condiciones = [];

    if (equipoId) {
      condiciones.push(eq(bajas.equipoId, equipoId));
    }

    if (estado !== 'TODOS') {
      condiciones.push(eq(bajas.estado, estado));
    }

    if (motivo !== 'TODOS') {
      condiciones.push(eq(bajas.motivo, motivo));
    }

    // Obtener total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bajas)
      .where(condiciones.length > 0 ? and(...condiciones) : undefined);

    // Obtener registros
    const resultados = await db
      .select({
        id: bajas.id,
        motivo: bajas.motivo,
        observaciones: bajas.observaciones,
        estado: bajas.estado,
        motivoRechazo: bajas.motivoRechazo,
        fechaCreacion: bajas.fechaCreacion,
        fechaAprobacion: bajas.fechaAprobacion,
        equipo: {
          id: equipos.id,
          codigoSICOIN: equipos.codigoSICOIN,
          descripcion: equipos.descripcion,
          marca: equipos.marca,
          modelo: equipos.modelo,
          numeroSerie: equipos.numeroSerie,
        },
        creadoPor: {
          id: sql<number>`usuario_creador.id`,
          nombre: sql<string>`usuario_creador.nombre`,
        },
        aprobadoPor: {
          id: sql<number>`usuario_aprobador.id`,
          nombre: sql<string>`usuario_aprobador.nombre`,
        },
      })
      .from(bajas)
      .leftJoin(equipos, eq(bajas.equipoId, equipos.id))
      .leftJoin(
        sql`usuarios AS usuario_creador`,
        sql`${bajas.creadoPor} = usuario_creador.id`
      )
      .leftJoin(
        sql`usuarios AS usuario_aprobador`,
        sql`${bajas.aprobadoPor} = usuario_aprobador.id`
      )
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(desc(bajas.fechaCreacion))
      .limit(limit)
      .offset(offset);

    return {
      data: resultados as BajaCompleta[],
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / limit),
      },
    };
  }

  /**
   * Obtener baja por ID
   */
  async obtenerPorId(id: number): Promise<BajaCompleta | null> {
    const [baja] = await db
      .select({
        id: bajas.id,
        motivo: bajas.motivo,
        observaciones: bajas.observaciones,
        estado: bajas.estado,
        motivoRechazo: bajas.motivoRechazo,
        fechaCreacion: bajas.fechaCreacion,
        fechaAprobacion: bajas.fechaAprobacion,
        equipo: {
          id: equipos.id,
          codigoSICOIN: equipos.codigoSICOIN,
          descripcion: equipos.descripcion,
          marca: equipos.marca,
          modelo: equipos.modelo,
          numeroSerie: equipos.numeroSerie,
        },
        creadoPor: {
          id: sql<number>`usuario_creador.id`,
          nombre: sql<string>`usuario_creador.nombre`,
        },
        aprobadoPor: {
          id: sql<number>`usuario_aprobador.id`,
          nombre: sql<string>`usuario_aprobador.nombre`,
        },
      })
      .from(bajas)
      .leftJoin(equipos, eq(bajas.equipoId, equipos.id))
      .leftJoin(
        sql`usuarios AS usuario_creador`,
        sql`${bajas.creadoPor} = usuario_creador.id`
      )
      .leftJoin(
        sql`usuarios AS usuario_aprobador`,
        sql`${bajas.aprobadoPor} = usuario_aprobador.id`
      )
      .where(eq(bajas.id, id))
      .limit(1);

    return (baja as BajaCompleta) || null;
  }
}

export const bajaService = new BajaService();
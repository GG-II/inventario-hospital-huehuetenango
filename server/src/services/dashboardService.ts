import { db } from '../config/database';
import { equipos, estados, movimientos, bajas, areas } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export class DashboardService {
  /**
   * Obtener estadísticas generales del dashboard
   */
  async obtenerEstadisticas() {
    // Total de equipos
    const totalEquipos = await db
      .select({ count: sql<number>`count(*)` })
      .from(equipos);

    // Equipos por estado
    const equiposPorEstado = await db
      .select({
        estado: estados.nombre,
        color: estados.color,
        cantidad: sql<number>`count(*)`,
      })
      .from(equipos)
      .leftJoin(estados, eq(equipos.estadoId, estados.id))
      .groupBy(estados.id, estados.nombre, estados.color);

    // Últimos 5 traslados
    const ultimosTraslados = await db
      .select({
        id: movimientos.id,
        folio: movimientos.folioConocimiento,
        equipo: equipos.codigoSICOIN,
        descripcion: equipos.descripcion,
        areaOrigen: sql<string>`area_origen.nombre`,
        areaDestino: sql<string>`area_destino.nombre`,
        fecha: movimientos.fechaMovimiento,
      })
      .from(movimientos)
      .leftJoin(equipos, eq(movimientos.equipoId, equipos.id))
      .leftJoin(
        sql`${areas} as area_origen`,
        sql`${movimientos.areaOrigenId} = area_origen.id`
      )
      .leftJoin(
        sql`${areas} as area_destino`,
        sql`${movimientos.areaDestinoId} = area_destino.id`
      )
      .orderBy(desc(movimientos.fechaMovimiento))
      .limit(5);

    // Bajas pendientes
    const bajasPendientes = await db
      .select({
        id: bajas.id,
        equipo: equipos.codigoSICOIN,
        descripcion: equipos.descripcion,
        motivo: bajas.motivo,
        fecha: bajas.fechaCreacion,
      })
      .from(bajas)
      .leftJoin(equipos, eq(bajas.equipoId, equipos.id))
      .where(eq(bajas.estado, 'PENDIENTE'))
      .orderBy(desc(bajas.fechaCreacion))
      .limit(5);

    return {
      totalEquipos: totalEquipos[0].count,
      equiposPorEstado,
      ultimosTraslados,
      bajasPendientes: {
        cantidad: bajasPendientes.length,
        lista: bajasPendientes,
      },
    };
  }
}

export const dashboardService = new DashboardService();
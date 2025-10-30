import { db } from '../config/database';
import {
  equipos,
  usuarios,
  areas,
  subgrupos,
  estados,
  proveedores,
} from '../db/schema';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import { auditService } from './auditService';
import type {
  CrearEquipoDto,
  ActualizarEquipoDto,
  BuscarEquiposDto,
  EquipoCompleto,
} from '../types/equipo';

export class EquipoService {
  /**
   * Crear un nuevo equipo
   */
  async crear(data: CrearEquipoDto, usuarioId: number, ip?: string) {
    // 1. Verificar si ya existe un equipo con el mismo número de serie
    if (data.numeroSerie) {
      const [existente] = await db
        .select()
        .from(equipos)
        .where(eq(equipos.numeroSerie, data.numeroSerie))
        .limit(1);

      if (existente) {
        throw new Error('Ya existe un equipo con este número de serie');
      }
    }

    // 2. Crear el equipo
    const [nuevoEquipo] = await db
      .insert(equipos)
      .values({
        ...data,
        creadoPor: usuarioId,
      })
      .returning();

    // 3. Registrar en auditoría
    await auditService.registrar({
      usuarioId,
      accion: 'CREATE_EQUIPO',
      tabla: 'equipos',
      registroId: nuevoEquipo.id,
      datosDespues: nuevoEquipo,
      ip,
    });

    // 4. Obtener equipo completo con relaciones
    const equipoCompleto = await this.obtenerPorId(nuevoEquipo.id);

    return equipoCompleto;
  }

  /**
   * Listar equipos con filtros y paginación
   */
  async listar(filtros: BuscarEquiposDto) {
    const { busqueda, areaId, subgrupoId, estadoId, page, limit } = filtros;
    const offset = (page - 1) * limit;

    // Construir query base
    let query = db
      .select({
        id: equipos.id,
        codigoSICOIN: equipos.codigoSICOIN,
        descripcion: equipos.descripcion,
        marca: equipos.marca,
        modelo: equipos.modelo,
        numeroSerie: equipos.numeroSerie,
        precioUnitario: equipos.precioUnitario,
        fechaIngreso: equipos.fechaIngreso,
        estado: {
          id: estados.id,
          nombre: estados.nombre,
          color: estados.color,
        },
        area: {
          id: areas.id,
          nombre: areas.nombre,
        },
        subgrupo: {
          id: subgrupos.id,
          codigo: subgrupos.codigo,
          nombre: subgrupos.nombre,
        },
      })
      .from(equipos)
      .leftJoin(estados, eq(equipos.estadoId, estados.id))
      .leftJoin(areas, eq(equipos.areaId, areas.id))
      .leftJoin(subgrupos, eq(equipos.subgrupoId, subgrupos.id));

    // Aplicar filtros
    const condiciones = [];

    if (areaId) {
      condiciones.push(eq(equipos.areaId, areaId));
    }

    if (subgrupoId) {
      condiciones.push(eq(equipos.subgrupoId, subgrupoId));
    }

    if (estadoId) {
      condiciones.push(eq(equipos.estadoId, estadoId));
    }

    // Búsqueda por texto (simple por ahora, luego usaremos FTS5)
    if (busqueda) {
      condiciones.push(
        or(
          sql`${equipos.codigoSICOIN} LIKE ${'%' + busqueda + '%'}`,
          sql`${equipos.descripcion} LIKE ${'%' + busqueda + '%'}`,
          sql`${equipos.marca} LIKE ${'%' + busqueda + '%'}`,
          sql`${equipos.modelo} LIKE ${'%' + busqueda + '%'}`,
          sql`${equipos.numeroSerie} LIKE ${'%' + busqueda + '%'}`
        )
      );
    }

    if (condiciones.length > 0) {
      query = query.where(and(...condiciones)) as any;
    }

    // Obtener total de registros
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(equipos)
      .where(condiciones.length > 0 ? and(...condiciones) : undefined);

    // Obtener registros paginados
    const resultados = await query
      .orderBy(desc(equipos.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: resultados,
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / limit),
      },
    };
  }

  /**
   * Obtener equipo por ID con todas las relaciones
   */
  async obtenerPorId(id: number): Promise<EquipoCompleto | null> {
    const [equipo] = await db
      .select({
        id: equipos.id,
        codigoSICOIN: equipos.codigoSICOIN,
        descripcion: equipos.descripcion,
        marca: equipos.marca,
        modelo: equipos.modelo,
        numeroSerie: equipos.numeroSerie,
        precioUnitario: equipos.precioUnitario,
        numeroFactura: equipos.numeroFactura,
        fechaIngreso: equipos.fechaIngreso,
        observaciones: equipos.observaciones,
        estado: {
          id: estados.id,
          nombre: estados.nombre,
          color: estados.color,
        },
        area: {
          id: areas.id,
          nombre: areas.nombre,
          jefe: areas.jefe,
        },
        subgrupo: {
          id: subgrupos.id,
          codigo: subgrupos.codigo,
          nombre: subgrupos.nombre,
        },
        proveedor: proveedores
          ? {
              id: proveedores.id,
              nombreComercial: proveedores.nombreComercial,
            }
          : null,
        creadoPor: {
          id: usuarios.id,
          nombre: usuarios.nombre,
        },
        createdAt: equipos.createdAt,
        updatedAt: equipos.updatedAt,
      })
      .from(equipos)
      .leftJoin(estados, eq(equipos.estadoId, estados.id))
      .leftJoin(areas, eq(equipos.areaId, areas.id))
      .leftJoin(subgrupos, eq(equipos.subgrupoId, subgrupos.id))
      .leftJoin(proveedores, eq(equipos.proveedorId, proveedores.id))
      .leftJoin(usuarios, eq(equipos.creadoPor, usuarios.id))
      .where(eq(equipos.id, id))
      .limit(1);

    return equipo || null;
  }

  /**
   * Actualizar un equipo
   */
  async actualizar(
    id: number,
    data: ActualizarEquipoDto,
    usuarioId: number,
    ip?: string
  ) {
    // 1. Obtener datos antes del cambio
    const equipoAntes = await this.obtenerPorId(id);

    if (!equipoAntes) {
      throw new Error('Equipo no encontrado');
    }

    // 2. Verificar número de serie único si se está cambiando
    if (data.numeroSerie && data.numeroSerie !== equipoAntes.numeroSerie) {
      const [existente] = await db
        .select()
        .from(equipos)
        .where(
          and(
            eq(equipos.numeroSerie, data.numeroSerie),
            sql`${equipos.id} != ${id}`
          )
        )
        .limit(1);

      if (existente) {
        throw new Error('Ya existe un equipo con este número de serie');
      }
    }

    // 3. Actualizar equipo
    const [equipoActualizado] = await db
      .update(equipos)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(equipos.id, id))
      .returning();

    // 4. Registrar en auditoría
    await auditService.registrar({
      usuarioId,
      accion: 'UPDATE_EQUIPO',
      tabla: 'equipos',
      registroId: id,
      datosAntes: equipoAntes,
      datosDespues: equipoActualizado,
      ip,
    });

    // 5. Obtener equipo completo actualizado
    const equipoCompleto = await this.obtenerPorId(id);

    return equipoCompleto;
  }
}

export const equipoService = new EquipoService();
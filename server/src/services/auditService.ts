import { db } from '../config/database';
import { auditoria } from '../db/schema';

interface RegistrarAuditoriaParams {
  usuarioId: number;
  accion: string;
  tabla: string;
  registroId?: number;
  datosAntes?: any;
  datosDespues?: any;
  ip?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Registra una acción en la auditoría
   */
  async registrar(params: RegistrarAuditoriaParams) {
    try {
      await db.insert(auditoria).values({
        usuarioId: params.usuarioId,
        accion: params.accion,
        tabla: params.tabla,
        registroId: params.registroId || null,
        datosAntes: params.datosAntes ? JSON.stringify(params.datosAntes) : null,
        datosDespues: params.datosDespues ? JSON.stringify(params.datosDespues) : null,
        ip: params.ip || null,
        userAgent: params.userAgent || null,
      });
    } catch (error) {
      // No fallar la operación principal si falla la auditoría
      console.error('Error al registrar auditoría:', error);
    }
  }

  /**
   * Obtiene el historial de un equipo
   */
  async obtenerHistorialEquipo(equipoId: number) {
    const historial = await db
      .select()
      .from(auditoria)
      .where(eq(auditoria.registroId, equipoId))
      .orderBy(desc(auditoria.createdAt));

    return historial;
  }
}

export const auditService = new AuditService();
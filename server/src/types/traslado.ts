import { z } from 'zod';

/**
 * Schema para crear traslado
 */
export const crearTrasladoSchema = z.object({
  equipoId: z.number().int().positive('Equipo inválido'),
  areaDestinoId: z.number().int().positive('Área destino inválida'),
  observaciones: z.string().max(1000).optional(),
});

export type CrearTrasladoDto = z.infer<typeof crearTrasladoSchema>;

/**
 * Schema para listar traslados
 */
export const listarTrasladosSchema = z.object({
  equipoId: z.coerce.number().int().positive().optional(),
  areaOrigenId: z.coerce.number().int().positive().optional(),
  areaDestinoId: z.coerce.number().int().positive().optional(),
  fechaInicio: z.string().datetime().optional(),
  fechaFin: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type ListarTrasladosDto = z.infer<typeof listarTrasladosSchema>;

/**
 * Interface para traslado completo
 */
export interface TrasladoCompleto {
  id: number;
  tipo: string;
  folioConocimiento: string | null;
  observaciones: string | null;
  fechaMovimiento: string;
  equipo: {
    id: number;
    codigoSICOIN: string;
    descripcion: string;
  };
  areaOrigen: {
    id: number;
    nombre: string;
  };
  areaDestino: {
    id: number;
    nombre: string;
  };
  usuario: {
    id: number;
    nombre: string;
  };
}

/**
 * Interface para historial de equipo
 */
export interface HistorialEquipo {
  movimientos: TrasladoCompleto[];
  auditoria: Array<{
    id: number;
    accion: string;
    usuario: string;
    fecha: string;
    cambios: {
      antes: any;
      despues: any;
    };
  }>;
}
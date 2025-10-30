import { z } from 'zod';

/**
 * Motivos de baja permitidos
 */
export const MOTIVOS_BAJA = [
  'IRREPARABLE',
  'OBSOLETO',
  'PERDIDA_TOTAL',
  'ROBO',
] as const;

/**
 * Estados de baja
 */
export const ESTADOS_BAJA = ['PENDIENTE', 'APROBADO', 'RECHAZADO'] as const;

/**
 * Schema para solicitar baja
 */
export const solicitarBajaSchema = z.object({
  equipoId: z.number().int().positive('Equipo inválido'),
  motivo: z.enum(MOTIVOS_BAJA, {
    errorMap: () => ({ message: 'Motivo inválido' }),
  }),
  observaciones: z
    .string()
    .min(20, 'Las observaciones deben tener al menos 20 caracteres')
    .max(1000, 'Observaciones muy largas'),
});

export type SolicitarBajaDto = z.infer<typeof solicitarBajaSchema>;

/**
 * Schema para aprobar/rechazar baja
 */
export const procesarBajaSchema = z.object({
  aprobado: z.boolean(),
  motivoRechazo: z.string().max(500).optional(),
});

export type ProcesarBajaDto = z.infer<typeof procesarBajaSchema>;

/**
 * Schema para listar bajas
 */
export const listarBajasSchema = z.object({
  equipoId: z.coerce.number().int().positive().optional(),
  estado: z.enum([...ESTADOS_BAJA, 'TODOS']).default('TODOS'),
  motivo: z.enum([...MOTIVOS_BAJA, 'TODOS']).default('TODOS'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type ListarBajasDto = z.infer<typeof listarBajasSchema>;

/**
 * Interface para baja completa
 */
export interface BajaCompleta {
  id: number;
  motivo: string;
  observaciones: string;
  estado: string;
  motivoRechazo: string | null;
  fechaCreacion: string;
  fechaAprobacion: string | null;
  equipo: {
    id: number;
    codigoSICOIN: string;
    descripcion: string;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
  };
  creadoPor: {
    id: number;
    nombre: string;
  };
  aprobadoPor: {
    id: number;
    nombre: string;
  } | null;
}
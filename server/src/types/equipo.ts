import { z } from 'zod';

/**
 * Schema para crear equipo
 */
export const crearEquipoSchema = z.object({
  codigoSICOIN: z
    .string()
    .min(1, 'Código SICOIN es obligatorio')
    .max(50, 'Código SICOIN muy largo'),
  descripcion: z
    .string()
    .min(10, 'Descripción debe tener al menos 10 caracteres')
    .max(500, 'Descripción muy larga'),
  marca: z.string().max(100).optional(),
  modelo: z.string().max(100).optional(),
  numeroSerie: z.string().max(100).optional(),
  precioUnitario: z
    .number()
    .positive('Precio debe ser mayor a cero')
    .int('Precio debe ser un número entero (en centavos)'),
  estadoId: z.number().int().positive('Estado inválido'),
  areaId: z.number().int().positive('Área inválida'),
  subgrupoId: z.number().int().positive('Subgrupo inválido'),
  proveedorId: z.number().int().positive().optional(),
  numeroFactura: z.string().max(50).optional(),
  fechaIngreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD'),
  observaciones: z.string().max(1000).optional(),
});

export type CrearEquipoDto = z.infer<typeof crearEquipoSchema>;

/**
 * Schema para actualizar equipo
 */
export const actualizarEquipoSchema = z.object({
  descripcion: z
    .string()
    .min(10, 'Descripción debe tener al menos 10 caracteres')
    .max(500)
    .optional(),
  marca: z.string().max(100).optional(),
  modelo: z.string().max(100).optional(),
  numeroSerie: z.string().max(100).optional(),
  precioUnitario: z
    .number()
    .positive('Precio debe ser mayor a cero')
    .int('Precio debe ser un número entero (en centavos)')
    .optional(),
  estadoId: z.number().int().positive().optional(),
  areaId: z.number().int().positive().optional(),
  proveedorId: z.number().int().positive().optional(),
  numeroFactura: z.string().max(50).optional(),
  fechaIngreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD').optional(),
  observaciones: z.string().max(1000).optional(),
});

export type ActualizarEquipoDto = z.infer<typeof actualizarEquipoSchema>;

/**
 * Schema para filtros de búsqueda
 */
export const buscarEquiposSchema = z.object({
  busqueda: z.string().optional(),
  areaId: z.coerce.number().int().positive().optional(),
  subgrupoId: z.coerce.number().int().positive().optional(),
  estadoId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type BuscarEquiposDto = z.infer<typeof buscarEquiposSchema>;

/**
 * Interface para equipo completo
 */
export interface EquipoCompleto {
  id: number;
  codigoSICOIN: string;
  descripcion: string;
  marca: string | null;
  modelo: string | null;
  numeroSerie: string | null;
  precioUnitario: number;
  numeroFactura: string | null;
  fechaIngreso: string;
  observaciones: string | null;
  estado: {
    id: number;
    nombre: string;
    color: string | null;
  };
  area: {
    id: number;
    nombre: string;
    jefe: string | null;
  };
  subgrupo: {
    id: number;
    codigo: string;
    nombre: string;
  };
  proveedor: {
    id: number;
    nombreComercial: string;
  } | null;
  creadoPor: {
    id: number;
    nombre: string;
  };
  createdAt: string;
  updatedAt: string | null;
}
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { areas, subgrupos, estados, proveedores } from './catalogos';
import { usuarios } from './usuarios';

export const equipos = sqliteTable('equipos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codigoSICOIN: text('codigo_sicoin').notNull(),
  descripcion: text('descripcion').notNull(),
  marca: text('marca'),
  modelo: text('modelo'),
  numeroSerie: text('numero_serie').unique(),
  precioUnitario: integer('precio_unitario').notNull(), // En centavos
  estadoId: integer('estado_id').notNull().references(() => estados.id),
  areaId: integer('area_id').notNull().references(() => areas.id),
  subgrupoId: integer('subgrupo_id').notNull().references(() => subgrupos.id),
  proveedorId: integer('proveedor_id').references(() => proveedores.id),
  numeroFactura: text('numero_factura'),
  fechaIngreso: text('fecha_ingreso').notNull(), // ISO string
  observaciones: text('observaciones'),
  fotoUrl: text('foto_url'),
  creadoPor: integer('creado_por').notNull().references(() => usuarios.id),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});
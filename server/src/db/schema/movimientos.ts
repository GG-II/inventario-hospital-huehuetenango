import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { equipos } from './equipos';
import { areas } from './catalogos';
import { usuarios } from './usuarios';

export const movimientos = sqliteTable('movimientos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  equipoId: integer('equipo_id').notNull().references(() => equipos.id),
  tipo: text('tipo').notNull(), // "TRASLADO", "PRESTAMO", "DEVOLUCION"
  areaOrigenId: integer('area_origen_id').notNull().references(() => areas.id),
  areaDestinoId: integer('area_destino_id').notNull().references(() => areas.id),
  folioConocimiento: text('folio_conocimiento'),
  observaciones: text('observaciones'),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id),
  fechaMovimiento: text('fecha_movimiento').notNull().default('CURRENT_TIMESTAMP'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});
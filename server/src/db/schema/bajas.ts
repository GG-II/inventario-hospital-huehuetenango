import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { equipos } from './equipos';
import { usuarios } from './usuarios';

export const bajas = sqliteTable('bajas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  equipoId: integer('equipo_id').notNull().references(() => equipos.id),
  motivo: text('motivo').notNull(), // "IRREPARABLE", "OBSOLETO", "PERDIDA_TOTAL", "ROBO"
  observaciones: text('observaciones').notNull(),
  estado: text('estado').notNull().default('PENDIENTE'), // "PENDIENTE", "APROBADO", "RECHAZADO"
  fotosUrls: text('fotos_urls'), // JSON array de URLs
  creadoPor: integer('creado_por').notNull().references(() => usuarios.id),
  aprobadoPor: integer('aprobado_por').references(() => usuarios.id),
  motivoRechazo: text('motivo_rechazo'),
  fechaCreacion: text('fecha_creacion').notNull().default('CURRENT_TIMESTAMP'),
  fechaAprobacion: text('fecha_aprobacion'),
});
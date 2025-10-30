import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { usuarios } from './usuarios';

export const auditoria = sqliteTable('auditoria', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id),
  accion: text('accion').notNull(), // "CREATE", "UPDATE", "DELETE", "LOGIN", etc.
  tabla: text('tabla').notNull(),
  registroId: integer('registro_id'),
  datosAntes: text('datos_antes'), // JSON
  datosDespues: text('datos_despues'), // JSON
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull().unique(),
  permisos: text('permisos').notNull(), // JSON array de permisos
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

export const usuarios = sqliteTable('usuarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // Hash bcrypt
  nombre: text('nombre').notNull(),
  email: text('email'),
  rolId: integer('rol_id').notNull().references(() => roles.id),
  areaId: integer('area_id'), // Solo para Jefes de Servicio
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});
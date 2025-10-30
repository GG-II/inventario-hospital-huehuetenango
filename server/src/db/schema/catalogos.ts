import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const areas = sqliteTable('areas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  jefe: text('jefe'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const subgrupos = sqliteTable('subgrupos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codigo: text('codigo').notNull().unique(), // 321, 322, etc.
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
});

export const estados = sqliteTable('estados', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull().unique(),
  color: text('color'), // Para UI: "green", "yellow", "red"
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
});

export const proveedores = sqliteTable('proveedores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombreComercial: text('nombre_comercial').notNull(),
  nit: text('nit'),
  direccion: text('direccion'),
  telefono: text('telefono'),
  email: text('email'),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});
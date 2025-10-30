CREATE TABLE `auditoria` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` integer NOT NULL,
	`accion` text NOT NULL,
	`tabla` text NOT NULL,
	`registro_id` integer,
	`datos_antes` text,
	`datos_despues` text,
	`ip` text,
	`user_agent` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bajas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`equipo_id` integer NOT NULL,
	`motivo` text NOT NULL,
	`observaciones` text NOT NULL,
	`estado` text DEFAULT 'PENDIENTE' NOT NULL,
	`fotos_urls` text,
	`creado_por` integer NOT NULL,
	`aprobado_por` integer,
	`motivo_rechazo` text,
	`fecha_creacion` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`fecha_aprobacion` text,
	FOREIGN KEY (`equipo_id`) REFERENCES `equipos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`creado_por`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`aprobado_por`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `areas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`jefe` text,
	`activo` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `estados` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`color` text,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `estados_nombre_unique` ON `estados` (`nombre`);--> statement-breakpoint
CREATE TABLE `proveedores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre_comercial` text NOT NULL,
	`nit` text,
	`direccion` text,
	`telefono` text,
	`email` text,
	`activo` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subgrupos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`codigo` text NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subgrupos_codigo_unique` ON `subgrupos` (`codigo`);--> statement-breakpoint
CREATE TABLE `equipos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`codigo_sicoin` text NOT NULL,
	`descripcion` text NOT NULL,
	`marca` text,
	`modelo` text,
	`numero_serie` text,
	`precio_unitario` integer NOT NULL,
	`estado_id` integer NOT NULL,
	`area_id` integer NOT NULL,
	`subgrupo_id` integer NOT NULL,
	`proveedor_id` integer,
	`numero_factura` text,
	`fecha_ingreso` text NOT NULL,
	`observaciones` text,
	`creado_por` integer NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`estado_id`) REFERENCES `estados`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subgrupo_id`) REFERENCES `subgrupos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`creado_por`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `equipos_numero_serie_unique` ON `equipos` (`numero_serie`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`permisos` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_nombre_unique` ON `roles` (`nombre`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`nombre` text NOT NULL,
	`email` text,
	`rol_id` integer NOT NULL,
	`area_id` integer,
	`activo` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_username_unique` ON `usuarios` (`username`);--> statement-breakpoint
CREATE TABLE `movimientos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`equipo_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`area_origen_id` integer NOT NULL,
	`area_destino_id` integer NOT NULL,
	`folio_conocimiento` text,
	`observaciones` text,
	`usuario_id` integer NOT NULL,
	`fecha_movimiento` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`equipo_id`) REFERENCES `equipos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`area_origen_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`area_destino_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);

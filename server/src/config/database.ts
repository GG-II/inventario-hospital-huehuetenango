import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Construir URL válida para libsql
const dbPath = process.env.DATABASE_PATH || './database.sqlite';
const dbUrl = dbPath.startsWith('file:') 
  ? dbPath 
  : `file:${path.resolve(dbPath)}`;

export const client = createClient({
  url: dbUrl,
});

export const db = drizzle(client, { schema });
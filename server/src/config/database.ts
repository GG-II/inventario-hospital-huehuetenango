import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';
import dotenv from 'dotenv';

dotenv.config();

export const client = createClient({
  url: process.env.DATABASE_PATH || 'file:./database.sqlite',
});

export const db = drizzle(client, { schema });
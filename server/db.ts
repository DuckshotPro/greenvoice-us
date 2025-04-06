import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

// Connect to the database using the Neon serverless driver
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
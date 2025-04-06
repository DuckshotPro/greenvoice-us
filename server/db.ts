import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Connect to the database using postgres-js
const connectionString = process.env.DATABASE_URL!;
// For Drizzle with postgres-js we need to use prepared statements
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from '../shared/schema.js';

console.log('Starting database schema push...');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  console.log('Pushing schema to database...');
  try {
    // Define all tables in the schema
    const tables = [
      schema.users,
      schema.lineItems,
      schema.coupons,
      schema.invoices,
      schema.recurringTemplates,
      schema.templateLineItems,
      schema.scheduledInvoices,
      schema.subscriptionPlans,
      schema.subscriptionTransactions,
      schema.adRewards,
      schema.shareAnalytics
    ];
    
    // Create tables if they don't exist
    for (const table of tables) {
      const tableName = table._.name;
      console.log(`Creating table if not exists: ${tableName}`);
      
      // Get the SQL for creating this table
      const createTableSQL = db.dialect.com.tablesHelper.getCreateTableQuery(table);
      console.log(`Executing: ${createTableSQL}`);
      
      // Execute the create table SQL
      await pool.query(createTableSQL);
    }
    
    console.log('Schema push completed successfully');
  } catch (error) {
    console.error('Error pushing schema:', error);
  } finally {
    await pool.end();
  }
}

main();
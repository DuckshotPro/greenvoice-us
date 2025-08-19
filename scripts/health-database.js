
#!/usr/bin/env node

import { db } from '../server/models/db.js';

console.log('🔍 Checking database health...');

async function checkDatabaseHealth() {
  try {
    const startTime = Date.now();
    
    // Test basic connectivity
    await db.execute('SELECT 1');
    const connectionTime = Date.now() - startTime;
    
    console.log('✅ Database connection: OK');
    console.log(`⏱️  Connection time: ${connectionTime}ms`);
    
    // Check if connection time is acceptable
    if (connectionTime > 1000) {
      console.log('⚠️  Warning: Slow database connection');
    }
    
    // Test query performance
    const queryStart = Date.now();
    await db.execute('SELECT COUNT(*) FROM users');
    const queryTime = Date.now() - queryStart;
    
    console.log(`⏱️  Query time: ${queryTime}ms`);
    
    if (queryTime > 500) {
      console.log('⚠️  Warning: Slow query performance');
    }
    
    console.log('\n✅ Database health check completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database health check failed:');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabaseHealth();

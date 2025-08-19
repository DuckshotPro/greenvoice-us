
#!/usr/bin/env node

console.log('🔍 Checking memory health...');

function formatBytes(bytes) {
  return Math.round(bytes / 1024 / 1024) + ' MB';
}

function checkMemoryHealth() {
  const memoryUsage = process.memoryUsage();
  
  console.log('💾 Memory Usage:');
  console.log(`   RSS: ${formatBytes(memoryUsage.rss)}`);
  console.log(`   Heap Total: ${formatBytes(memoryUsage.heapTotal)}`);
  console.log(`   Heap Used: ${formatBytes(memoryUsage.heapUsed)}`);
  console.log(`   External: ${formatBytes(memoryUsage.external)}`);
  
  // Calculate heap usage percentage
  const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  console.log(`   Heap Usage: ${heapUsagePercent.toFixed(1)}%`);
  
  // Check for memory issues
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
  const rssMB = memoryUsage.rss / 1024 / 1024;
  
  let status = 'healthy';
  const warnings = [];
  
  if (heapUsedMB > 500) {
    warnings.push('High heap usage detected');
    status = 'warning';
  }
  
  if (rssMB > 1000) {
    warnings.push('High RSS memory usage detected');
    status = 'warning';
  }
  
  if (heapUsagePercent > 90) {
    warnings.push('Heap usage above 90%');
    status = 'critical';
  }
  
  console.log(`\n📊 Process Info:`);
  console.log(`   Uptime: ${Math.round(process.uptime())} seconds`);
  console.log(`   PID: ${process.pid}`);
  console.log(`   Node Version: ${process.version}`);
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  Memory warnings:`);
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (status === 'healthy') {
    console.log('\n✅ Memory health check passed');
    process.exit(0);
  } else if (status === 'warning') {
    console.log('\n⚠️  Memory health check completed with warnings');
    process.exit(0);
  } else {
    console.log('\n❌ Memory health check failed');
    process.exit(1);
  }
}

checkMemoryHealth();

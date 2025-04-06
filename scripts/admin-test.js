/**
 * This script tests the admin API endpoints
 * Run with: node scripts/admin-test.js
 */

const ADMIN_API_KEY = 'test-admin-key'; // Replace with your actual admin API key

async function testAdminEndpoints() {
  // Helper function for API calls
  async function callApi(endpoint, options = {}) {
    const baseUrl = 'http://localhost:5000';
    const url = `${baseUrl}${endpoint}`;
    
    // Add admin headers by default
    const headers = {
      'Content-Type': 'application/json',
      'X-Admin-API-Key': ADMIN_API_KEY,
      ...options.headers
    };
    
    try {
      console.log(`Calling ${options.method || 'GET'} ${endpoint}...`);
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      
      const data = await response.json();
      console.log(`Response (${response.status}):`, JSON.stringify(data, null, 2));
      return { status: response.status, data };
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error.message);
      return { error: error.message };
    }
  }
  
  // Test error logs endpoint
  console.log('\n=== Testing Error Logs Endpoint ===');
  await callApi('/api/admin/logs');
  
  // Test database health endpoint
  console.log('\n=== Testing Database Health Endpoint ===');
  await callApi('/api/admin/db-health');
  
  // Test system information endpoint
  console.log('\n=== Testing System Information Endpoint ===');
  await callApi('/api/admin/system');
  
  // Test unauthorized access
  console.log('\n=== Testing Unauthorized Access ===');
  await callApi('/api/admin/logs', { 
    headers: { 'X-Admin-API-Key': 'wrong-key' } 
  });
}

// Run the tests
testAdminEndpoints().catch(console.error);
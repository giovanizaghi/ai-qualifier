#!/usr/bin/env node

/**
 * Docker Health Check Script for AI Qualifier
 * This script is used by Docker to determine if the container is healthy
 */

const http = require('http');
const process = require('process');

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || 'localhost';

// Health check options
const options = {
  hostname,
  port,
  path: '/api/health',
  method: 'GET',
  timeout: 10000, // 10 seconds
  headers: {
    'User-Agent': 'Docker-Health-Check',
    'Accept': 'application/json'
  }
};

// Perform health check
const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200 && response.status === 'healthy') {
        console.log('✅ Health check passed');
        process.exit(0);
      } else if (res.statusCode === 200 && response.status === 'degraded') {
        console.log('⚠️  Health check degraded but acceptable');
        process.exit(0);
      } else {
        console.error('❌ Health check failed:', response);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Health check response parsing failed:', error.message);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Health check request failed:', error.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Health check timed out');
  req.destroy();
  process.exit(1);
});

// Set timeout
req.setTimeout(10000);

// Send request
req.end();
#!/usr/bin/env node

/**
 * This script fixes the logger.js file in the dist directory
 * to ensure it works in production without pino-pretty.
 */
const fs = require('fs');
const path = require('path');

const loggerPath = path.join(__dirname, '../dist/utils/logger.js');

console.log(`Checking for logger file at: ${loggerPath}`);

if (!fs.existsSync(loggerPath)) {
  console.error('Logger file not found! Build may not have completed.');
  process.exit(1);
}

console.log('Reading logger file...');
let content = fs.readFileSync(loggerPath, 'utf-8');

// Check if we need to modify the file
if (content.includes('transport:') && content.includes('pino-pretty')) {
  console.log('Modifying logger file for production...');
  
  // Create a regex to match the transport configuration
  const transportRegex = /transport:\s*{\s*target:\s*['"]pino-pretty['"],\s*options:\s*{\s*colorize:\s*true\s*}\s*},?/g;
  
  // Remove the transport configuration
  content = content.replace(transportRegex, '');
  
  // Write the modified file
  fs.writeFileSync(loggerPath, content);
  console.log('Logger file modified successfully for production!');
} else {
  console.log('Logger file already configured for production, no changes needed.');
}

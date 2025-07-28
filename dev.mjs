#!/usr/bin/env node

/**
 * Development server that starts both Express backend and Vite dev server
 */

import { spawn } from 'child_process';
import { createServer } from 'vite';

console.log('🚀 Starting development environment...');

// Start Express server in background
console.log('🌐 Starting Express server...');
const expressProcess = spawn('node', ['express.js'], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

// Wait a moment for Express to start
await new Promise((resolve) => setTimeout(resolve, 1000));

// Start Vite dev server
console.log('📦 Starting Vite dev server...');
const viteServer = await createServer({
  configFile: './vite.config.js',
  server: {
    port: 5173,
    cors: true,
    host: true,
  },
});

await viteServer.listen();

console.log('✅ Express server running on http://localhost:3000');
console.log('✅ Vite dev server running on http://localhost:5173');
console.log('');
console.log(
  '🌐 Open your browser to http://localhost:3000 to see the application',
);
console.log(
  '🔄 JavaScript modules will be served with HMR from Vite dev server',
);
console.log('');
console.log('Press Ctrl+C to stop both servers');

// Handle shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down development servers...');
  await viteServer.close();
  expressProcess.kill('SIGTERM');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

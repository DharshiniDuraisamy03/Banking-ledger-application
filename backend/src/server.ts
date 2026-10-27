import { app } from './app.js';
import { config } from './config/index.js';
import { initDb } from './db/index.js';

// Ensure database schema and constraints are initialized
initDb();

const server = app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(`🏦 Bank Ledger API is running`);
  console.log(`📡 URL: http://localhost:${config.port}`);
  console.log(`🩺 Health: http://localhost:${config.port}/health`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`=========================================`);
});

// Graceful shutdown handling
const shutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

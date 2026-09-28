import { createApp } from './app';
import { config } from './config';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`
  🚀 MakeMyMarriage Modular Monolith API
  -----------------------------------------------
  📡 API Base URL:  http://localhost:${config.port}${config.apiPrefix}
  📖 Swagger Docs:  http://localhost:${config.port}/docs
  🩺 Health Check:  http://localhost:${config.port}/health
  🌍 Environment:   ${config.env}
  -----------------------------------------------
  `);
});

// Graceful shutdown
const shutdown = () => {
  console.log('Stopping server...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

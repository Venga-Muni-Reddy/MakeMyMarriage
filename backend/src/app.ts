import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { config } from './config';
import { apiRouter } from './routes';
import { swaggerSpec } from './shared/docs/swagger';
import { errorHandler } from './middleware/error.middleware';
import { standardRateLimiter } from './middleware/rate-limiter.middleware';
import { NotFoundError } from './shared/errors/api-error';

export function createApp(): Express {
  const app = express();

  // Trust reverse proxy (Vercel / Cloudflare / Render) for rate-limiting & IP resolution
  app.set('trust proxy', 1);

  // Basic security and telemetry
  app.use(helmet({ contentSecurityPolicy: false })); // Permissive CSP for swagger docs
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (
          config.corsOrigin === '*' ||
          origin === config.corsOrigin ||
          origin.includes('localhost') ||
          origin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        return callback(null, origin);
      },
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (config.env !== 'test') {
    app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
  }

  // Rate limiter
  app.use(standardRateLimiter);

  // API Documentation (OpenAPI / Swagger)
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs/openapi.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  // Root health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'MakeMyMarriage Backend' });
  });

  // Mount API v1
  app.use(config.apiPrefix, apiRouter);

  // 404 Catch-all
  app.use((_req, _res, next) => {
    next(new NotFoundError('The requested resource was not found'));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;

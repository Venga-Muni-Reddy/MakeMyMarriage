import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '../../config';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MakeMyMarriage API',
      version: '1.0.0',
      description: 'MakeMyMarriage Modular Monolith API',
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.apiPrefix}`,
      },
    ],
  },
  apis: ['./src/routes.ts'],
});

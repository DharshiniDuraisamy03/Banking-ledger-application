import express, { Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './types/index.js';
import { accountRouter } from './routes/account.routes.js';
import { transferRouter } from './routes/transfer.routes.js';

export const app = express();

// Core middlewares
app.use(cors());
app.use(express.json());

// Healthcheck endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'bank-ledger-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root welcome endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'Bank Ledger & Transfer API',
    version: '1.0.0',
    description: 'ACID-compliant banking ledger with transactions, transfers, and pagination',
    endpoints: {
      health: 'GET /health',
      accounts: 'GET /api/accounts, POST /api/accounts, GET /api/accounts/:id',
      transactions: 'POST /api/accounts/:id/transactions, GET /api/accounts/:id/transactions',
      transfers: 'POST /api/transfers, GET /api/transfers',
    },
  });
});

// API Routes
app.use('/api/accounts', accountRouter);
app.use('/api/transfers', transferRouter);

// Fallback 404 handler for undefined routes
app.use((req: Request, _res: Response, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));
});

// Centralized error handling
app.use(errorHandler);

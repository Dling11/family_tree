import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './routes/authRoutes.js';
import { dashboardImageRouter } from './routes/dashboardImageRoutes.js';
import { familyGroupRouter } from './routes/familyGroupRoutes.js';
import { memberRouter } from './routes/memberRoutes.js';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/dashboard-images', dashboardImageRouter);
app.use('/api/family-groups', familyGroupRouter);
app.use('/api/members', memberRouter);
app.use((_request, response) => response.status(404).json({ message: 'Route not found' }));
app.use((error: Error & { status?: number; code?: number }, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  response.status(error.status || (error.code === 11000 ? 409 : 500)).json({ message: error.message || 'Unexpected server error' });
});

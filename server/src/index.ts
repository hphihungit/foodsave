import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import os from 'os';
import { connectDb } from './db';
import { HttpError } from './middleware/auth';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import storeRoutes from './routes/stores';
import bagRoutes from './routes/bags';
import orderRoutes from './routes/orders';
import impactRoutes from './routes/impact';
import campaignRoutes from './routes/campaigns';
import taskRoutes from './routes/tasks';
import uploadRoutes, { UPLOAD_DIR } from './routes/upload';
import { seed } from './seed';
import { Store } from './models';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use((req, _res, next) => {
  console.log(`${new Date().toLocaleTimeString()} ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'FoodSave API' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/bags', bagRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(UPLOAD_DIR));

app.use((_req, res) => res.status(404).json({ message: 'Không tìm thấy API' }));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Mã không hợp lệ' });
  if (err?.name === 'ValidationError') return res.status(400).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại' });
});

const PORT = Number(process.env.PORT ?? 4000);

(async () => {
  const inMemory = await connectDb();
  // Seed automatically when the database is empty (always the case in memory mode).
  if (inMemory || (await Store.estimatedDocumentCount()) === 0) await seed();
  app.listen(PORT, '0.0.0.0', () => {
    const ips = Object.values(os.networkInterfaces())
      .flat()
      .filter((n) => n && n.family === 'IPv4' && !n.internal)
      .map((n) => `http://${n!.address}:${PORT}`);
    console.log(`🚀 FoodSave API đang chạy: http://localhost:${PORT}`);
    console.log(`📱 Từ điện thoại (cùng Wi-Fi): ${ips.join('  ·  ')}`);
  });
})();

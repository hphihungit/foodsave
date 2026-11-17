import mongoose from 'mongoose';

let memoryServer: { stop: () => Promise<boolean> } | null = null;

/**
 * Connects to MONGODB_URI. If it is not set, starts an in-memory MongoDB so the
 * app can be tried before an Atlas cluster exists (data is lost on restart).
 * Returns true when the in-memory fallback is used.
 */
export async function connectDb(): Promise<boolean> {
  let uri = process.env.MONGODB_URI;
  let inMemory = false;
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const server = await MongoMemoryServer.create();
    memoryServer = server;
    uri = server.getUri('foodsave');
    inMemory = true;
    console.warn('⚠️  MONGODB_URI chưa được đặt — đang dùng MongoDB trong bộ nhớ (mất dữ liệu khi tắt server).');
  }
  await mongoose.connect(uri);
  console.log(`✅ Đã kết nối MongoDB (${inMemory ? 'in-memory' : mongoose.connection.host})`);
  return inMemory;
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

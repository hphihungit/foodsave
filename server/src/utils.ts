import { Notification, PointTx, User } from './models';

export function publicUser(u: any) {
  const obj = typeof u.toObject === 'function' ? u.toObject() : u;
  const { passwordHash, __v, ...rest } = obj;
  return rest;
}

export async function notify(user: any, title: string, body: string, type = 'system') {
  await Notification.create({ user, title, body, type });
}

export async function addPoints(user: any, amount: number, reason: string) {
  if (!amount) return;
  await PointTx.create({ user, type: amount > 0 ? 'earn' : 'spend', amount: Math.abs(amount), reason });
  await User.updateOne({ _id: user }, { $inc: { points: amount } });
}

/** Distance in km between two lat/lng points (haversine). */
export function distanceKm(a?: { lat?: number | null; lng?: number | null } | null, b?: { lat?: number; lng?: number }) {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return undefined;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)) * 10) / 10;
}

export function randomCode(len = 6, chars = '0123456789') {
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** CO2 avoided per kg of food rescued (rough figure used for the impact UI). */
export const CO2_PER_KG = 2.5;

import { Router } from 'express';
import { User, Store, Notification, PointTx } from '../models';
import { ah, requireAuth, HttpError } from '../middleware/auth';
import { publicUser } from '../utils';

const r = Router();
r.use(requireAuth);

const EDITABLE = ['name', 'phone', 'avatar', 'gender', 'birthday', 'interests', 'notificationSettings', 'language', 'vehicle', 'area'];

r.patch(
  '/me',
  ah(async (req, res) => {
    const update: Record<string, unknown> = {};
    for (const k of EDITABLE) if (req.body?.[k] !== undefined) update[k] = req.body[k];
    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản');
    res.json({ user: publicUser(user) });
  }),
);

// ---- Addresses (B-58) ----
r.post(
  '/me/addresses',
  ah(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản');
    if (req.body.isDefault) user.addresses.forEach((a: any) => (a.isDefault = false));
    user.addresses.push({ ...req.body, isDefault: req.body.isDefault ?? user.addresses.length === 0 });
    await user.save();
    res.status(201).json({ user: publicUser(user) });
  }),
);
r.patch(
  '/me/addresses/:id',
  ah(async (req, res) => {
    const user = await User.findById(req.userId);
    const addr: any = user?.addresses.id(String(req.params.id));
    if (!user || !addr) throw new HttpError(404, 'Không tìm thấy địa chỉ');
    if (req.body.isDefault) user.addresses.forEach((a: any) => (a.isDefault = false));
    Object.assign(addr, req.body);
    await user.save();
    res.json({ user: publicUser(user) });
  }),
);
r.delete(
  '/me/addresses/:id',
  ah(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản');
    user.addresses.pull({ _id: req.params.id });
    await user.save();
    res.json({ user: publicUser(user) });
  }),
);

// ---- Saved cards (B-29, B-59). Only brand + last 4 digits are stored. ----
r.post(
  '/me/cards',
  ah(async (req, res) => {
    const { number = '', holder, brand } = req.body ?? {};
    const digits = String(number).replace(/\D/g, '');
    if (digits.length < 12) throw new HttpError(400, 'Số thẻ không hợp lệ');
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản');
    user.cards.push({
      brand: brand || (digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : 'Thẻ'),
      last4: digits.slice(-4),
      holder,
      isDefault: user.cards.length === 0,
    });
    await user.save();
    res.status(201).json({ user: publicUser(user) });
  }),
);
r.delete(
  '/me/cards/:id',
  ah(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản');
    user.cards.pull({ _id: req.params.id });
    await user.save();
    res.json({ user: publicUser(user) });
  }),
);

// ---- Favorites (B-22) ----
r.get(
  '/me/favorites',
  ah(async (req, res) => {
    const user = await User.findById(req.userId);
    const stores = await Store.find({ _id: { $in: user?.favorites ?? [] } });
    res.json(stores);
  }),
);
r.post(
  '/me/favorites/:storeId',
  ah(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản');
    const id = String(req.params.storeId);
    const has = user.favorites.some((f) => String(f) === id);
    if (has) (user.favorites as any).pull(id);
    else (user.favorites as any).push(id);
    await user.save();
    res.json({ favorite: !has, favorites: user.favorites });
  }),
);

// ---- Notifications (B-23, V-11) ----
r.get(
  '/me/notifications',
  ah(async (req, res) => {
    res.json(await Notification.find({ user: req.userId }).sort({ createdAt: -1 }).limit(100));
  }),
);
r.post(
  '/me/notifications/read-all',
  ah(async (req, res) => {
    await Notification.updateMany({ user: req.userId }, { read: true });
    res.json({ ok: true });
  }),
);
r.patch(
  '/me/notifications/:id',
  ah(async (req, res) => {
    await Notification.updateOne({ _id: req.params.id, user: req.userId }, { read: true });
    res.json({ ok: true });
  }),
);

// ---- Point history (B-49) ----
r.get(
  '/me/points',
  ah(async (req, res) => {
    const user = await User.findById(req.userId);
    res.json({ points: user?.points ?? 0, history: await PointTx.find({ user: req.userId }).sort({ createdAt: -1 }) });
  }),
);

export default r;

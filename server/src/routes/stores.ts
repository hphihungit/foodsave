import { Router } from 'express';
import { Store, Bag, Review, Order, Withdrawal, Types } from '../models';
import { ah, requireAuth, requireRole, HttpError, AuthRequest } from '../middleware/auth';
import { distanceKm, notify } from '../utils';

const r = Router();

const point = (q: any) => (q.lat && q.lng ? { lat: Number(q.lat), lng: Number(q.lng) } : undefined);

async function myStore(req: AuthRequest) {
  const store = await Store.findOne({ owner: req.userId });
  if (!store) throw new HttpError(404, 'Bạn chưa đăng ký cửa hàng');
  return store;
}

// ================= Store owner (role=store) — declared before /:id =================
const owner = Router();
owner.use(requireAuth, requireRole('store'));

// S-01/S-02: register partner store (auto-approved since there's no admin app yet)
owner.post(
  '/',
  ah(async (req, res) => {
    const exists = await Store.findOne({ owner: req.userId });
    if (exists) throw new HttpError(409, 'Tài khoản này đã có cửa hàng');
    const { name, category, address, phone, description, location } = req.body ?? {};
    if (!name || !address) throw new HttpError(400, 'Vui lòng nhập tên và địa chỉ cửa hàng');
    const store = await Store.create({
      owner: req.userId,
      name,
      category,
      address,
      phone,
      description,
      location: location ?? { lat: 16.0544, lng: 108.2022 },
      status: 'pending',
      openingHours: defaultHours(),
    });
    res.status(201).json(store);
  }),
);
owner.get('/', ah(async (req, res) => res.json(await myStore(req))));
owner.patch(
  '/',
  ah(async (req, res) => {
    const store = await myStore(req);
    const fields = ['name', 'category', 'description', 'address', 'phone', 'location', 'cover', 'logo', 'openingHours', 'settings', 'documents', 'status'];
    for (const f of fields) if (req.body?.[f] !== undefined) (store as any)[f] = req.body[f];
    // Demo: submitting documents approves the store immediately.
    if (req.body?.documents) {
      store.status = 'approved';
      store.verified = true;
    }
    await store.save();
    res.json(store);
  }),
);

// S-04 dashboard
owner.get(
  '/dashboard',
  ah(async (req, res) => {
    const store = await myStore(req);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [todayOrders, pending, ready, activeBags, recent] = await Promise.all([
      Order.find({ store: store._id, createdAt: { $gte: start }, status: { $ne: 'cancelled' } }),
      Order.countDocuments({ store: store._id, status: 'pending' }),
      Order.countDocuments({ store: store._id, status: 'ready' }),
      Bag.countDocuments({ store: store._id, status: 'active' }),
      Order.find({ store: store._id, status: { $in: ['pending', 'ready'] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('buyer', 'name avatar')
        .populate('bag', 'title image'),
    ]);
    const revenueToday = todayOrders.reduce((s, o) => s + (o.total ?? 0), 0);
    const bagsToday = todayOrders.reduce((s, o) => s + (o.qty ?? 0), 0);
    res.json({ store, revenueToday, bagsToday, pending, ready, activeBags, recent, kgSaved: bagsToday });
  }),
);

// S-15/S-16 revenue
owner.get(
  '/revenue',
  ah(async (req, res) => {
    const store = await myStore(req);
    const days = Number(req.query.days ?? 7);
    const from = new Date(Date.now() - days * 864e5);
    from.setHours(0, 0, 0, 0);
    const orders = await Order.find({ store: store._id, status: 'completed', createdAt: { $gte: from } }).populate('bag', 'title');
    const byDay: Record<string, { revenue: number; orders: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
      byDay[d] = { revenue: 0, orders: 0 };
    }
    const byBag: Record<string, { title: string; qty: number; revenue: number }> = {};
    for (const o of orders) {
      const d = (o as any).createdAt.toISOString().slice(0, 10);
      if (byDay[d]) {
        byDay[d].revenue += o.total ?? 0;
        byDay[d].orders += 1;
      }
      const t = (o.bag as any)?.title ?? 'Khác';
      byBag[t] ??= { title: t, qty: 0, revenue: 0 };
      byBag[t].qty += o.qty ?? 1;
      byBag[t].revenue += o.total ?? 0;
    }
    const total = orders.reduce((s, o) => s + (o.total ?? 0), 0);
    const all = await Order.find({ store: store._id });
    const cancelled = all.filter((o) => o.status === 'cancelled').length;
    res.json({
      total,
      orders: orders.length,
      bags: orders.reduce((s, o) => s + (o.qty ?? 1), 0),
      balance: store.balance,
      cancelRate: all.length ? cancelled / all.length : 0,
      days: Object.entries(byDay).map(([date, v]) => ({ date, ...v })),
      topBags: Object.values(byBag).sort((a, b) => b.revenue - a.revenue),
    });
  }),
);

// S-17/S-18 reviews + reply
owner.get(
  '/reviews',
  ah(async (req, res) => {
    const store = await myStore(req);
    res.json(await Review.find({ store: store._id }).sort({ createdAt: -1 }).populate('buyer', 'name avatar'));
  }),
);
owner.patch(
  '/reviews/:id',
  ah(async (req, res) => {
    const store = await myStore(req);
    const review = await Review.findOneAndUpdate({ _id: req.params.id, store: store._id }, { reply: req.body.reply }, { new: true });
    if (!review) throw new HttpError(404, 'Không tìm thấy đánh giá');
    await notify(review.buyer, 'Cửa hàng đã phản hồi đánh giá', `${store.name}: "${req.body.reply}"`, 'order');
    res.json(review);
  }),
);

// S-23 withdraw
owner.get('/withdrawals', ah(async (req, res) => res.json(await Withdrawal.find({ store: (await myStore(req))._id }).sort({ createdAt: -1 }))));
owner.post(
  '/withdrawals',
  ah(async (req, res) => {
    const store = await myStore(req);
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) throw new HttpError(400, 'Số tiền không hợp lệ');
    if (amount > store.balance) throw new HttpError(400, 'Số dư không đủ');
    store.balance -= amount;
    await store.save();
    res.status(201).json(await Withdrawal.create({ store: store._id, amount, bank: req.body.bank }));
  }),
);

// S-05..S-09 bags CRUD
owner.get('/bags', ah(async (req, res) => res.json(await Bag.find({ store: (await myStore(req))._id }).sort({ createdAt: -1 }))));
owner.post(
  '/bags',
  ah(async (req, res) => {
    const store = await myStore(req);
    const { title, price } = req.body ?? {};
    if (!title || !price) throw new HttpError(400, 'Vui lòng nhập tên túi và giá bán');
    res.status(201).json(await Bag.create({ ...req.body, store: store._id }));
  }),
);
owner.patch(
  '/bags/:id',
  ah(async (req, res) => {
    const store = await myStore(req);
    const { store: _s, ...rest } = req.body ?? {};
    const bag = await Bag.findOneAndUpdate({ _id: req.params.id, store: store._id }, rest, { new: true });
    if (!bag) throw new HttpError(404, 'Không tìm thấy túi');
    if (bag.quantity <= 0 && bag.status === 'active') {
      bag.status = 'soldout';
      await bag.save();
    }
    res.json(bag);
  }),
);
owner.delete(
  '/bags/:id',
  ah(async (req, res) => {
    const store = await myStore(req);
    await Bag.deleteOne({ _id: req.params.id, store: store._id });
    res.json({ ok: true });
  }),
);

r.use('/mine', owner);

// ================= Public =================
r.get(
  '/',
  ah(async (req, res) => {
    const { q, category } = req.query as Record<string, string>;
    const filter: any = { status: 'approved' };
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (category) filter.category = category;
    const stores = await Store.find(filter).lean();
    const p = point(req.query);
    const counts = await Bag.aggregate([
      { $match: { status: 'active', quantity: { $gt: 0 } } },
      { $group: { _id: '$store', bags: { $sum: '$quantity' }, minPrice: { $min: '$price' } } },
    ]);
    const map = new Map(counts.map((c) => [String(c._id), c]));
    res.json(
      stores
        .map((s) => ({ ...s, distance: distanceKm(p, s.location as any), bagsLeft: map.get(String(s._id))?.bags ?? 0, minPrice: map.get(String(s._id))?.minPrice }))
        .sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99)),
    );
  }),
);

r.get(
  '/:id',
  ah(async (req, res) => {
    if (!Types.ObjectId.isValid(String(req.params.id))) throw new HttpError(404, 'Không tìm thấy cửa hàng');
    const store = await Store.findById(req.params.id).lean();
    if (!store) throw new HttpError(404, 'Không tìm thấy cửa hàng');
    const [bags, reviews] = await Promise.all([
      Bag.find({ store: store._id, status: { $ne: 'paused' } }).sort({ status: 1, createdAt: -1 }),
      Review.find({ store: store._id }).sort({ createdAt: -1 }).limit(20).populate('buyer', 'name avatar'),
    ]);
    res.json({ ...store, distance: distanceKm(point(req.query), store.location as any), bags, reviews });
  }),
);

r.get(
  '/:id/reviews',
  ah(async (req, res) => {
    const reviews = await Review.find({ store: req.params.id }).sort({ createdAt: -1 }).populate('buyer', 'name avatar');
    const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((x) => x.rating === star).length }));
    res.json({ reviews, distribution: dist });
  }),
);

export function defaultHours() {
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  return Object.fromEntries(days.map((d) => [d, { open: true, from: '07:00', to: '21:00' }]));
}

export default r;

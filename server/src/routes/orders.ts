import { Router } from 'express';
import { Order, Bag, Store, Voucher, Review, Report, Message, User, Types } from '../models';
import { ah, requireAuth, requireRole, HttpError, AuthRequest } from '../middleware/auth';
import { addPoints, notify, randomCode, CO2_PER_KG } from '../utils';

const r = Router();
r.use(requireAuth);

const populateOrder = (q: any) =>
  q.populate('store', 'name address location phone logo cover rating').populate('bag', 'title image price originalPrice pickupStart pickupEnd weightKg category').populate('buyer', 'name phone avatar');

/** Loads an order the caller is allowed to see (its buyer or the owning store). */
async function loadOrder(req: AuthRequest, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  const order: any = await populateOrder(Order.findById(id));
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  const isBuyer = String(order.buyer?._id) === req.userId;
  let isStore = false;
  if (req.role === 'store') isStore = !!(await Store.exists({ _id: order.store?._id, owner: req.userId }));
  if (!isBuyer && !isStore) throw new HttpError(403, 'Không có quyền xem đơn hàng này');
  return { order, isBuyer, isStore };
}

// ---------- Vouchers (B-30, B-31) ----------
r.get(
  '/vouchers',
  ah(async (req, res) => {
    const vouchers = await Voucher.find({ $or: [{ owner: req.userId }, { owner: null }], used: false }).sort({ expiresAt: 1 });
    res.json(vouchers);
  }),
);
r.post(
  '/vouchers/claim',
  ah(async (req, res) => {
    const code = String(req.body.code ?? '').trim().toUpperCase();
    const v = await Voucher.findOne({ code, owner: null });
    if (!v) throw new HttpError(404, 'Mã voucher không tồn tại');
    const mine = await Voucher.findOne({ code, owner: req.userId });
    if (mine) throw new HttpError(409, 'Bạn đã lưu voucher này');
    const { _id, ...rest } = v.toObject();
    res.status(201).json(await Voucher.create({ ...rest, owner: req.userId }));
  }),
);

function voucherDiscount(v: any, subtotal: number) {
  if (!v) return 0;
  if (v.expiresAt && v.expiresAt < new Date()) throw new HttpError(400, 'Voucher đã hết hạn');
  if (subtotal < (v.minOrder ?? 0)) throw new HttpError(400, `Đơn tối thiểu ${v.minOrder.toLocaleString('vi-VN')}đ để dùng voucher này`);
  const d = v.percent ? Math.round((subtotal * v.percent) / 100) : v.discount ?? 0;
  return Math.min(d, subtotal);
}

// ---------- Buyer: create order (B-27 → B-33) ----------
r.post(
  '/',
  requireRole('buyer'),
  ah(async (req, res) => {
    const { bagId, qty = 1, pickupSlot, paymentMethod = 'cash', voucherId, note } = req.body ?? {};
    const bag = await Bag.findById(bagId);
    if (!bag || bag.status !== 'active') throw new HttpError(400, 'Túi này hiện không còn bán');
    const n = Math.max(1, Number(qty));
    // Atomically reserve stock so two buyers can't take the last bag.
    const reserved = await Bag.findOneAndUpdate({ _id: bag._id, quantity: { $gte: n } }, { $inc: { quantity: -n } }, { new: true });
    if (!reserved) throw new HttpError(400, `Chỉ còn ${bag.quantity} túi`);
    if (reserved.quantity === 0) {
      reserved.status = 'soldout';
      await reserved.save();
    }
    const subtotal = bag.price * n;
    let voucher: any = null;
    let discount = 0;
    try {
      if (voucherId) {
        voucher = await Voucher.findOne({ _id: voucherId, $or: [{ owner: req.userId }, { owner: null }], used: false });
        discount = voucherDiscount(voucher, subtotal);
      }
    } catch (e) {
      await Bag.updateOne({ _id: bag._id }, { $inc: { quantity: n }, status: 'active' });
      throw e;
    }
    if (voucher?.owner) {
      voucher.used = true;
      await voucher.save();
    }
    const order = await Order.create({
      code: 'FS' + randomCode(6),
      buyer: req.userId,
      store: bag.store,
      bag: bag._id,
      qty: n,
      subtotal,
      discount,
      total: subtotal - discount,
      pickupSlot: pickupSlot ?? `${bag.pickupStart} – ${bag.pickupEnd}`,
      paymentMethod,
      voucher: voucher?._id,
      note,
      pickupCode: randomCode(6),
    });
    const store = await Store.findById(bag.store);
    await notify(req.userId, 'Đặt hàng thành công', `Đơn ${order.code} tại ${store?.name}. Nhận lúc ${order.pickupSlot}.`, 'order');
    if (store?.owner) await notify(store.owner, 'Đơn hàng mới', `${n} × ${bag.title} — ${order.code}`, 'order');
    res.status(201).json(await populateOrder(Order.findById(order._id)));
  }),
);

// ---------- Buyer: list (B-35) ----------
r.get(
  '/',
  ah(async (req, res) => {
    const { status } = req.query as Record<string, string>;
    const filter: any = {};
    if (req.role === 'store') {
      const store = await Store.findOne({ owner: req.userId });
      filter.store = store?._id;
    } else filter.buyer = req.userId;
    if (status) filter.status = { $in: status.split(',') };
    res.json(await populateOrder(Order.find(filter).sort({ createdAt: -1 })));
  }),
);

r.get('/:id', ah(async (req, res) => res.json((await loadOrder(req, String(req.params.id))).order)));

// ---------- Buyer: cancel (B-39) ----------
r.post(
  '/:id/cancel',
  ah(async (req, res) => {
    const { order, isBuyer } = await loadOrder(req, String(req.params.id));
    if (!['pending', 'ready'].includes(order.status)) throw new HttpError(400, 'Không thể hủy đơn hàng này');
    order.status = 'cancelled';
    order.cancelReason = req.body.reason;
    await order.save();
    await Bag.updateOne({ _id: order.bag._id }, { $inc: { quantity: order.qty }, status: 'active' });
    if (order.voucher) await Voucher.updateOne({ _id: order.voucher, owner: { $ne: null } }, { used: false });
    const store = await Store.findById(order.store._id);
    if (isBuyer && store?.owner) await notify(store.owner, 'Đơn hàng bị hủy', `${order.code}: ${req.body.reason ?? ''}`, 'order');
    if (!isBuyer) await notify(order.buyer._id, 'Cửa hàng đã hủy đơn', `${order.code}: ${req.body.reason ?? ''}`, 'order');
    res.json(order);
  }),
);

// ---------- Store: mark ready (S-11) ----------
r.post(
  '/:id/ready',
  requireRole('store'),
  ah(async (req, res) => {
    const { order, isStore } = await loadOrder(req, String(req.params.id));
    if (!isStore) throw new HttpError(403, 'Không có quyền');
    if (order.status !== 'pending') throw new HttpError(400, 'Đơn hàng không ở trạng thái chờ chuẩn bị');
    order.status = 'ready';
    await order.save();
    await notify(order.buyer._id, 'Túi của bạn đã sẵn sàng', `${order.store.name} đã chuẩn bị xong đơn ${order.code}. Hãy đến nhận nhé!`, 'order');
    res.json(order);
  }),
);

async function completeOrder(order: any) {
  order.status = 'completed';
  order.completedAt = new Date();
  await order.save();
  const kg = (order.bag?.weightKg ?? 1) * order.qty;
  const saved = Math.max(0, ((order.bag?.originalPrice ?? 0) - (order.bag?.price ?? 0)) * order.qty);
  await User.updateOne(
    { _id: order.buyer._id },
    { $inc: { 'impact.bagsSaved': order.qty, 'impact.kgSaved': kg, 'impact.co2': kg * CO2_PER_KG, 'impact.moneySaved': saved } },
  );
  await Store.updateOne({ _id: order.store._id }, { $inc: { balance: order.total } });
  const pts = Math.max(10, Math.floor(order.total / 1000));
  await addPoints(order.buyer._id, pts, `Giải cứu túi tại ${order.store.name}`);
  await notify(order.buyer._id, 'Nhận túi thành công 🎉', `Bạn vừa giải cứu ${kg} kg đồ ăn và nhận ${pts} điểm.`, 'impact');
}

// ---------- Store: scan QR / enter code (S-12, S-13) ----------
r.post(
  '/verify-pickup',
  requireRole('store'),
  ah(async (req, res) => {
    const store = await Store.findOne({ owner: req.userId });
    const raw = String(req.body.code ?? '').trim();
    // QR payload is "FOODSAVE:<orderId>:<pickupCode>"; manual entry is the 6-digit code.
    const [, orderId, qrCode] = raw.startsWith('FOODSAVE:') ? raw.split(':') : [];
    const filter: any = { store: store?._id, status: { $in: ['pending', 'ready'] } };
    if (orderId) Object.assign(filter, { _id: orderId, pickupCode: qrCode });
    else filter.pickupCode = raw;
    const order: any = await populateOrder(Order.findOne(filter));
    if (!order) throw new HttpError(404, 'Mã nhận hàng không hợp lệ hoặc đơn đã hoàn thành');
    await completeOrder(order);
    res.json(order);
  }),
);
// Buyer-side confirmation is also allowed (B-37b demo without a second phone)
r.post(
  '/:id/complete',
  ah(async (req, res) => {
    const { order } = await loadOrder(req, String(req.params.id));
    if (!['pending', 'ready'].includes(order.status)) throw new HttpError(400, 'Đơn hàng đã kết thúc');
    await completeOrder(order);
    res.json(order);
  }),
);

// ---------- Buyer: review (B-40) ----------
r.post(
  '/:id/review',
  ah(async (req, res) => {
    const { order, isBuyer } = await loadOrder(req, String(req.params.id));
    if (!isBuyer) throw new HttpError(403, 'Không có quyền');
    if (order.status !== 'completed') throw new HttpError(400, 'Chỉ đánh giá được đơn đã hoàn thành');
    if (order.reviewed) throw new HttpError(409, 'Bạn đã đánh giá đơn này');
    const rating = Math.min(5, Math.max(1, Number(req.body.rating)));
    const review = await Review.create({ order: order._id, buyer: req.userId, store: order.store._id, rating, tags: req.body.tags, comment: req.body.comment });
    order.reviewed = true;
    await order.save();
    const stats = await Review.aggregate([{ $match: { store: order.store._id } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
    await Store.updateOne({ _id: order.store._id }, { rating: Math.round((stats[0]?.avg ?? rating) * 10) / 10, reviewCount: stats[0]?.n ?? 1 });
    await addPoints(req.userId, 5, 'Đánh giá đơn hàng');
    res.status(201).json(review);
  }),
);

// ---------- Buyer: report a problem (B-41) ----------
r.post(
  '/:id/report',
  ah(async (req, res) => {
    const { order } = await loadOrder(req, String(req.params.id));
    const report = await Report.create({ user: req.userId, order: order._id, reason: req.body.reason, detail: req.body.detail });
    await notify(req.userId, 'Đã nhận báo cáo', 'FoodSave sẽ phản hồi trong vòng 24 giờ.', 'system');
    res.status(201).json(report);
  }),
);

// ---------- Chat (B-42, S-20): one thread per order ----------
r.get(
  '/:id/messages',
  ah(async (req, res) => {
    const { order } = await loadOrder(req, String(req.params.id));
    res.json(await Message.find({ order: order._id }).sort({ createdAt: 1 }));
  }),
);
r.post(
  '/:id/messages',
  ah(async (req, res) => {
    const { order, isBuyer } = await loadOrder(req, String(req.params.id));
    const text = String(req.body.text ?? '').trim();
    if (!text) throw new HttpError(400, 'Tin nhắn trống');
    const msg = await Message.create({ order: order._id, store: order.store._id, buyer: order.buyer._id, sender: isBuyer ? 'buyer' : 'store', text });
    res.status(201).json(msg);
  }),
);

export default r;

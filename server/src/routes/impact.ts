import { Router } from 'express';
import { User, Order, Reward, Donation, PointTx } from '../models';
import { ah, requireAuth, HttpError } from '../middleware/auth';
import { addPoints, notify, randomCode } from '../utils';

const r = Router();
r.use(requireAuth);

/** Badges are derived from real stats, so no separate collection is needed. */
const BADGES = [
  { id: 'first', title: 'Người giải cứu đầu tiên', desc: 'Giải cứu túi bất ngờ đầu tiên', icon: 'leaf', metric: 'bags', goal: 1 },
  { id: 'bags10', title: 'Chiến binh xanh', desc: 'Giải cứu 10 túi bất ngờ', icon: 'bag', metric: 'bags', goal: 10 },
  { id: 'kg25', title: 'Siêu anh hùng 25kg', desc: 'Cứu 25 kg đồ ăn', icon: 'trophy', metric: 'kg', goal: 25 },
  { id: 'co2', title: 'Bảo vệ khí hậu', desc: 'Giảm 50 kg CO₂', icon: 'co2', metric: 'co2', goal: 50 },
  { id: 'donor', title: 'Trái tim nhân ái', desc: 'Quyên góp suất ăn đầu tiên', icon: 'hand-heart', metric: 'donations', goal: 1 },
  { id: 'review', title: 'Người góp ý', desc: 'Viết 3 đánh giá', icon: 'star', metric: 'reviews', goal: 3 },
  { id: 'streak', title: 'Chuỗi 7 ngày', desc: 'Giải cứu 7 ngày liên tiếp', icon: 'flame', metric: 'streak', goal: 7 },
  { id: 'friends', title: 'Đại sứ FoodSave', desc: 'Mời 3 bạn bè tham gia', icon: 'users', metric: 'referrals', goal: 3 },
];

async function stats(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản');
  const [donations, reviews, completed] = await Promise.all([
    Donation.countDocuments({ user: userId }),
    Order.countDocuments({ buyer: userId, reviewed: true }),
    Order.find({ buyer: userId, status: 'completed' }).select('completedAt'),
  ]);
  const days = new Set(completed.map((o) => o.completedAt?.toISOString().slice(0, 10)));
  let streak = 0;
  for (let i = 0; days.has(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)); i++) streak++;
  return {
    user,
    values: {
      bags: user.impact?.bagsSaved ?? 0,
      kg: user.impact?.kgSaved ?? 0,
      co2: user.impact?.co2 ?? 0,
      donations,
      reviews,
      streak,
      referrals: 0,
    } as Record<string, number>,
  };
}

// B-43
r.get(
  '/',
  ah(async (req, res) => {
    const { user, values } = await stats(req.userId!);
    const since = new Date(Date.now() - 180 * 864e5);
    const orders = await Order.find({ buyer: req.userId, status: 'completed', completedAt: { $gte: since } }).populate('bag', 'weightKg');
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months[`T${d.getMonth() + 1}`] = 0;
    }
    for (const o of orders) {
      const key = `T${o.completedAt!.getMonth() + 1}`;
      if (key in months) months[key] += ((o.bag as any)?.weightKg ?? 1) * (o.qty ?? 1);
    }
    res.json({
      impact: user.impact,
      points: user.points,
      streak: values.streak,
      monthly: Object.entries(months).map(([month, kg]) => ({ month, kg })),
      equivalents: { meals: Math.round(values.kg * 2.5), trees: Math.round(values.co2 / 21), water: Math.round(values.kg * 1000) },
    });
  }),
);

// B-44 / B-45
r.get(
  '/badges',
  ah(async (req, res) => {
    const { values } = await stats(req.userId!);
    res.json(BADGES.map((b) => ({ ...b, progress: Math.min(values[b.metric] ?? 0, b.goal), unlocked: (values[b.metric] ?? 0) >= b.goal })));
  }),
);

// B-46: weekly challenges computed from this week's activity
r.get(
  '/challenges',
  ah(async (req, res) => {
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const week = await Order.find({ buyer: req.userId, status: 'completed', completedAt: { $gte: monday } }).populate('store', 'category');
    const cats = new Set(week.map((o: any) => o.store?.category));
    const donations = await Donation.countDocuments({ user: req.userId, createdAt: { $gte: monday } });
    res.json([
      { id: 'w3', title: 'Giải cứu 3 túi trong tuần', reward: 50, progress: Math.min(week.length, 3), goal: 3, endsIn: '3 ngày' },
      { id: 'cat', title: 'Thử 2 loại cửa hàng khác nhau', reward: 30, progress: Math.min(cats.size, 2), goal: 2, endsIn: '3 ngày' },
      { id: 'don', title: 'Quyên góp 1 suất ăn', reward: 20, progress: Math.min(donations, 1), goal: 1, endsIn: '3 ngày' },
      { id: 'w10', title: 'Thử thách tháng: 10 túi', reward: 200, progress: Math.min(week.length, 10), goal: 10, endsIn: '14 ngày' },
    ]);
  }),
);

// B-47
r.get(
  '/leaderboard',
  ah(async (req, res) => {
    const users = await User.find({ role: 'buyer' }).sort({ 'impact.kgSaved': -1, points: -1 }).limit(50).select('name avatar impact points');
    const rows = users.map((u, i) => ({ rank: i + 1, _id: u._id, name: u.name, avatar: u.avatar, kg: u.impact?.kgSaved ?? 0, points: u.points, me: String(u._id) === req.userId }));
    res.json(rows);
  }),
);

// B-50
r.get('/rewards', ah(async (_req, res) => res.json(await Reward.find().sort({ cost: 1 }))));
r.post(
  '/rewards/:id/redeem',
  ah(async (req, res) => {
    const reward = await Reward.findById(req.params.id);
    const user = await User.findById(req.userId);
    if (!reward || !user) throw new HttpError(404, 'Không tìm thấy quà');
    if ((reward.stock ?? 0) <= 0) throw new HttpError(400, 'Quà đã hết');
    if (user.points < (reward.cost ?? 0)) throw new HttpError(400, 'Bạn chưa đủ điểm');
    await addPoints(user._id, -(reward.cost ?? 0), `Đổi quà: ${reward.title}`);
    reward.stock = (reward.stock ?? 1) - 1;
    await reward.save();
    const code = 'GIFT-' + randomCode(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    await notify(user._id, 'Đổi quà thành công', `${reward.title} — mã: ${code}`, 'promo');
    res.json({ ok: true, code, points: user.points - (reward.cost ?? 0) });
  }),
);

export { BADGES, PointTx };
export default r;

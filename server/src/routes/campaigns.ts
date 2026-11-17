import { Router } from 'express';
import { Campaign, Donation, Types } from '../models';
import { ah, requireAuth, HttpError } from '../middleware/auth';
import { addPoints, notify } from '../utils';

const r = Router();

export const MEAL_PRICE = 25000;

r.get('/', ah(async (_req, res) => res.json(await Campaign.find().sort({ endsAt: 1 }))));

r.get(
  '/summary',
  requireAuth,
  ah(async (req, res) => {
    const [mine, all] = await Promise.all([
      Donation.aggregate([{ $match: { user: new Types.ObjectId(req.userId) } }, { $group: { _id: null, meals: { $sum: '$meals' }, amount: { $sum: '$amount' } } }]),
      Donation.aggregate([{ $group: { _id: null, meals: { $sum: '$meals' } } }]),
    ]);
    res.json({ myMeals: mine[0]?.meals ?? 0, myAmount: mine[0]?.amount ?? 0, communityMeals: (all[0]?.meals ?? 0) + 12480, mealPrice: MEAL_PRICE });
  }),
);

r.get(
  '/:id',
  ah(async (req, res) => {
    if (!Types.ObjectId.isValid(String(req.params.id))) throw new HttpError(404, 'Không tìm thấy chiến dịch');
    const c = await Campaign.findById(req.params.id).lean();
    if (!c) throw new HttpError(404, 'Không tìm thấy chiến dịch');
    const recent = await Donation.find({ campaign: c._id }).sort({ createdAt: -1 }).limit(10).populate('user', 'name avatar');
    res.json({
      ...c,
      recent: recent.map((d: any) => ({ _id: d._id, meals: d.meals, message: d.message, createdAt: d.createdAt, name: d.anonymous ? 'Ẩn danh' : d.user?.name })),
    });
  }),
);

// B-54/B-55
r.post(
  '/:id/donate',
  requireAuth,
  ah(async (req, res) => {
    const meals = Math.max(1, Math.floor(Number(req.body.meals)));
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) throw new HttpError(404, 'Không tìm thấy chiến dịch');
    const donation = await Donation.create({ user: req.userId, campaign: campaign._id, meals, amount: meals * MEAL_PRICE, message: req.body.message, anonymous: !!req.body.anonymous });
    campaign.raisedMeals = (campaign.raisedMeals ?? 0) + meals;
    campaign.donors = (campaign.donors ?? 0) + 1;
    await campaign.save();
    await addPoints(req.userId, meals * 10, `Quyên góp ${meals} suất ăn`);
    await notify(req.userId, 'Cảm ơn tấm lòng của bạn ❤️', `Bạn đã quyên góp ${meals} suất ăn cho "${campaign.title}".`, 'impact');
    res.status(201).json({ donation, campaign });
  }),
);

export default r;

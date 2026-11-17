import { Router } from 'express';
import { VolunteerTask, Store, User, Campaign } from '../models';
import { ah, requireAuth, requireRole, HttpError } from '../middleware/auth';
import { distanceKm, notify } from '../utils';

const r = Router();
r.use(requireAuth);

const populate = (q: any) => q.populate('store', 'name address location phone logo').populate('campaign', 'title organization').populate('volunteer', 'name phone avatar');

// V-02 / V-03: tasks list. ?status=available|ongoing|done  ?mine=1
r.get(
  '/',
  ah(async (req, res) => {
    const { status, mine } = req.query as Record<string, string>;
    const filter: any = {};
    if (status) filter.status = { $in: status.split(',') };
    if (mine) filter.volunteer = req.userId;
    if (req.role === 'store') filter.store = (await Store.findOne({ owner: req.userId }))?._id;
    res.json(await populate(VolunteerTask.find(filter).sort({ status: 1, createdAt: -1 })));
  }),
);

// V-10 summary
r.get(
  '/stats',
  requireRole('volunteer'),
  ah(async (req, res) => {
    const done = await VolunteerTask.find({ volunteer: req.userId, status: 'done' });
    const user = await User.findById(req.userId);
    res.json({
      tasks: done.length,
      meals: done.reduce((s, t) => s + (t.meals ?? 0), 0),
      km: Math.round(done.reduce((s, t) => s + (t.distanceKm ?? 0), 0) * 10) / 10,
      hours: user?.volunteerHours ?? 0,
    });
  }),
);

r.get(
  '/:id',
  ah(async (req, res) => {
    const t = await populate(VolunteerTask.findById(req.params.id));
    if (!t) throw new HttpError(404, 'Không tìm thấy nhiệm vụ');
    res.json(t);
  }),
);

// S-19: store hands surplus food to volunteers
r.post(
  '/',
  requireRole('store'),
  ah(async (req, res) => {
    const store = await Store.findOne({ owner: req.userId });
    if (!store) throw new HttpError(404, 'Bạn chưa có cửa hàng');
    const campaign = req.body.campaignId ? await Campaign.findById(req.body.campaignId) : await Campaign.findOne();
    const to = req.body.toLocation ?? { lat: 16.0678, lng: 108.2208 };
    const task = await VolunteerTask.create({
      store: store._id,
      campaign: campaign?._id,
      title: req.body.title ?? `Giao suất ăn từ ${store.name}`,
      items: req.body.items,
      meals: Number(req.body.meals ?? 10),
      fromAddress: store.address,
      fromLocation: store.location,
      toName: req.body.toName ?? campaign?.organization ?? 'Mái ấm Hoa Hồng',
      toAddress: req.body.toAddress ?? campaign?.location ?? 'Hải Châu, Đà Nẵng',
      toLocation: to,
      distanceKm: distanceKm(store.location as any, to) ?? 2.5,
      pickupTime: req.body.pickupTime ?? '20:30',
      note: req.body.note,
      hours: 1,
    });
    const volunteers = await User.find({ role: 'volunteer' }).select('_id');
    await Promise.all(volunteers.map((v) => notify(v._id, 'Có nhiệm vụ mới gần bạn', `${task.meals} suất ăn từ ${store.name}`, 'task')));
    res.status(201).json(task);
  }),
);

// V-05: accept
r.post(
  '/:id/accept',
  requireRole('volunteer'),
  ah(async (req, res) => {
    const task = await VolunteerTask.findOneAndUpdate({ _id: req.params.id, status: 'available' }, { status: 'ongoing', volunteer: req.userId }, { new: true });
    if (!task) throw new HttpError(409, 'Nhiệm vụ đã có người nhận');
    const store = await Store.findById(task.store);
    if (store?.owner) await notify(store.owner, 'Tình nguyện viên đã nhận nhiệm vụ', task.title ?? '', 'task');
    res.json(await populate(VolunteerTask.findById(task._id)));
  }),
);

// V-07/V-08: complete
r.post(
  '/:id/complete',
  requireRole('volunteer'),
  ah(async (req, res) => {
    const task = await VolunteerTask.findOne({ _id: req.params.id, volunteer: req.userId, status: 'ongoing' });
    if (!task) throw new HttpError(404, 'Không tìm thấy nhiệm vụ đang thực hiện');
    task.status = 'done';
    task.completedAt = new Date();
    if (req.body.note) task.note = req.body.note;
    await task.save();
    await User.updateOne({ _id: req.userId }, { $inc: { volunteerHours: task.hours ?? 1 } });
    if (task.campaign) await Campaign.updateOne({ _id: task.campaign }, { $inc: { raisedMeals: task.meals ?? 0 } });
    await notify(req.userId, 'Hoàn thành nhiệm vụ 🎉', `Bạn đã trao ${task.meals} suất ăn. +${task.hours} giờ tình nguyện.`, 'task');
    res.json(await populate(VolunteerTask.findById(task._id)));
  }),
);

// Cancel an accepted task (returns it to the pool)
r.post(
  '/:id/release',
  requireRole('volunteer'),
  ah(async (req, res) => {
    const task = await VolunteerTask.findOneAndUpdate({ _id: req.params.id, volunteer: req.userId, status: 'ongoing' }, { status: 'available', $unset: { volunteer: 1 } }, { new: true });
    if (!task) throw new HttpError(404, 'Không tìm thấy nhiệm vụ');
    res.json(task);
  }),
);

export default r;

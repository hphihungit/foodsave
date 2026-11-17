import { Router } from 'express';
import { Bag, Types } from '../models';
import { ah, HttpError } from '../middleware/auth';
import { distanceKm } from '../utils';

const r = Router();

/**
 * B-13/B-15/B-17/B-18: list surprise bags.
 * Query: q, category, maxPrice, minRating, maxDistance, sort (near|cheap|rating|ending), lat, lng, store
 */
r.get(
  '/',
  ah(async (req, res) => {
    const { q, category, maxPrice, minRating, maxDistance, sort, store, includeSoldOut } = req.query as Record<string, string>;
    const filter: any = includeSoldOut ? { status: { $ne: 'paused' } } : { status: 'active', quantity: { $gt: 0 } };
    if (category) filter.category = category;
    if (maxPrice) filter.price = { $lte: Number(maxPrice) };
    if (store) filter.store = store;
    let bags = await Bag.find(filter).populate('store').lean();
    bags = bags.filter((b: any) => b.store && b.store.status === 'approved');
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      bags = bags.filter((b: any) => re.test(b.title) || re.test(b.store.name) || re.test(b.category ?? ''));
    }
    const p = req.query.lat ? { lat: Number(req.query.lat), lng: Number(req.query.lng) } : undefined;
    let out = bags.map((b: any) => ({ ...b, distance: distanceKm(p, b.store.location) }));
    if (minRating) out = out.filter((b: any) => (b.store.rating ?? 0) >= Number(minRating));
    if (maxDistance) out = out.filter((b) => b.distance === undefined || b.distance <= Number(maxDistance));
    const sorters: Record<string, (a: any, b: any) => number> = {
      near: (a, b) => (a.distance ?? 99) - (b.distance ?? 99),
      cheap: (a, b) => a.price - b.price,
      rating: (a, b) => (b.store.rating ?? 0) - (a.store.rating ?? 0),
      ending: (a, b) => String(a.pickupEnd).localeCompare(String(b.pickupEnd)),
    };
    out.sort(sorters[sort] ?? sorters.near);
    res.json(out);
  }),
);

r.get(
  '/:id',
  ah(async (req, res) => {
    if (!Types.ObjectId.isValid(String(req.params.id))) throw new HttpError(404, 'Không tìm thấy túi');
    const bag: any = await Bag.findById(req.params.id).populate('store').lean();
    if (!bag) throw new HttpError(404, 'Không tìm thấy túi');
    const p = req.query.lat ? { lat: Number(req.query.lat), lng: Number(req.query.lng) } : undefined;
    res.json({ ...bag, distance: distanceKm(p, bag.store?.location) });
  }),
);

export default r;

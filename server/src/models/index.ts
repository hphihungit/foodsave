import { Schema, model, Types } from 'mongoose';

const ObjectId = Schema.Types.ObjectId;
const opts = { timestamps: true };

export type Role = 'buyer' | 'store' | 'volunteer';

const AddressSchema = new Schema(
  { label: String, detail: String, lat: Number, lng: Number, isDefault: { type: Boolean, default: false } },
  { _id: true },
);

const CardSchema = new Schema({ brand: String, last4: String, holder: String, isDefault: Boolean }, { _id: true });

export const User = model(
  'User',
  new Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ['buyer', 'store', 'volunteer'], default: 'buyer' },
      phone: String,
      avatar: String,
      gender: String,
      birthday: String,
      addresses: [AddressSchema],
      cards: [CardSchema],
      interests: [String],
      favorites: [{ type: ObjectId, ref: 'Store' }],
      points: { type: Number, default: 0 },
      impact: {
        bagsSaved: { type: Number, default: 0 },
        kgSaved: { type: Number, default: 0 },
        co2: { type: Number, default: 0 },
        moneySaved: { type: Number, default: 0 },
      },
      notificationSettings: { type: Schema.Types.Mixed, default: {} },
      language: { type: String, default: 'vi' },
      referralCode: String,
      // volunteer-only
      volunteerHours: { type: Number, default: 0 },
      vehicle: String,
      area: String,
    },
    opts,
  ),
);

export const Store = model(
  'Store',
  new Schema(
    {
      owner: { type: ObjectId, ref: 'User' },
      name: { type: String, required: true },
      category: String,
      description: String,
      address: String,
      phone: String,
      location: { lat: Number, lng: Number },
      cover: String,
      logo: String,
      openingHours: { type: Schema.Types.Mixed, default: {} },
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      verified: { type: Boolean, default: false },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
      documents: [String],
      balance: { type: Number, default: 0 },
      settings: { type: Schema.Types.Mixed, default: {} },
    },
    opts,
  ),
);

export const Bag = model(
  'Bag',
  new Schema(
    {
      store: { type: ObjectId, ref: 'Store', required: true },
      title: { type: String, required: true },
      category: String,
      description: String,
      contents: [String],
      price: { type: Number, required: true },
      originalPrice: Number,
      quantity: { type: Number, default: 1 },
      pickupStart: String, // "19:00"
      pickupEnd: String, // "21:00"
      pickupDay: { type: String, default: 'today' },
      image: String,
      weightKg: { type: Number, default: 1 },
      status: { type: String, enum: ['active', 'soldout', 'paused'], default: 'active' },
    },
    opts,
  ),
);

export const Order = model(
  'Order',
  new Schema(
    {
      code: String,
      buyer: { type: ObjectId, ref: 'User', required: true },
      store: { type: ObjectId, ref: 'Store', required: true },
      bag: { type: ObjectId, ref: 'Bag', required: true },
      qty: { type: Number, default: 1 },
      subtotal: Number,
      discount: { type: Number, default: 0 },
      total: Number,
      pickupSlot: String,
      paymentMethod: String,
      voucher: { type: ObjectId, ref: 'Voucher' },
      note: String,
      status: {
        type: String,
        enum: ['pending', 'ready', 'completed', 'cancelled'],
        default: 'pending',
      },
      pickupCode: String,
      cancelReason: String,
      reviewed: { type: Boolean, default: false },
      completedAt: Date,
    },
    opts,
  ),
);

export const Review = model(
  'Review',
  new Schema(
    {
      order: { type: ObjectId, ref: 'Order' },
      buyer: { type: ObjectId, ref: 'User' },
      store: { type: ObjectId, ref: 'Store' },
      rating: Number,
      tags: [String],
      comment: String,
      reply: String,
    },
    opts,
  ),
);

export const Voucher = model(
  'Voucher',
  new Schema(
    {
      code: { type: String, required: true },
      title: String,
      discount: Number, // VND
      percent: Number,
      minOrder: { type: Number, default: 0 },
      expiresAt: Date,
      owner: { type: ObjectId, ref: 'User' }, // null = public
      used: { type: Boolean, default: false },
    },
    opts,
  ),
);

export const Notification = model(
  'Notification',
  new Schema(
    {
      user: { type: ObjectId, ref: 'User', required: true },
      title: String,
      body: String,
      type: { type: String, default: 'system' }, // order|promo|impact|system|task
      read: { type: Boolean, default: false },
    },
    opts,
  ),
);

export const Message = model(
  'Message',
  new Schema(
    {
      store: { type: ObjectId, ref: 'Store', required: true },
      buyer: { type: ObjectId, ref: 'User', required: true },
      order: { type: ObjectId, ref: 'Order' },
      sender: { type: String, enum: ['buyer', 'store'] },
      text: String,
    },
    opts,
  ),
);

export const Campaign = model(
  'Campaign',
  new Schema(
    {
      title: String,
      organization: String,
      description: String,
      image: String,
      goalMeals: Number,
      raisedMeals: { type: Number, default: 0 },
      donors: { type: Number, default: 0 },
      endsAt: Date,
      location: String,
    },
    opts,
  ),
);

export const Donation = model(
  'Donation',
  new Schema(
    {
      user: { type: ObjectId, ref: 'User' },
      campaign: { type: ObjectId, ref: 'Campaign' },
      meals: Number,
      amount: Number,
      message: String,
      anonymous: Boolean,
    },
    opts,
  ),
);

export const VolunteerTask = model(
  'VolunteerTask',
  new Schema(
    {
      store: { type: ObjectId, ref: 'Store' },
      campaign: { type: ObjectId, ref: 'Campaign' },
      title: String,
      items: String,
      meals: Number,
      fromAddress: String,
      fromLocation: { lat: Number, lng: Number },
      toName: String,
      toAddress: String,
      toLocation: { lat: Number, lng: Number },
      distanceKm: Number,
      pickupTime: String,
      volunteer: { type: ObjectId, ref: 'User' },
      status: { type: String, enum: ['available', 'ongoing', 'done'], default: 'available' },
      hours: { type: Number, default: 1 },
      completedAt: Date,
      note: String,
    },
    opts,
  ),
);

export const PointTx = model(
  'PointTx',
  new Schema(
    {
      user: { type: ObjectId, ref: 'User', required: true },
      type: { type: String, enum: ['earn', 'spend'] },
      amount: Number,
      reason: String,
    },
    opts,
  ),
);

export const Report = model(
  'Report',
  new Schema(
    {
      user: { type: ObjectId, ref: 'User' },
      order: { type: ObjectId, ref: 'Order' },
      reason: String,
      detail: String,
      status: { type: String, default: 'open' },
    },
    opts,
  ),
);

export const Reward = model(
  'Reward',
  new Schema({ title: String, partner: String, cost: Number, image: String, stock: Number }, opts),
);

export const Withdrawal = model(
  'Withdrawal',
  new Schema({ store: { type: ObjectId, ref: 'Store' }, amount: Number, bank: String, status: { type: String, default: 'processing' } }, opts),
);

export { Types };

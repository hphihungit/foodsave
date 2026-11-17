export type Role = 'buyer' | 'store' | 'volunteer';
export type LatLng = { lat: number; lng: number };

export interface Address {
  _id: string;
  label?: string;
  detail?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}
export interface Card {
  _id: string;
  brand?: string;
  last4?: string;
  holder?: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatar?: string;
  gender?: string;
  birthday?: string;
  addresses: Address[];
  cards: Card[];
  interests: string[];
  favorites: string[];
  points: number;
  impact: { bagsSaved: number; kgSaved: number; co2: number; moneySaved: number };
  notificationSettings?: Record<string, boolean>;
  language?: string;
  referralCode?: string;
  volunteerHours?: number;
  vehicle?: string;
  area?: string;
  createdAt?: string;
}

export interface Store {
  _id: string;
  owner?: string;
  name: string;
  category?: string;
  description?: string;
  address?: string;
  phone?: string;
  location?: LatLng;
  cover?: string;
  logo?: string;
  openingHours?: Record<string, { open: boolean; from: string; to: string }>;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  balance?: number;
  settings?: Record<string, any>;
  distance?: number;
  bagsLeft?: number;
  minPrice?: number;
}

export interface Bag {
  _id: string;
  store: Store;
  title: string;
  category?: string;
  description?: string;
  contents?: string[];
  price: number;
  originalPrice?: number;
  quantity: number;
  pickupStart?: string;
  pickupEnd?: string;
  image?: string;
  weightKg?: number;
  status: 'active' | 'soldout' | 'paused';
  distance?: number;
}

export type OrderStatus = 'pending' | 'ready' | 'completed' | 'cancelled';
export interface Order {
  _id: string;
  code: string;
  buyer: Pick<User, '_id' | 'name' | 'phone' | 'avatar'>;
  store: Store;
  bag: Bag;
  qty: number;
  subtotal: number;
  discount: number;
  total: number;
  pickupSlot?: string;
  paymentMethod?: string;
  note?: string;
  status: OrderStatus;
  pickupCode: string;
  cancelReason?: string;
  reviewed?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface Review {
  _id: string;
  buyer?: { _id: string; name: string; avatar?: string };
  rating: number;
  tags?: string[];
  comment?: string;
  reply?: string;
  createdAt: string;
}

export interface Voucher {
  _id: string;
  code: string;
  title?: string;
  discount?: number;
  percent?: number;
  minOrder?: number;
  expiresAt?: string;
  owner?: string | null;
}

export interface AppNotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface Message {
  _id: string;
  sender: 'buyer' | 'store';
  text: string;
  createdAt: string;
}

export interface Campaign {
  _id: string;
  title: string;
  organization?: string;
  description?: string;
  image?: string;
  goalMeals: number;
  raisedMeals: number;
  donors: number;
  endsAt?: string;
  location?: string;
  recent?: { _id: string; name?: string; meals: number; message?: string; createdAt: string }[];
}

export interface VolunteerTask {
  _id: string;
  store?: Store;
  campaign?: { _id: string; title: string; organization?: string };
  title: string;
  items?: string;
  meals: number;
  fromAddress?: string;
  fromLocation?: LatLng;
  toName?: string;
  toAddress?: string;
  toLocation?: LatLng;
  distanceKm?: number;
  pickupTime?: string;
  volunteer?: { _id: string; name: string; phone?: string };
  status: 'available' | 'ongoing' | 'done';
  hours?: number;
  completedAt?: string;
  createdAt: string;
}

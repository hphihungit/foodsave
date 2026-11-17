import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  User, Store, Bag, Order, Review, Voucher, Notification, Message, Campaign, Donation, VolunteerTask, PointTx, Report, Reward, Withdrawal,
} from './models';
import { defaultHours } from './routes/stores';
import { connectDb, disconnectDb } from './db';
import { CO2_PER_KG } from './utils';

export const DEMO_PASSWORD = '123456';

const STORES = [
  { name: 'Tiệm Bánh Sông Hàn', category: 'Bánh ngọt', address: '45 Bạch Đằng, Hải Châu', lat: 16.0718, lng: 108.2245, rating: 4.8 },
  { name: 'Bánh Mì Cô Lan', category: 'Bánh mì', address: '12 Lê Lợi, Hải Châu', lat: 16.0689, lng: 108.2192, rating: 4.6 },
  { name: 'Cơm Nhà Mẹ Nấu', category: 'Cơm', address: '88 Nguyễn Văn Linh, Thanh Khê', lat: 16.0601, lng: 108.2107, rating: 4.5 },
  { name: 'GreenMart Hải Châu', category: 'Siêu thị', address: '210 Hùng Vương, Hải Châu', lat: 16.0667, lng: 108.2149, rating: 4.4 },
  { name: 'Trái Cây Tươi 24h', category: 'Trái cây', address: '5 Ông Ích Khiêm, Thanh Khê', lat: 16.0712, lng: 108.2063, rating: 4.7 },
  { name: 'The Coffee Corner', category: 'Đồ uống', address: '30 Trần Phú, Hải Châu', lat: 16.0736, lng: 108.2231, rating: 4.3 },
  { name: 'Bếp Chay An Lạc', category: 'Cơm', address: '102 Phan Châu Trinh, Hải Châu', lat: 16.0632, lng: 108.2203, rating: 4.9 },
  { name: 'Pizza Mỹ Khê', category: 'Đồ ăn nhanh', address: '15 Võ Nguyên Giáp, Sơn Trà', lat: 16.0661, lng: 108.2457, rating: 4.2 },
];

const BAGS: Record<string, { title: string; price: number; originalPrice: number; qty: number; from: string; to: string; contents: string[] }[]> = {
  'Bánh ngọt': [
    { title: 'Túi bất ngờ bánh ngọt', price: 45000, originalPrice: 120000, qty: 3, from: '19:00', to: '21:00', contents: ['Bánh kem miếng', 'Croissant', 'Bánh su kem'] },
    { title: 'Combo bánh mì hoa cúc', price: 35000, originalPrice: 90000, qty: 2, from: '20:00', to: '21:30', contents: ['Bánh mì hoa cúc', 'Bánh bông lan'] },
  ],
  'Bánh mì': [
    { title: 'Combo bánh mì cuối ngày', price: 25000, originalPrice: 70000, qty: 5, from: '18:30', to: '20:00', contents: ['3 ổ bánh mì thịt', 'Bánh mì que'] },
  ],
  Cơm: [
    { title: 'Túi cơm phần tối', price: 30000, originalPrice: 80000, qty: 4, from: '19:30', to: '20:30', contents: ['2 hộp cơm', 'Canh', 'Rau xào'] },
    { title: 'Hộp cơm gà sốt', price: 28000, originalPrice: 65000, qty: 2, from: '13:30', to: '14:30', contents: ['Cơm gà sốt', 'Salad'] },
  ],
  'Siêu thị': [
    { title: 'Túi rau củ bất ngờ', price: 40000, originalPrice: 110000, qty: 6, from: '20:00', to: '22:00', contents: ['Rau ăn lá', 'Củ quả', 'Nấm'] },
    { title: 'Túi sữa & bánh', price: 50000, originalPrice: 130000, qty: 3, from: '20:00', to: '22:00', contents: ['Sữa chua', 'Bánh quy', 'Sữa tươi'] },
  ],
  'Trái cây': [{ title: 'Túi trái cây chín', price: 35000, originalPrice: 95000, qty: 4, from: '17:00', to: '19:00', contents: ['Xoài', 'Chuối', 'Thanh long'] }],
  'Đồ uống': [{ title: 'Combo cà phê + bánh', price: 30000, originalPrice: 85000, qty: 3, from: '21:00', to: '22:00', contents: ['2 ly cà phê', 'Bánh croissant'] }],
  'Đồ ăn nhanh': [{ title: 'Pizza cuối ngày', price: 55000, originalPrice: 160000, qty: 2, from: '21:30', to: '22:30', contents: ['Pizza size M', 'Khoai tây chiên'] }],
};

export async function seed() {
  await Promise.all(
    [User, Store, Bag, Order, Review, Voucher, Notification, Message, Campaign, Donation, VolunteerTask, PointTx, Report, Reward, Withdrawal].map((m: any) => m.deleteMany({})),
  );
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const daNang = { label: 'Nhà', detail: 'Hải Châu, Đà Nẵng', lat: 16.0678, lng: 108.2208, isDefault: true };

  const buyer = await User.create({
    name: 'Phi Hùng', email: 'buyer@foodsave.vn', passwordHash: hash, role: 'buyer', phone: '0905123456',
    addresses: [daNang, { label: 'Trường học', detail: '470 Trần Đại Nghĩa, Ngũ Hành Sơn', lat: 15.9753, lng: 108.2531 }],
    interests: ['Bánh ngọt', 'Cơm'], points: 0, referralCode: 'FSHUNG01',
    cards: [{ brand: 'Visa', last4: '4242', holder: 'PHI HUNG', isDefault: true }],
  });
  const owner = await User.create({ name: 'Chị Hà (chủ tiệm)', email: 'store@foodsave.vn', passwordHash: hash, role: 'store', phone: '0905000111' });
  const volunteer = await User.create({ name: 'Minh Anh', email: 'volunteer@foodsave.vn', passwordHash: hash, role: 'volunteer', phone: '0905222333', vehicle: 'Xe máy', area: 'Hải Châu', volunteerHours: 6 });
  const others = await User.insertMany(
    ['Thu Trang', 'Quốc Bảo', 'Ngọc Linh', 'Hoàng Nam', 'Mai Anh', 'Tuấn Kiệt'].map((name, i) => ({
      name, email: `user${i + 1}@foodsave.vn`, passwordHash: hash, role: 'buyer',
      points: 900 - i * 120, impact: { bagsSaved: 30 - i * 4, kgSaved: 32 - i * 4.5, co2: (32 - i * 4.5) * CO2_PER_KG, moneySaved: 2_000_000 - i * 250_000 },
    })),
  );

  const stores = await Store.insertMany(
    STORES.map((s, i) => ({
      owner: i === 0 ? owner._id : undefined,
      name: s.name, category: s.category, address: `${s.address}, Đà Nẵng`, phone: '0236 3' + String(100000 + i * 7919).slice(0, 6),
      description: `${s.name} tham gia FoodSave để giảm lãng phí thực phẩm. Mỗi cuối ngày, chúng tôi đóng túi bất ngờ với đồ ăn còn ngon với giá chỉ từ 30%.`,
      location: { lat: s.lat, lng: s.lng }, rating: s.rating, reviewCount: 20 + i * 7, verified: true, status: 'approved',
      openingHours: defaultHours(), balance: i === 0 ? 1_250_000 : 0,
    })),
  );

  const bags: any[] = [];
  for (const store of stores) {
    for (const b of BAGS[store.category!] ?? []) {
      bags.push({
        store: store._id, title: b.title, category: store.category, price: b.price, originalPrice: b.originalPrice, quantity: b.qty,
        pickupStart: b.from, pickupEnd: b.to, contents: b.contents, weightKg: 1.2,
        description: 'Nội dung túi thay đổi mỗi ngày tùy theo đồ ăn còn lại. Đảm bảo vẫn ngon và an toàn!',
      });
    }
  }
  const createdBags = await Bag.insertMany(bags);
  const songHanBags = createdBags.filter((b) => String(b.store) === String(stores[0]._id));
  // One paused bag for the store's "Tạm dừng" state
  await Bag.create({ store: stores[0]._id, title: 'Túi bánh mặn', category: 'Bánh ngọt', price: 30000, originalPrice: 75000, quantity: 0, pickupStart: '19:00', pickupEnd: '21:00', status: 'paused', weightKg: 1 });

  // Past completed orders for the demo buyer → impact, points, reviews
  const pastOrders = [];
  for (let i = 0; i < 6; i++) {
    const bag = createdBags[i % createdBags.length];
    const when = new Date(Date.now() - (i * 9 + 1) * 864e5);
    pastOrders.push({
      code: 'FS10' + (2300 + i), buyer: buyer._id, store: bag.store, bag: bag._id, qty: 1, subtotal: bag.price, discount: 0, total: bag.price,
      pickupSlot: `${bag.pickupStart} – ${bag.pickupEnd}`, paymentMethod: i % 2 ? 'momo' : 'cash', status: 'completed',
      pickupCode: String(100000 + i), completedAt: when, createdAt: when, reviewed: i < 2,
    });
  }
  pastOrders.push({
    code: 'FS102399', buyer: buyer._id, store: stores[2]._id, bag: createdBags[3]._id, qty: 1, subtotal: 30000, total: 30000,
    pickupSlot: '19:30 – 20:30', paymentMethod: 'cash', status: 'cancelled', cancelReason: 'Tôi bận đột xuất', pickupCode: '999999',
    createdAt: new Date(Date.now() - 20 * 864e5),
  });
  const orders: any[] = (await Order.insertMany(pastOrders as any[], { timestamps: false } as any)) as any;
  const kg = 6 * 1.2;
  await User.updateOne({ _id: buyer._id }, { points: 380, impact: { bagsSaved: 6, kgSaved: kg, co2: kg * CO2_PER_KG, moneySaved: 420000 } });
  await PointTx.insertMany([
    { user: buyer._id, type: 'earn', amount: 120, reason: 'Thưởng chào mừng' },
    ...orders.slice(0, 6).map((o: any) => ({ user: buyer._id, type: 'earn', amount: 45, reason: 'Giải cứu túi bất ngờ', createdAt: o.completedAt })),
    { user: buyer._id, type: 'spend', amount: 10, reason: 'Đổi voucher 10.000đ' },
  ]);

  // Pending orders from other buyers so the store dashboard isn't empty
  for (const [i, u] of others.slice(0, 3).entries()) {
    const bag = songHanBags[i % songHanBags.length];
    await Order.create({
      code: 'FS20' + (5100 + i), buyer: u._id, store: stores[0]._id, bag: bag._id, qty: 1, subtotal: bag.price, total: bag.price,
      pickupSlot: `${bag.pickupStart} – ${bag.pickupEnd}`, paymentMethod: 'cash', status: i === 2 ? 'ready' : 'pending', pickupCode: String(200000 + i),
    });
  }
  // Completed sales for revenue charts
  for (let d = 0; d < 7; d++) {
    for (let k = 0; k < (d % 3) + 1; k++) {
      const bag = songHanBags[k % songHanBags.length];
      const when = new Date(Date.now() - d * 864e5 - k * 3600e3);
      await Order.collection.insertOne({
        code: `FS3${d}${k}00`, buyer: others[(d + k) % others.length]._id, store: stores[0]._id, bag: bag._id, qty: 1, subtotal: bag.price, discount: 0,
        total: bag.price, pickupSlot: '19:00 – 21:00', paymentMethod: 'cash', status: 'completed', pickupCode: '0', reviewed: false, completedAt: when, createdAt: when, updatedAt: when,
      });
    }
  }

  const reviewTexts = [
    { rating: 5, comment: 'Bánh rất ngon, túi nhiều đồ hơn mong đợi. Chủ tiệm thân thiện!', tags: ['Đồ ăn ngon', 'Đáng tiền'], reply: 'Cảm ơn bạn đã ủng hộ tiệm nhé ❤️' },
    { rating: 4, comment: 'Đồ ăn ổn, nhưng phải đợi hơi lâu lúc nhận.', tags: ['Đáng tiền'] },
    { rating: 5, comment: 'Lần thứ 3 mua rồi, lần nào cũng hài lòng.', tags: ['Đồ ăn ngon', 'Nhân viên thân thiện'] },
  ];
  for (const store of stores) {
    for (const [i, t] of reviewTexts.entries()) {
      await Review.create({ store: store._id, buyer: others[i]._id, ...t });
    }
  }
  await Review.create({ store: orders[0].store, buyer: buyer._id, order: orders[0]._id, rating: 5, comment: 'Túi đầy ắp, rất đáng tiền!', tags: ['Đáng tiền'] });

  const in30 = new Date(Date.now() + 30 * 864e5);
  await Voucher.insertMany([
    { code: 'GIAICUU20', title: 'Giảm 20.000đ', discount: 20000, minOrder: 40000, expiresAt: in30, owner: buyer._id },
    { code: 'XANH10', title: 'Giảm 10%', percent: 10, minOrder: 0, expiresAt: in30, owner: buyer._id },
    { code: 'BANHNGOT15', title: 'Giảm 15.000đ cho bánh ngọt', discount: 15000, minOrder: 50000, expiresAt: new Date(Date.now() + 5 * 864e5), owner: buyer._id },
    { code: 'FOODSAVE', title: 'Giảm 5.000đ', discount: 5000, minOrder: 0, expiresAt: in30 },
  ]);

  const campaigns = await Campaign.insertMany([
    { title: 'Bữa cơm ấm cho trẻ em vùng cao', organization: 'Quỹ Trái Tim Xanh', location: 'Mái ấm Hoa Hồng, Hải Châu', description: 'Mỗi suất ăn 25.000đ giúp một em nhỏ có bữa tối đầy đủ dinh dưỡng. FoodSave kết hợp cửa hàng đối tác nấu và tình nguyện viên giao tận nơi.', goalMeals: 2000, raisedMeals: 1340, donors: 412, endsAt: new Date(Date.now() + 12 * 864e5) },
    { title: 'Suất ăn 0 đồng cho bệnh nhân', organization: 'Bếp Yêu Thương Đà Nẵng', location: 'Bệnh viện C, Hải Châu', description: 'Hỗ trợ bữa trưa miễn phí cho bệnh nhân và người nhà có hoàn cảnh khó khăn.', goalMeals: 1500, raisedMeals: 620, donors: 188, endsAt: new Date(Date.now() + 20 * 864e5) },
    { title: 'Tết ấm cho người vô gia cư', organization: 'Nhóm Thiện Nguyện Sông Hàn', location: 'Cầu Rồng, Sơn Trà', description: 'Phát suất ăn nóng mỗi tối thứ Bảy cho người vô gia cư quanh khu vực cầu Rồng.', goalMeals: 1000, raisedMeals: 905, donors: 301, endsAt: new Date(Date.now() + 4 * 864e5) },
  ]);
  await Donation.create({ user: buyer._id, campaign: campaigns[0]._id, meals: 2, amount: 50000, message: 'Chúc các em ngon miệng!' });

  await VolunteerTask.insertMany([
    { store: stores[0]._id, campaign: campaigns[0]._id, title: 'Giao 15 suất bánh ngọt', items: 'Bánh ngọt, bánh mì hoa cúc', meals: 15, fromAddress: stores[0].address, fromLocation: stores[0].location, toName: 'Mái ấm Hoa Hồng', toAddress: '25 Lê Đình Dương, Hải Châu', toLocation: { lat: 16.0608, lng: 108.2172 }, distanceKm: 1.8, pickupTime: '20:30', hours: 1 },
    { store: stores[2]._id, campaign: campaigns[1]._id, title: 'Giao 20 suất cơm tối', items: 'Cơm phần, canh', meals: 20, fromAddress: stores[2].address, fromLocation: stores[2].location, toName: 'Bệnh viện C', toAddress: '122 Hải Phòng, Hải Châu', toLocation: { lat: 16.0716, lng: 108.2161 }, distanceKm: 2.4, pickupTime: '19:45', hours: 1.5 },
    { store: stores[3]._id, campaign: campaigns[2]._id, title: 'Giao rau củ & sữa', items: 'Rau củ, sữa chua', meals: 12, fromAddress: stores[3].address, fromLocation: stores[3].location, toName: 'Cầu Rồng', toAddress: 'Chân cầu Rồng, Sơn Trà', toLocation: { lat: 16.0611, lng: 108.2275 }, distanceKm: 1.6, pickupTime: '21:00', hours: 1 },
    { store: stores[6]._id, campaign: campaigns[0]._id, title: 'Giao 10 suất cơm chay', items: 'Cơm chay', meals: 10, fromAddress: stores[6].address, fromLocation: stores[6].location, toName: 'Mái ấm Hoa Hồng', toAddress: '25 Lê Đình Dương, Hải Châu', toLocation: { lat: 16.0608, lng: 108.2172 }, distanceKm: 0.9, pickupTime: '18:30', hours: 1, volunteer: volunteer._id, status: 'done', completedAt: new Date(Date.now() - 2 * 864e5) },
    { store: stores[1]._id, campaign: campaigns[2]._id, title: 'Giao 25 ổ bánh mì', items: 'Bánh mì', meals: 25, fromAddress: stores[1].address, fromLocation: stores[1].location, toName: 'Cầu Rồng', toAddress: 'Chân cầu Rồng, Sơn Trà', toLocation: { lat: 16.0611, lng: 108.2275 }, distanceKm: 1.2, pickupTime: '19:00', hours: 1, volunteer: volunteer._id, status: 'done', completedAt: new Date(Date.now() - 6 * 864e5) },
  ]);

  await Reward.insertMany([
    { title: 'Voucher 20.000đ FoodSave', partner: 'FoodSave', cost: 200, stock: 100 },
    { title: 'Ly giữ nhiệt FoodSave', partner: 'FoodSave', cost: 500, stock: 20 },
    { title: 'Túi vải canvas', partner: 'Green Life', cost: 300, stock: 50 },
    { title: 'Trồng 1 cây xanh', partner: 'Quỹ Trái Tim Xanh', cost: 150, stock: 999 },
    { title: 'Cà phê miễn phí', partner: 'The Coffee Corner', cost: 120, stock: 40 },
    { title: 'Bộ ống hút inox', partner: 'Green Life', cost: 250, stock: 30 },
  ]);

  await Notification.insertMany([
    { user: buyer._id, title: 'Túi bất ngờ mới gần bạn', body: 'Tiệm Bánh Sông Hàn vừa đăng 3 túi bánh ngọt, nhận lúc 19:00.', type: 'promo' },
    { user: buyer._id, title: 'Bạn đã cứu 7,2 kg đồ ăn 🌱', body: 'Tương đương 18 kg CO₂ được giảm. Tiếp tục nhé!', type: 'impact', read: true },
    { user: buyer._id, title: 'Voucher sắp hết hạn', body: 'BANHNGOT15 hết hạn sau 5 ngày.', type: 'promo', read: true },
    { user: owner._id, title: 'Đơn hàng mới', body: '1 × Túi bất ngờ bánh ngọt — FS205100', type: 'order' },
    { user: volunteer._id, title: 'Có nhiệm vụ mới gần bạn', body: '15 suất bánh ngọt từ Tiệm Bánh Sông Hàn', type: 'task' },
  ]);

  console.log('🌱 Seed xong. Tài khoản demo (mật khẩu 123456): buyer@foodsave.vn · store@foodsave.vn · volunteer@foodsave.vn');
}

// `npm run seed`
if (require.main === module) {
  connectDb()
    .then(seed)
    .then(disconnectDb)
    .catch(async (e) => {
      console.error(e);
      await mongoose.disconnect();
      process.exit(1);
    });
}

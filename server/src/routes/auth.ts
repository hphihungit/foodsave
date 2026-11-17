import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, Store } from '../models';
import { ah, requireAuth, signToken, HttpError } from '../middleware/auth';
import { publicUser } from '../utils';

const r = Router();

r.post(
  '/register',
  ah(async (req, res) => {
    const { name, email, password, role = 'buyer', phone } = req.body ?? {};
    if (!name || !email || !password) throw new HttpError(400, 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu');
    if (String(password).length < 6) throw new HttpError(400, 'Mật khẩu phải có ít nhất 6 ký tự');
    if (!['buyer', 'store', 'volunteer'].includes(role)) throw new HttpError(400, 'Vai trò không hợp lệ');
    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) throw new HttpError(409, 'Email này đã được đăng ký');
    const user = await User.create({
      name,
      email,
      phone,
      role,
      passwordHash: await bcrypt.hash(password, 10),
      referralCode: 'FS' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    });
    res.status(201).json({ token: signToken(user.id, user.role as any), user: publicUser(user) });
  }),
);

r.post(
  '/login',
  ah(async (req, res) => {
    const { email, password } = req.body ?? {};
    const user = await User.findOne({ email: String(email ?? '').toLowerCase() });
    if (!user || !(await bcrypt.compare(String(password ?? ''), user.passwordHash)))
      throw new HttpError(401, 'Email hoặc mật khẩu không đúng');
    res.json({ token: signToken(user.id, user.role as any), user: publicUser(user) });
  }),
);

r.get(
  '/me',
  requireAuth,
  ah(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, 'Không tìm thấy tài khoản');
    const store = user.role === 'store' ? await Store.findOne({ owner: user._id }) : null;
    res.json({ user: publicUser(user), store });
  }),
);

// ---- Mocked flows (UI only): OTP & password reset always succeed ----
r.post('/send-otp', (_req, res) => res.json({ ok: true, message: 'Đã gửi mã OTP (giả lập)' }));
r.post('/verify-otp', (req, res) => {
  const code = String(req.body?.code ?? '');
  if (code.length !== 6) return res.status(400).json({ message: 'Mã OTP gồm 6 chữ số' });
  res.json({ ok: true });
});
r.post(
  '/reset-password',
  ah(async (req, res) => {
    const { email, password } = req.body ?? {};
    const user = await User.findOne({ email: String(email ?? '').toLowerCase() });
    // Demo: if the account exists, really update the password.
    if (user && password && String(password).length >= 6) {
      user.passwordHash = await bcrypt.hash(password, 10);
      await user.save();
    }
    res.json({ ok: true });
  }),
);

export default r;

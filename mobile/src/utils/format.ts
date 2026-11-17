/** 45000 → "45.000đ" */
export function money(n?: number | null) {
  return `${Math.round(n ?? 0).toLocaleString('vi-VN').replace(/,/g, '.')}đ`;
}

/** 7.199999 → "7,2" */
export function num(n?: number | null, digits = 1) {
  const v = Math.round((n ?? 0) * 10 ** digits) / 10 ** digits;
  return v.toLocaleString('vi-VN', { maximumFractionDigits: digits }).replace(/\./g, ',');
}

export function km(d?: number) {
  return d === undefined || d === null ? '' : `${num(d)} km`;
}

export function percentOff(price: number, original?: number) {
  if (!original || original <= price) return 0;
  return Math.round((1 - price / original) * 100);
}

export function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
  return dateVN(iso);
}

export function dateVN(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function timeVN(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[parts.length - 2][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

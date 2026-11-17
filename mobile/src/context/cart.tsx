import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Bag } from '@/api/types';

/**
 * Cart is kept on the device (one store at a time, like most food apps).
 * The order itself is created on the server at checkout.
 */
export type CartItem = { bag: Bag; qty: number };
type Ctx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (bag: Bag, qty?: number) => 'added' | 'replaced';
  setQty: (bagId: string, qty: number) => void;
  remove: (bagId: string) => void;
  clear: () => void;
};
const CartContext = createContext<Ctx | null>(null);
const KEY = 'foodsave.cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => v && setItems(JSON.parse(v)))
      .catch(() => {});
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  const add = useCallback(
    (bag: Bag, qty = 1) => {
      const otherStore = items.length > 0 && items[0].bag.store?._id !== bag.store?._id;
      setItems((prev) => {
        const base = otherStore ? [] : prev;
        const found = base.find((i) => i.bag._id === bag._id);
        if (found) return base.map((i) => (i.bag._id === bag._id ? { ...i, qty: Math.min(i.qty + qty, bag.quantity) } : i));
        return [...base, { bag, qty: Math.min(qty, bag.quantity) }];
      });
      return otherStore ? 'replaced' : 'added';
    },
    [items],
  );
  const setQty = useCallback((bagId: string, qty: number) => {
    setItems((prev) => prev.map((i) => (i.bag._id === bagId ? { ...i, qty: Math.max(1, Math.min(qty, i.bag.quantity)) } : i)));
  }, []);
  const remove = useCallback((bagId: string) => setItems((prev) => prev.filter((i) => i.bag._id !== bagId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.qty * i.bag.price, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, add, setQty, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

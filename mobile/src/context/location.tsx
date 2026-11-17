import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export type UserLocation = { lat: number; lng: number; label: string };

/** Default: Hải Châu, Đà Nẵng (matches the seeded stores and the Figma copy). */
export const DEFAULT_LOCATION: UserLocation = { lat: 16.0678, lng: 108.2208, label: 'Hải Châu, Đà Nẵng' };
const KEY = 'foodsave.location';

type Ctx = {
  location: UserLocation;
  setLocation: (l: UserLocation) => void;
  /** Asks permission and reads GPS. Returns false if denied. */
  detect: () => Promise<boolean>;
};
const LocationContext = createContext<Ctx | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLoc] = useState<UserLocation>(DEFAULT_LOCATION);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => v && setLoc(JSON.parse(v)))
      .catch(() => {});
  }, []);

  const setLocation = useCallback((l: UserLocation) => {
    setLoc(l);
    AsyncStorage.setItem(KEY, JSON.stringify(l)).catch(() => {});
  }, []);

  const detect = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    let label = 'Vị trí hiện tại';
    try {
      const [place] = await Location.reverseGeocodeAsync(pos.coords);
      if (place) label = [place.district || place.subregion || place.street, place.city || place.region].filter(Boolean).join(', ') || label;
    } catch {}
    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label });
    return true;
  }, [setLocation]);

  const value = useMemo(() => ({ location, setLocation, detect }), [location, setLocation, detect]);
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used inside LocationProvider');
  return ctx;
}

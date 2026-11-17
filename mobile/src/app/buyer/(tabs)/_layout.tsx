import { House, Map, ShoppingBag, Leaf, User } from 'lucide-react-native';
import { Tabs, tabIcon, tabScreenOptions } from '@/components/tabs';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="home" options={{ title: 'Trang chủ', tabBarIcon: tabIcon(House) }} />
      <Tabs.Screen name="map" options={{ title: 'Bản đồ', tabBarIcon: tabIcon(Map) }} />
      <Tabs.Screen name="orders" options={{ title: 'Đơn hàng', tabBarIcon: tabIcon(ShoppingBag) }} />
      <Tabs.Screen name="impact" options={{ title: 'Tác động', tabBarIcon: tabIcon(Leaf) }} />
      <Tabs.Screen name="account" options={{ title: 'Tài khoản', tabBarIcon: tabIcon(User) }} />
    </Tabs>
  );
}

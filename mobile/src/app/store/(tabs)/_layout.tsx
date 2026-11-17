import { LayoutDashboard, ShoppingBag, ClipboardList, ChartColumn, Store } from 'lucide-react-native';
import { Tabs, tabIcon, tabScreenOptions } from '@/components/tabs';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="dashboard" options={{ title: 'Tổng quan', tabBarIcon: tabIcon(LayoutDashboard) }} />
      <Tabs.Screen name="bags" options={{ title: 'Túi', tabBarIcon: tabIcon(ShoppingBag) }} />
      <Tabs.Screen name="orders" options={{ title: 'Đơn hàng', tabBarIcon: tabIcon(ClipboardList) }} />
      <Tabs.Screen name="revenue" options={{ title: 'Doanh thu', tabBarIcon: tabIcon(ChartColumn) }} />
      <Tabs.Screen name="profile" options={{ title: 'Cửa hàng', tabBarIcon: tabIcon(Store) }} />
    </Tabs>
  );
}

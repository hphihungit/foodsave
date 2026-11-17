import { ClipboardList, Map, History, User } from 'lucide-react-native';
import { Tabs, tabIcon, tabScreenOptions } from '@/components/tabs';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="tasks" options={{ title: 'Nhiệm vụ', tabBarIcon: tabIcon(ClipboardList) }} />
      <Tabs.Screen name="map" options={{ title: 'Bản đồ', tabBarIcon: tabIcon(Map) }} />
      <Tabs.Screen name="history" options={{ title: 'Lịch sử', tabBarIcon: tabIcon(History) }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarIcon: tabIcon(User) }} />
    </Tabs>
  );
}

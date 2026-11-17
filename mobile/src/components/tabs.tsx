import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, fonts } from '@/theme';
import { Screen, Text, Illustration } from './ui';
import { Hammer } from 'lucide-react-native';

/** Nav/Bottom Nav from Figma: white bar, green active tint, caption labels. */
export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary500,
  tabBarInactiveTintColor: colors.textTertiary,
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 84, paddingTop: 8 },
  tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
} as const;

export function tabIcon(Icon: LucideIcon) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Icon size={24} color={color as string} strokeWidth={2} />;
  };
}

export { Tabs };

/** Temporary screen for tabs that later phases will fill in. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <Screen contentStyle={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Illustration icon={Hammer} size={180} />
      <Text variant="h2" center>
        {title}
      </Text>
      <Text center>Màn hình này sẽ được hoàn thiện ở giai đoạn tiếp theo.</Text>
    </Screen>
  );
}

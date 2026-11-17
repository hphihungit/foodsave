// B-05 Chọn vai trò
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { HeartHandshake, ShoppingBag, Store, LucideIcon } from 'lucide-react-native';
import { Button, Radio, Screen, Text } from '@/components/ui';
import { colors } from '@/theme';
import type { Role } from '@/api/types';

const ROLES: { role: Role; icon: LucideIcon; title: string; desc: string }[] = [
  { role: 'buyer', icon: ShoppingBag, title: 'Người mua', desc: 'Tìm và mua đồ ăn giá tốt gần bạn' },
  { role: 'store', icon: Store, title: 'Cửa hàng đối tác', desc: 'Đăng bán đồ ăn dư, giảm lãng phí, tăng doanh thu' },
  { role: 'volunteer', icon: HeartHandshake, title: 'Tình nguyện viên', desc: 'Nhận và giao suất ăn đến người khó khăn' },
];

function RoleOptionCard({ icon: Icon, title, desc, selected, onPress }: { icon: LucideIcon; title: string; desc: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        minHeight: 80,
        borderRadius: 16,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? colors.primary500 : colors.border,
        backgroundColor: selected ? colors.primary50 : colors.surface,
      }}
    >
      <View style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.surface : colors.primary50 }}>
        <Icon size={24} color={selected ? colors.text : colors.primary500} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyMedium">{title}</Text>
        <Text variant="bodyS" color={colors.textSecondary}>
          {desc}
        </Text>
      </View>
      <Radio checked={selected} />
    </Pressable>
  );
}

export default function RolePicker() {
  const [role, setRole] = useState<Role>('buyer');
  return (
    <Screen contentStyle={{ paddingTop: 24, paddingBottom: 16, gap: 12 }}>
      <Text variant="h1">Bạn là ai?</Text>
      <Text color={colors.textSecondary}>Chọn vai trò để FoodSave phục vụ bạn tốt nhất. Bạn có thể đổi lại trong phần Cài đặt.</Text>
      <View style={{ height: 12 }} />
      {ROLES.map((r) => (
        <RoleOptionCard key={r.role} icon={r.icon} title={r.title} desc={r.desc} selected={role === r.role} onPress={() => setRole(r.role)} />
      ))}
      <View style={{ flex: 1 }} />
      <Button label="Tiếp tục" onPress={() => router.push({ pathname: '/(auth)/login', params: { role } })} />
    </Screen>
  );
}

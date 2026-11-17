// B-12 Chọn sở thích
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, Footer, LinkText, Screen, Text } from '@/components/ui';
import { colors } from '@/theme';
import { api, errorMessage } from '@/api/client';
import { homeFor, useAuth } from '@/context/auth';
import { DIETS, FOODS } from '@/utils/constants';


export default function Interests() {
  const { user, setUser } = useAuth();
  const [picked, setPicked] = useState<string[]>(user?.interests ?? []);
  const [loading, setLoading] = useState(false);
  const toggle = (x: string) => setPicked((p) => (p.includes(x) ? p.filter((i) => i !== x) : [...p, x]));
  const done = () => router.replace(homeFor(user?.role));

  const save = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch('/users/me', { interests: picked });
      setUser(data.user);
      done();
    } catch (e) {
      Alert.alert('Lỗi', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const section = (title: string, items: string[]) => (
    <View style={{ gap: 12 }}>
      <Text variant="h3">{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {items.map((x) => (
          <Chip key={x} label={x} selected={picked.includes(x)} onPress={() => toggle(x)} />
        ))}
      </View>
    </View>
  );

  return (
    <Screen
      bg={colors.surface}
      scroll
      contentStyle={{ gap: 20, paddingBottom: 16 }}
      footer={
        <Footer>
          <Button label={picked.length >= 3 ? `Hoàn tất · ${picked.length} món đã chọn` : `Chọn thêm ${3 - picked.length} món`} disabled={picked.length < 3} loading={loading} onPress={save} />
        </Footer>
      }
    >
      <View style={{ alignItems: 'flex-end', paddingTop: 8 }}>
        <LinkText color={colors.textSecondary} onPress={done}>
          Bỏ qua
        </LinkText>
      </View>
      <View style={{ gap: 8 }}>
        <Text variant="h1">Bạn thích ăn gì?</Text>
        <Text color={colors.textSecondary}>Chọn ít nhất 3 món để FoodSave gợi ý túi bất ngờ hợp khẩu vị hơn.</Text>
      </View>
      {section('Món ăn', FOODS)}
      {section('Chế độ ăn', DIETS)}
    </Screen>
  );
}

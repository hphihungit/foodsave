// B-11 Cấp quyền vị trí
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { Button, Footer, Illustration, Screen, Text } from '@/components/ui';
import { colors } from '@/theme';
import { DEFAULT_LOCATION, useLocation } from '@/context/location';

export default function LocationPermission() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { detect, setLocation } = useLocation();
  const [loading, setLoading] = useState(false);

  const go = () => (next === 'interests' ? router.replace('/(auth)/interests') : router.back());

  const allow = async () => {
    setLoading(true);
    try {
      const ok = await detect();
      if (!ok) Alert.alert('Chưa có quyền vị trí', `FoodSave sẽ dùng vị trí mặc định: ${DEFAULT_LOCATION.label}. Bạn có thể bật lại trong Cài đặt.`);
    } catch {
      Alert.alert('Không lấy được vị trí', `Đang dùng vị trí mặc định: ${DEFAULT_LOCATION.label}.`);
    } finally {
      setLoading(false);
      go();
    }
  };

  const manual = () => {
    setLocation(DEFAULT_LOCATION);
    Alert.alert('Địa chỉ mặc định', `Đã đặt vị trí là ${DEFAULT_LOCATION.label}. Bạn có thể đổi trong "Địa chỉ đã lưu".`, [{ text: 'OK', onPress: go }]);
  };

  return (
    <Screen
      bg={colors.surface}
      contentStyle={{ alignItems: 'center', justifyContent: 'center', gap: 24 }}
      footer={
        <Footer>
          <Button label="Cho phép truy cập vị trí" onPress={allow} loading={loading} />
          <Button label="Nhập địa chỉ thủ công" variant="secondary" onPress={manual} />
        </Footer>
      }
    >
      <Illustration icon={MapPin} size={260} />
      <View style={{ gap: 12 }}>
        <Text variant="h1" center>
          Tìm đồ ăn quanh bạn
        </Text>
        <Text center color={colors.textSecondary}>
          Cho phép FoodSave truy cập vị trí để gợi ý cửa hàng gần nhất và chỉ đường khi bạn đi nhận đồ.
        </Text>
      </View>
    </Screen>
  );
}

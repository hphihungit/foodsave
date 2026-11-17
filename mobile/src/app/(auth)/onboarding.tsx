// B-02, B-03, B-04 Onboarding
import { useRef, useState } from 'react';
import { FlatList, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeartHandshake, Leaf, ShoppingBag, LucideIcon } from 'lucide-react-native';
import { Button, Illustration, LinkText, PageDots, Screen, Text } from '@/components/ui';
import { colors } from '@/theme';
import { ONBOARDED_KEY } from '@/utils/keys';

const SLIDES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: ShoppingBag, title: 'Đồ ăn ngon, giá chỉ bằng một nửa', body: 'Mua lại những phần đồ ăn còn dư cuối ngày từ quán quen với giá giảm 50–70%.' },
  { icon: Leaf, title: 'Mỗi bữa ăn được cứu là một phần Trái Đất được bảo vệ', body: 'Theo dõi số kg đồ ăn bạn đã cứu và lượng CO₂ giảm được mỗi ngày.' },
  { icon: HeartHandshake, title: 'Cùng sẻ chia với người khó khăn', body: 'Quyên góp suất ăn để tình nguyện viên mang đến những người cần hơn.' },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList>(null);

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
    router.replace('/(auth)/role');
  };
  const next = () => (index < SLIDES.length - 1 ? list.current?.scrollToIndex({ index: index + 1 }) : finish());

  return (
    <Screen padded={false}>
      <View style={{ height: 36, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 20 }}>
        {index < SLIDES.length - 1 && (
          <LinkText color={colors.textSecondary} onPress={finish}>
            Bỏ qua
          </LinkText>
        )}
      </View>
      <FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.title}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: 20, paddingTop: 8, alignItems: 'center', gap: 24 }}>
            <Illustration icon={item.icon} size={Math.min(280, width - 110)} />
            <View style={{ gap: 12 }}>
              <Text variant="h1" center>
                {item.title}
              </Text>
              <Text center color={colors.textSecondary}>
                {item.body}
              </Text>
            </View>
          </View>
        )}
      />
      <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 24 }}>
        <PageDots count={SLIDES.length} index={index} />
        <Button label={index === SLIDES.length - 1 ? 'Bắt đầu ngay' : 'Tiếp tục'} onPress={next} />
      </View>
    </Screen>
  );
}

// B-01 Splash
import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo, Text } from '@/components/ui';
import { colors } from '@/theme';
import { homeFor, useAuth } from '@/context/auth';
import { ONBOARDED_KEY } from '@/utils/keys';


export default function Splash() {
  const { ready, user } = useAuth();

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(async () => {
      if (user) return router.replace(homeFor(user.role));
      const seen = await AsyncStorage.getItem(ONBOARDED_KEY).catch(() => null);
      router.replace(seen ? '/(auth)/login' : '/(auth)/onboarding');
    }, 1200);
    return () => clearTimeout(t);
  }, [ready, user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary500 }}>
      <StatusBar style="light" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 20 }}>
        <Logo inverse scale={1.4} />
        <Text color={colors.onPrimary} style={{ opacity: 0.9 }}>
          Giải cứu đồ ăn – Chia sẻ yêu thương
        </Text>
      </View>
      <Text variant="caption" color={colors.onPrimary} center style={{ opacity: 0.7, marginBottom: 8 }}>
        Phiên bản 1.0
      </Text>
    </SafeAreaView>
  );
}

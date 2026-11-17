// B-09 Quên mật khẩu
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { Button, Footer, Illustration, Input, Screen, Text, TopAppBar } from '@/components/ui';
import { colors } from '@/theme';
import { api } from '@/api/client';
import { isEmail } from '@/utils/format';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!isEmail(email)) return setError('Email không hợp lệ');
    setError(undefined);
    setLoading(true);
    await api.post('/auth/send-otp', { email }).catch(() => {});
    setLoading(false);
    router.push({ pathname: '/(auth)/otp', params: { mode: 'reset', target: email.trim() } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        bg={colors.surface}
        header={<TopAppBar />}
        scroll
        contentStyle={{ alignItems: 'center', gap: 16 }}
        footer={
          <Footer>
            <Button label="Gửi mã xác thực" onPress={send} loading={loading} />
            <Button label="Quay lại đăng nhập" variant="secondary" onPress={() => router.back()} />
          </Footer>
        }
      >
        <Illustration icon={Lock} size={180} />
        <Text variant="h1" center>
          Quên mật khẩu?
        </Text>
        <Text center color={colors.textSecondary}>
          Nhập email đã đăng ký. Chúng tôi sẽ gửi mã để bạn đặt lại mật khẩu.
        </Text>
        <View style={{ alignSelf: 'stretch' }}>
          <Input label="Email" placeholder="email@vidu.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={error} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

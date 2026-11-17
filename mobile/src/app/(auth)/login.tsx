// B-06 Đăng nhập
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Divider, Input, LinkText, Logo, Row, Screen, Text } from '@/components/ui';
import { colors, radius } from '@/theme';
import { errorMessage } from '@/api/client';
import { homeFor, useAuth } from '@/context/auth';
import { isEmail } from '@/utils/format';
import type { Role } from '@/api/types';

const DEMO: { role: Role; label: string; email: string }[] = [
  { role: 'buyer', label: 'Người mua', email: 'buyer@foodsave.vn' },
  { role: 'store', label: 'Cửa hàng', email: 'store@foodsave.vn' },
  { role: 'volunteer', label: 'TNV', email: 'volunteer@foodsave.vn' },
];

function SocialButton({ label, color, size }: { label: string; color: string; size: number }) {
  return (
    <Pressable
      onPress={() => Alert.alert('Đăng nhập mạng xã hội', 'Tính năng đang được phát triển. Vui lòng đăng nhập bằng email.')}
      style={{ flex: 1, height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text variant="h2" style={{ fontSize: size }} color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Login() {
  const { role } = useLocalSearchParams<{ role?: Role }>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: typeof errors = {};
    if (!isEmail(email)) e.email = 'Email không hợp lệ';
    if (password.length < 6) e.password = 'Mật khẩu có ít nhất 6 ký tự';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const user = await login(email, password);
      router.replace(homeFor(user.role));
    } catch (err) {
      Alert.alert('Đăng nhập thất bại', errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bg={colors.surface} scroll contentStyle={{ paddingTop: 24, paddingBottom: 16, gap: 16 }}>
        <Logo />
        <View style={{ gap: 6 }}>
          <Text variant="h1">Chào mừng trở lại!</Text>
          <Text color={colors.textSecondary}>Đăng nhập để tiếp tục giải cứu đồ ăn quanh bạn.</Text>
        </View>
        <Input
          label="Email"
          placeholder="Nhập email của bạn"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          error={errors.email}
        />
        <Input label="Mật khẩu" placeholder="Nhập mật khẩu" value={password} onChangeText={setPassword} password error={errors.password} onSubmitEditing={submit} />
        <View style={{ alignItems: 'flex-end' }}>
          <LinkText onPress={() => router.push('/(auth)/forgot')}>Quên mật khẩu?</LinkText>
        </View>
        <Button label="Đăng nhập" onPress={submit} loading={loading} />
        <Divider label="hoặc tiếp tục với" />
        <Row gap={12}>
          <SocialButton label="G" color="#EB4236" size={22} />
          <SocialButton label="f" color="#1778F2" size={22} />
          <SocialButton label="Zalo" color="#0069FF" size={16} />
        </Row>

        <View style={{ gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.bg }}>
          <Text variant="caption" color={colors.textSecondary}>
            Tài khoản demo (mật khẩu 123456) — chạm để điền:
          </Text>
          <Row gap={8}>
            {DEMO.map((d) => (
              <Pressable
                key={d.role}
                onPress={() => {
                  setEmail(d.email);
                  setPassword('123456');
                }}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: role === d.role ? colors.primary500 : colors.border, backgroundColor: colors.surface }}
              >
                <Text variant="captionMedium" color={colors.primary500}>
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </Row>
        </View>

        <View style={{ flex: 1 }} />
        <Row gap={4} style={{ justifyContent: 'center' }}>
          <Text variant="bodyS" color={colors.textSecondary}>
            Chưa có tài khoản?
          </Text>
          <LinkText onPress={() => router.push({ pathname: '/(auth)/register', params: { role: role ?? 'buyer' } })}>Đăng ký ngay</LinkText>
        </Row>
      </Screen>
    </KeyboardAvoidingView>
  );
}

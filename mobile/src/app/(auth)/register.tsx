// B-07 Đăng ký
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Checkbox, Input, LinkText, Row, Screen, Text, TopAppBar } from '@/components/ui';
import { colors } from '@/theme';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/auth';
import { isEmail } from '@/utils/format';
import type { Role } from '@/api/types';

const ROLE_LABEL: Record<Role, string> = { buyer: 'Người mua', store: 'Cửa hàng đối tác', volunteer: 'Tình nguyện viên' };

export default function Register() {
  const { role = 'buyer' } = useLocalSearchParams<{ role?: Role }>();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [agree, setAgree] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Vui lòng nhập họ tên';
    if (!/^0\d{9}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Số điện thoại gồm 10 số, bắt đầu bằng 0';
    if (!isEmail(form.email)) e.email = 'Email không hợp lệ';
    if (form.password.length < 6) e.password = 'Mật khẩu có ít nhất 6 ký tự';
    setErrors(e);
    if (Object.keys(e).length) return;
    if (!agree) return Alert.alert('Điều khoản', 'Bạn cần đồng ý với Điều khoản sử dụng để tiếp tục.');
    setLoading(true);
    try {
      await register({ ...form, phone: form.phone.replace(/\s/g, ''), role });
      router.replace({ pathname: '/(auth)/otp', params: { mode: 'register', target: form.phone, role } });
    } catch (err) {
      Alert.alert('Đăng ký thất bại', errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bg={colors.surface} header={<TopAppBar title="Tạo tài khoản" />} scroll contentStyle={{ paddingTop: 8, paddingBottom: 16, gap: 14 }}>
        <Text color={colors.textSecondary}>Chỉ mất 1 phút để bắt đầu hành trình giảm lãng phí thực phẩm.</Text>
        {role !== 'buyer' && (
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.primary50 }}>
            <Text variant="captionMedium" color={colors.primary700}>
              Vai trò: {ROLE_LABEL[role]}
            </Text>
          </View>
        )}
        <Input label="Họ và tên" placeholder="Nguyễn Văn A" value={form.name} onChangeText={set('name')} error={errors.name} autoComplete="name" />
        <Input label="Số điện thoại" placeholder="0912 345 678" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} />
        <Input label="Email" placeholder="email@vidu.com" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        <Input label="Mật khẩu" placeholder="Ít nhất 6 ký tự" value={form.password} onChangeText={set('password')} password error={errors.password} />
        <Row gap={10} style={{ alignItems: 'flex-start' }}>
          <Checkbox checked={agree} onPress={() => setAgree((a) => !a)} />
          <Text variant="bodyS" color={colors.textSecondary} style={{ flex: 1 }}>
            Tôi đồng ý với <Text variant="bodyS" color={colors.primary500}>Điều khoản sử dụng</Text> và{' '}
            <Text variant="bodyS" color={colors.primary500}>Chính sách bảo mật</Text> của FoodSave
          </Text>
        </Row>
        <View style={{ flex: 1, minHeight: 16 }} />
        <Button label="Đăng ký" onPress={submit} loading={loading} />
        <Row gap={4} style={{ justifyContent: 'center' }}>
          <Text variant="bodyS" color={colors.textSecondary}>
            Đã có tài khoản?
          </Text>
          <LinkText onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}>Đăng nhập</LinkText>
        </Row>
      </Screen>
    </KeyboardAvoidingView>
  );
}

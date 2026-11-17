// B-10 Đặt lại mật khẩu
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Button, Footer, Input, Row, Screen, Text, TopAppBar } from '@/components/ui';
import { colors, radius } from '@/theme';
import { api, errorMessage } from '@/api/client';

export default function Reset() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);

  const rules = [
    { label: 'Ít nhất 8 ký tự', ok: pw.length >= 8 },
    { label: 'Có cả chữ hoa và chữ thường', ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { label: 'Có ít nhất 1 chữ số', ok: /\d/.test(pw) },
  ];
  const mismatch = pw2.length > 0 && pw !== pw2;
  const valid = rules.every((r) => r.ok) && pw === pw2;

  const save = async () => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, password: pw });
      Alert.alert('Đổi mật khẩu thành công', 'Hãy đăng nhập lại bằng mật khẩu mới.', [{ text: 'Đăng nhập', onPress: () => router.dismissTo('/(auth)/login') }]);
    } catch (e) {
      Alert.alert('Lỗi', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        bg={colors.surface}
        header={<TopAppBar />}
        scroll
        contentStyle={{ gap: 16 }}
        footer={
          <Footer>
            <Button label="Lưu mật khẩu" disabled={!valid} loading={loading} onPress={save} />
          </Footer>
        }
      >
        <Text variant="h1">Tạo mật khẩu mới</Text>
        <Text color={colors.textSecondary}>Mật khẩu mới phải khác mật khẩu bạn đã dùng trước đây.</Text>
        <Input label="Mật khẩu mới" value={pw} onChangeText={setPw} password placeholder="Nhập mật khẩu mới" />
        <Input label="Nhập lại mật khẩu" value={pw2} onChangeText={setPw2} password placeholder="Nhập lại mật khẩu" error={mismatch ? 'Mật khẩu nhập lại không khớp' : undefined} />
        <View style={{ backgroundColor: colors.bg, borderRadius: radius.md, padding: 14, gap: 10 }}>
          {rules.map((r) => (
            <Row key={r.label} gap={10}>
              <Check size={18} color={r.ok ? colors.primary500 : colors.textTertiary} />
              <Text variant="bodyS" color={r.ok ? colors.text : colors.textTertiary}>
                {r.label}
              </Text>
            </Row>
          ))}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

// B-08 Nhập OTP (giả lập: mã 6 số bất kỳ đều hợp lệ)
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Footer, LinkText, Row, Screen, Text, TopAppBar } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { api, errorMessage } from '@/api/client';
import type { Role } from '@/api/types';
import { afterSignup } from '@/utils/flows';

const LEN = 6;

export default function Otp() {
  const { mode = 'register', target = '', role = 'buyer' } = useLocalSearchParams<{ mode?: 'register' | 'reset'; target?: string; role?: Role }>();
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(45);
  const [loading, setLoading] = useState(false);
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const verify = async () => {
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { code });
      if (mode === 'reset') router.replace({ pathname: '/(auth)/reset', params: { email: target } });
      else afterSignup(role);
    } catch (e) {
      Alert.alert('Mã không hợp lệ', errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      bg={colors.surface}
      header={<TopAppBar title="Xác thực" />}
      contentStyle={{ paddingTop: 16, gap: 16 }}
      footer={
        <Footer>
          <Button label="Xác nhận" disabled={code.length < LEN} loading={loading} onPress={verify} />
        </Footer>
      }
    >
      <Text variant="h1">Nhập mã xác thực</Text>
      <Text color={colors.textSecondary}>
        Mã gồm 6 chữ số đã được gửi đến {mode === 'reset' ? 'email' : 'số điện thoại'}{' '}
        <Text variant="bodyMedium" style={{ fontFamily: fonts.semibold }}>
          {target}
        </Text>
      </Text>
      <Pressable onPress={() => input.current?.focus()}>
        <Row between>
          {Array.from({ length: LEN }).map((_, i) => {
            const filled = i < code.length;
            const active = i === code.length;
            return (
              <View
                key={i}
                style={{
                  width: 48,
                  height: 56,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: active ? 2 : 1,
                  borderColor: filled || active ? colors.primary500 : colors.border,
                  backgroundColor: filled ? colors.primary50 : colors.surface,
                }}
              >
                <Text variant="h2" color={active ? colors.primary500 : colors.text}>
                  {filled ? code[i] : active ? '|' : ''}
                </Text>
              </View>
            );
          })}
        </Row>
      </Pressable>
      <TextInput
        ref={input}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, LEN))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoFocus
        maxLength={LEN}
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
      />
      <Row gap={4} style={{ justifyContent: 'center' }}>
        {seconds > 0 ? (
          <>
            <Text variant="bodyS" color={colors.textSecondary}>
              Gửi lại mã sau
            </Text>
            <Text variant="bodySMedium" color={colors.primary500}>
              00:{String(seconds).padStart(2, '0')}
            </Text>
          </>
        ) : (
          <LinkText
            onPress={() => {
              api.post('/auth/send-otp').catch(() => {});
              setSeconds(45);
              Alert.alert('Đã gửi lại mã', 'Bản demo: nhập 6 chữ số bất kỳ để tiếp tục.');
            }}
          >
            Gửi lại mã
          </LinkText>
        )}
      </Row>
      <Text variant="caption" color={colors.textTertiary} center>
        Bản demo: nhập 6 chữ số bất kỳ.
      </Text>
    </Screen>
  );
}

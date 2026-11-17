import React, { forwardRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check, Eye, EyeOff, Leaf, LucideIcon } from 'lucide-react-native';
import { colors, fonts, radius, type, TypeVariant } from '@/theme';

// ---------------------------------------------------------------- Text
type AppTextProps = TextProps & { variant?: TypeVariant; color?: string; center?: boolean };
export function Text({ variant = 'body', color = colors.text, center, style, ...rest }: AppTextProps) {
  return <RNText {...rest} style={[type[variant], { color }, center && { textAlign: 'center' }, style]} />;
}

// ---------------------------------------------------------------- Screen
type ScreenProps = {
  children: React.ReactNode;
  bg?: string;
  scroll?: boolean;
  edges?: Edge[];
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  refreshControl?: React.ComponentProps<typeof ScrollView>['refreshControl'];
};
/** Page container: safe area + optional header/footer + scroll body (gutter 20 from Figma). */
export function Screen({ children, bg = colors.bg, scroll, edges = ['top', 'bottom'], padded = true, style, contentStyle, header, footer, refreshControl }: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[padded && styles.padded, { flexGrow: 1 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && styles.padded, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: bg }, style]}>
      {header}
      {body}
      {footer}
    </SafeAreaView>
  );
}

export function Footer({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

// ---------------------------------------------------------------- TopAppBar (Nav/Top App Bar, 56h)
export function TopAppBar({
  title,
  onBack,
  right,
  back = true,
  transparent,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  back?: boolean;
  transparent?: boolean;
}) {
  return (
    <View style={[styles.appBar, transparent && { backgroundColor: 'transparent' }]}>
      {back ? (
        <IconButton icon={ArrowLeft} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} />
      ) : (
        <View style={{ width: 40 }} />
      )}
      <Text variant="h3" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
        {title}
      </Text>
      <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function IconButton({
  icon: Icon,
  onPress,
  color = colors.text,
  size = 24,
  bg,
  style,
  badge,
}: {
  icon: LucideIcon;
  onPress?: () => void;
  color?: string;
  size?: number;
  bg?: string;
  style?: StyleProp<ViewStyle>;
  badge?: boolean;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.iconBtn, bg && { backgroundColor: bg }, pressed && { opacity: 0.6 }, style]}>
      <Icon size={size} color={color} strokeWidth={2} />
      {badge && <View style={styles.badgeDot} />}
    </Pressable>
  );
}

// ---------------------------------------------------------------- Button (Primary/Secondary/Ghost/Disabled × L/S)
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'L',
  disabled,
  loading,
  icon: Icon,
  style,
  full = true,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'L' | 'S';
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
}) {
  const v = disabled ? btn.disabled : btn[variant];
  const fg = (v.color as string) ?? colors.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        size === 'S' && styles.btnS,
        full && { alignSelf: 'stretch' },
        { backgroundColor: v.backgroundColor, borderColor: v.borderColor ?? 'transparent' },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {Icon && <Icon size={size === 'L' ? 20 : 18} color={fg} />}
          <Text variant={size === 'L' ? 'button' : 'buttonS'} color={fg}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
const btn: Record<ButtonVariant | 'disabled', { backgroundColor: string; borderColor?: string; color?: string }> = {
  primary: { backgroundColor: colors.primary500 },
  accent: { backgroundColor: colors.accent500 },
  secondary: { backgroundColor: colors.surface, borderColor: colors.primary500, color: colors.primary500 },
  ghost: { backgroundColor: 'transparent', color: colors.primary500 },
  danger: { backgroundColor: colors.surface, borderColor: colors.error, color: colors.error },
  disabled: { backgroundColor: colors.border, color: colors.textTertiary },
};

// ---------------------------------------------------------------- Input (Default/Focus/Error/Disabled)
type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  password?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  multiline?: boolean;
};
export const Input = forwardRef<React.ComponentRef<typeof TextInput>, InputProps>(function Input(
  { label, error, helper, password, left, right, containerStyle, editable = true, multiline, style, ...rest },
  ref,
) {
  const [focus, setFocus] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? colors.error : focus ? colors.primary500 : colors.border;
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && <Text variant="bodySMedium">{label}</Text>}
      <View
        style={[
          styles.field,
          { borderColor, borderWidth: focus || error ? 1.5 : 1 },
          !editable && { backgroundColor: colors.bg },
          multiline && { height: undefined, minHeight: 104, alignItems: 'flex-start', paddingVertical: 12 },
        ]}
      >
        {left}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          editable={editable}
          secureTextEntry={password && hidden}
          multiline={multiline}
          onFocus={(e) => {
            setFocus(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            rest.onBlur?.(e);
          }}
          style={[styles.fieldInput, !editable && { color: colors.textTertiary }, multiline && { textAlignVertical: 'top' }, style as StyleProp<TextStyle>]}
          {...rest}
        />
        {password && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            {hidden ? <Eye size={20} color={colors.textTertiary} /> : <EyeOff size={20} color={colors.textTertiary} />}
          </Pressable>
        )}
        {right}
      </View>
      {(error || helper) && (
        <Text variant="caption" color={error ? colors.error : colors.textSecondary}>
          {error || helper}
        </Text>
      )}
    </View>
  );
});

// ---------------------------------------------------------------- Chip (Default/Selected)
export function Chip({ label, selected, onPress, icon: Icon, style }: { label: string; selected?: boolean; onPress?: () => void; icon?: LucideIcon; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn, style]}>
      {Icon && <Icon size={16} color={selected ? colors.onPrimary : colors.text} />}
      <Text variant="bodySMedium" color={selected ? colors.onPrimary : colors.text}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------- Checkbox / Radio / Toggle
export function Checkbox({ checked, onPress }: { checked: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={[styles.checkbox, checked && styles.checkboxOn]}>
      {checked && <Check size={14} color={colors.onPrimary} strokeWidth={3} />}
    </Pressable>
  );
}
export function Radio({ checked }: { checked: boolean }) {
  return <View style={[styles.radio, checked && styles.radioOn]}>{checked && <View style={styles.radioDot} />}</View>;
}
export function Toggle({ value, onChange }: { value: boolean; onChange?: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange?.(!value)} style={[styles.toggle, value && { backgroundColor: colors.primary500 }]}>
      <View style={[styles.knob, value && { transform: [{ translateX: 18 }] }]} />
    </Pressable>
  );
}

// ---------------------------------------------------------------- Brand/Logo
export function Logo({ inverse, scale = 1 }: { inverse?: boolean; scale?: number }) {
  const s = 40 * scale;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 * scale }}>
      <View style={{ width: s, height: s, borderRadius: 12 * scale, backgroundColor: inverse ? colors.surface : colors.primary500, alignItems: 'center', justifyContent: 'center' }}>
        <Leaf size={24 * scale} color={inverse ? colors.primary500 : colors.onPrimary} strokeWidth={2} />
      </View>
      <Text style={{ fontFamily: fonts.bold, fontSize: 22 * scale, lineHeight: 30 * scale }} color={inverse ? colors.onPrimary : colors.text}>
        FoodSave
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------- Illustration (big circle with icon, used by onboarding/permission/empty)
export function Illustration({ icon: Icon, size = 280, color = colors.primary500, bg = colors.primary50 }: { icon: LucideIcon; size?: number; color?: string; bg?: string }) {
  const inner = size * 0.62;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={size * 0.3} color={color} strokeWidth={2} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Nav/Page Dots
export function PageDots({ count, index }: { count: number; index: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignSelf: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ height: 8, width: i === index ? 24 : 8, borderRadius: 4, backgroundColor: i === index ? colors.primary500 : colors.border }} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- misc
export function Divider({ label, style }: { label?: string; style?: StyleProp<ViewStyle> }) {
  if (!label) return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <Text variant="caption" color={colors.textTertiary}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }, style]}>
        {children}
      </Pressable>
    );
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, gap = 8, style, between }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle>; between?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, between && { justifyContent: 'space-between' }, style]}>{children}</View>;
}

export function Loading({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }, style]}>
      <ActivityIndicator color={colors.primary500} size="large" />
    </View>
  );
}

export function LinkText({ children, onPress, variant = 'bodySMedium', color = colors.primary500 }: { children: React.ReactNode; onPress?: () => void; variant?: TypeVariant; color?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text variant={variant} color={color}>
        {children}
      </Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  padded: { paddingHorizontal: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 12, backgroundColor: 'transparent' },
  appBar: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badgeDot: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error, borderWidth: 1.5, borderColor: colors.surface },
  btn: { height: 52, borderRadius: radius.md, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5 },
  btnS: { height: 40, paddingHorizontal: 16, borderRadius: 10 },
  field: { height: 52, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fieldInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingVertical: 0 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 38, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary500, borderColor: colors.primary500 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.primary500, borderColor: colors.primary500 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.primary500, backgroundColor: colors.primary500 },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: colors.border, padding: 3 },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16 },
});

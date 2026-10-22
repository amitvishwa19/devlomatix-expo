import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

export default function CustomButton({
  onPress,
  title,
  icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}) {
  const { isDark } = useAppTheme();
  const isPrimary = variant === 'primary';

  const secondaryBg     = isDark ? '#0d1526' : '#ffffff';
  const secondaryBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
  const secondaryText   = isDark ? '#e2e8f0' : '#0f172a';

  const content = loading ? (
    <ActivityIndicator size="small" color={isPrimary ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')} />
  ) : (
    <>
      {icon && <View style={{ marginRight: 9 }}>{icon}</View>}
      <Text style={{ fontSize: 14, fontWeight: '700', letterSpacing: 0.2, color: isPrimary ? '#ffffff' : secondaryText }}>
        {title}
      </Text>
    </>
  );

  if (isPrimary) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={[{
          height: 50, borderRadius: 13,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#1d4ed8',
          opacity: disabled ? 0.5 : 1,
          shadowColor: '#1d4ed8',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
        }, style]}>
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[{
        height: 50, borderRadius: 13,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: secondaryBg,
        borderWidth: 1.5, borderColor: secondaryBorder,
        opacity: disabled ? 0.5 : 1,
      }, style]}>
      {content}
    </Pressable>
  );
}

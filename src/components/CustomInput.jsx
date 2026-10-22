import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAppTheme } from '~/theme/AppTheme';

export default function CustomInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  leftIcon,
  editable = true,
}) {
  const [isObscured, setIsObscured] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);
  const { isDark } = useAppTheme();

  const labelColor      = isDark ? '#64748b' : '#64748b';
  const inputBg         = isDark ? '#0d1526' : '#ffffff';
  const borderColor     = isFocused
    ? (isDark ? '#6366f1' : '#2563eb')
    : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0');
  const textColor       = isDark ? '#f1f5f9' : '#0f172a';
  const placeholderColor= isDark ? '#374151' : '#94a3b8';
  const iconSwatchBg    = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const iconSwatchBorder= isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9';
  const iconColor       = isFocused
    ? (isDark ? '#818cf8' : '#2563eb')
    : (isDark ? '#475569' : '#94a3b8');
  const eyeColor        = isDark ? '#4b5563' : '#94a3b8';

  return (
    <View style={{ marginBottom: 16 }}>
      {label ? (
        <Text style={{
          marginBottom: 7,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: labelColor,
        }}>
          {label}
        </Text>
      ) : null}

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 14,
        borderWidth: isFocused ? 2 : 1.5,
        borderColor,
        backgroundColor: inputBg,
        overflow: 'hidden',
      }}>
        {/* Left icon swatch */}
        {leftIcon && (
          <View style={{
            width: 48,
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: iconSwatchBg,
            borderRightWidth: 1,
            borderRightColor: iconSwatchBorder,
          }}>
            {React.cloneElement(leftIcon, { color: iconColor })}
          </View>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={isObscured}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            paddingLeft: leftIcon ? 14 : 16,
            paddingRight: secureTextEntry ? 0 : 14,
            fontSize: 14,
            fontWeight: '400',
            color: textColor,
            height: '100%',
          }}
        />

        {/* Eye toggle */}
        {secureTextEntry && (
          <Pressable
            style={{ width: 48, height: '100%', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setIsObscured(!isObscured)}>
            <FontAwesome name={isObscured ? 'eye-slash' : 'eye'} size={15} color={eyeColor} />
          </Pressable>
        )}
      </View>
    </View>
  );
}


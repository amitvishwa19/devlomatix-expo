import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function CustomButton({ onPress, title, icon, variant = 'primary', className = '', disabled = false }) {
    const baseClass = variant === 'primary'
        ? 'h-12 items-center justify-center flex-row rounded-lg bg-teal-700'
        : 'h-12 items-center justify-center flex-row rounded-lg border border-slate-300 bg-slate-50';

    const textClass = variant === 'primary'
        ? 'text-base font-bold text-slate-50'
        : 'text-base font-bold text-slate-900';

    return (
        <Pressable
            className={`${baseClass} ${disabled ? 'opacity-60' : ''} ${className}`}
            onPress={onPress}
            disabled={disabled}>
            {icon && <View className="mr-3">{icon}</View>}
            <Text className={textClass}>{title}</Text>
        </Pressable>
    );
}

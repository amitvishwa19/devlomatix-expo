import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function CustomButton({ onPress, title, icon, variant = 'primary', className = '', disabled = false }) {
    const baseClass = variant === 'primary'
        ? 'h-12 items-center justify-center flex-row rounded-xl bg-emerald-600 active:bg-emerald-700 shadow-md shadow-emerald-700/20'
        : 'h-12 items-center justify-center flex-row rounded-xl border border-slate-200 bg-white active:bg-slate-50';

    const textClass = variant === 'primary'
        ? 'text-[14px] font-extrabold text-white'
        : 'text-[14px] font-bold text-slate-700';

    return (
        <Pressable
            className={`${baseClass} ${disabled ? 'opacity-60' : ''} ${className}`}
            onPress={onPress}
            disabled={disabled}>
            {icon && <View className="mr-2.5">{icon}</View>}
            <Text className={textClass}>{title}</Text>
        </Pressable>
    );
}


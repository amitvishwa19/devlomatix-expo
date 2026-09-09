import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

export default function CustomInput({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) {
    const [isObscured, setIsObscured] = useState(secureTextEntry);

    return (
        <View className="mb-3.5">
            <Text className="mb-1.5 text-xs font-semibold ">{label}</Text>
            <View className="relative w-full justify-center">
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    secureTextEntry={isObscured}
                    className={`h-12 w-full rounded-xl border border-slate-200 bg-white pl-4 ${secureTextEntry ? 'pr-12' : 'pr-4'} text-[14px] text-slate-900 shadow-sm`} />

                {secureTextEntry && (
                    <Pressable
                        className="absolute right-0 h-full w-12 items-center justify-center opacity-70"
                        onPress={() => setIsObscured(!isObscured)}>
                        <FontAwesome name={isObscured ? 'eye-slash' : 'eye'} size={15} color="#64748b" />
                    </Pressable>
                )}
            </View>
        </View>
    );
}


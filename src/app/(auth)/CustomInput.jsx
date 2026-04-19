import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function CustomInput({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) {
    const [isObscured, setIsObscured] = useState(secureTextEntry);

    return (
        <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-slate-700">{label}</Text>
            <View className="relative w-full justify-center">
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    secureTextEntry={isObscured}
                    className={`h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-4 ${secureTextEntry ? 'pr-12' : 'pr-4'} text-[15px] text-slate-900`} />
                
                {secureTextEntry && (
                    <Pressable 
                        className="absolute right-0 h-full w-12 items-center justify-center opacity-70"
                        onPress={() => setIsObscured(!isObscured)}>
                        <FontAwesome name={isObscured ? "eye-slash" : "eye"} size={20} color="#64748b" />
                    </Pressable>
                )}
            </View>
        </View>
    );
}

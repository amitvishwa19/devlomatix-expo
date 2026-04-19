import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Custom designed toast layouts matching Devlomatix application theme
export const toastConfig = {
    // SUCCESS
    success: ({ text1, text2, props }) => (
        <View className="mx-4 mt-2 w-[90%] flex-row items-start rounded-2xl bg-teal-50 px-4 py-4 shadow-sm border border-teal-100">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                <FontAwesome name="check-circle" size={18} color="#0f766e" />
            </View>
            <View className="flex-1">
                <Text className="text-sm font-bold text-teal-900">{text1}</Text>
                {text2 && <Text className="mt-1 text-[13px] leading-5 text-teal-700">{text2}</Text>}
            </View>
        </View>
    ),

    // ERROR
    error: ({ text1, text2, props }) => (
        <View className="mx-4 mt-2 w-[90%] flex-row items-start rounded-2xl bg-rose-50 px-4 py-4 shadow-sm border border-rose-100">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-rose-100">
                <FontAwesome name="times-circle" size={18} color="#be123c" />
            </View>
            <View className="flex-1">
                <Text className="text-sm font-bold text-rose-900">{text1}</Text>
                {text2 && <Text className="mt-1 text-[13px] leading-5 text-rose-700">{text2}</Text>}
            </View>
        </View>
    ),

    // INFO
    info: ({ text1, text2, props }) => (
        <View className="mx-4 mt-2 w-[90%] flex-row items-start rounded-2xl bg-sky-50 px-4 py-4 shadow-sm border border-sky-100">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-sky-100">
                <FontAwesome name="info-circle" size={18} color="#0369a1" />
            </View>
            <View className="flex-1">
                <Text className="text-sm font-bold text-sky-900">{text1}</Text>
                {text2 && <Text className="mt-1 text-[13px] leading-5 text-sky-700">{text2}</Text>}
            </View>
        </View>
    )
};

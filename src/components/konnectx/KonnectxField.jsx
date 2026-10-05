import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '~/theme/AppTheme';

/**
 * Labeled text input used across the KonnectX forms.
 * `error` switches the border to the danger tone and shows a hint line.
 */
export default function KonnectxField({
    label,
    hint,
    error,
    icon,
    required = false,
    multiline = false,
    right,
    className = '',
    inputStyle,
    ...inputProps
}) {
    const { palette } = useAppTheme();

    return (
        <View className={className}>
            {label ? (
                <View className="mb-1 flex-row items-center gap-1">
                    <Text className={`text-[11px] font-bold uppercase tracking-[0.5px] ${palette.textMuted}`}>
                        {label}
                    </Text>
                    {required ? <Text className="text-[11px] font-bold text-red-500">*</Text> : null}
                </View>
            ) : null}

            <View
                className={`flex-row items-center gap-2 rounded-[14px] border px-3 ${
                    multiline ? 'py-2' : 'py-1'
                } ${palette.surface} ${palette.border}`}
                style={{
                    borderColor: error ? '#dc2626' : palette.colors.border,
                    minHeight: multiline ? 84 : 40
                }}>
                {icon ? <Ionicons name={icon} size={15} color={palette.textMutedColor} /> : null}

                <TextInput
                    className="flex-1 text-[13px]"
                    style={[
                        {
                            color: palette.textColor,
                            minHeight: multiline ? 68 : 36,
                            textAlignVertical: multiline ? 'top' : 'center'
                        },
                        inputStyle
                    ]}
                    placeholderTextColor={palette.textMutedColor}
                    multiline={multiline}
                    {...inputProps}
                />

                {right}
            </View>

            {error ? (
                <Text className="mt-1 text-[10px] font-semibold text-red-500">{error}</Text>
            ) : hint ? (
                <Text className={`mt-1 text-[10px] ${palette.textMuted}`}>{hint}</Text>
            ) : null}
        </View>
    );
}

/** Multi-select / single-select chip row for enum-style fields. */
export function KonnectxChips({ options, value, onChange, multi = false, className = '' }) {
    const { palette } = useAppTheme();

    const isSelected = (option) =>
        multi ? (Array.isArray(value) && value.includes(option.value)) : value === option.value;

    const handlePress = (option) => {
        if (!multi) return onChange(option.value);
        const list = Array.isArray(value) ? value : [];
        onChange(
            list.includes(option.value)
                ? list.filter((v) => v !== option.value)
                : [...list, option.value]
        );
    };

    return (
        <View className={`flex-row flex-wrap gap-1.5 ${className}`}>
            {options.map((option) => {
                const active = isSelected(option);
                return (
                    <TouchableOpacity
                        key={option.value}
                        onPress={() => handlePress(option)}
                        className="rounded-full border px-2.5 py-1"
                        style={{
                            backgroundColor: active ? 'rgba(2,132,199,0.12)' : palette.colors.surface,
                            borderColor: active ? '#0284c7' : palette.colors.border
                        }}>
                        <Text
                            className="text-[11px] font-bold"
                            style={{ color: active ? '#0284c7' : palette.textColor }}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

/** iOS-style switch row. */
export function KonnectxSwitchRow({ label, description, value, onValueChange, className = '' }) {
    const { palette } = useAppTheme();

    return (
        <TouchableOpacity
            onPress={() => onValueChange(!value)}
            className={`flex-row items-center gap-3 rounded-[14px] border p-3 ${palette.surface} ${palette.border} ${className}`}>
            <View className="flex-1">
                <Text className={`text-[13px] font-semibold ${palette.text}`}>{label}</Text>
                {description ? (
                    <Text className={`mt-0.5 text-[11px] ${palette.textSoft}`}>{description}</Text>
                ) : null}
            </View>
            <Ionicons
                name={value ? 'toggle' : 'toggle-outline'}
                size={30}
                color={value ? '#0284c7' : palette.textMutedColor}
            />
        </TouchableOpacity>
    );
}
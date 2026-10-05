import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '~/theme/AppTheme';

/**
 * Bottom action sheet used for per-message and per-row context menus.
 *
 * iOS renders actions inline from the bottom; Android gets the same layout so
 * the interaction is identical across platforms.
 */
export default function KonnectxActionSheet({
    visible,
    title,
    subtitle,
    actions = [],
    onClose,
    cancelLabel = 'Cancel'
}) {
    const { palette } = useAppTheme();
    const insets = useSafeAreaInsets();

    if (!visible) return null;

    const handleAction = (action) => {
        // Dismiss first so a slow handler doesn't leave the sheet open.
        onClose?.();
        if (action?.onPress) setTimeout(action.onPress, 180);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable
                onPress={onClose}
                className="flex-1 justify-end"
                style={{ backgroundColor: 'rgba(2,6,23,0.55)' }}>
                {/* Swallow presses so tapping the sheet does not dismiss it. */}
                <Pressable onPress={() => {}}>
                    <View
                        className="rounded-t-[22px] px-3 pt-3"
                        style={{
                            backgroundColor: palette.colors.surface,
                            paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 12
                        }}>
                        {title ? (
                            <View className="mb-2 items-center px-2">
                                <Text className={`text-[13px] font-bold ${palette.text}`} numberOfLines={1}>
                                    {title}
                                </Text>
                                {subtitle ? (
                                    <Text
                                        className={`mt-0.5 text-[11px] ${palette.textMuted}`}
                                        numberOfLines={1}>
                                        {subtitle}
                                    </Text>
                                ) : null}
                            </View>
                        ) : null}

                        <ScrollView bounces={false} className="max-h-[320px]">
                            <View className="gap-1.5">
                                {actions
                                    .filter((action) => action && !action.hidden)
                                    .map((action) => {
                                        const destructive = !!action.destructive;
                                        const tint = destructive ? '#dc2626' : palette.textColor;

                                        return (
                                            <Pressable
                                                key={action.key || action.label}
                                                onPress={() => handleAction(action)}
                                                android_ripple={{ color: palette.colors.border }}
                                                className="flex-row items-center gap-2.5 rounded-[14px] border px-3 py-2.5"
                                                style={{ backgroundColor: palette.colors.surfaceMuted, borderColor: palette.colors.border }}>
                                                {action.icon ? (
                                                    <Ionicons
                                                        name={action.icon}
                                                        size={16}
                                                        color={destructive ? '#dc2626' : palette.textMutedColor}
                                                    />
                                                ) : null}
                                                <Text className="flex-1 text-[13px] font-semibold" style={{ color: tint }}>
                                                    {action.label}
                                                </Text>
                                                {action.badge ? (
                                                    <Text className={`text-[11px] ${palette.textMuted}`}>
                                                        {action.badge}
                                                    </Text>
                                                ) : null}
                                            </Pressable>
                                        );
                                    })}
                            </View>
                        </ScrollView>

                        <Pressable
                            onPress={onClose}
                            className="mt-2 items-center rounded-[14px] border py-2.5"
                            style={{ borderColor: palette.colors.border }}>
                            <Text className={`text-[13px] font-bold ${palette.textSoft}`}>{cancelLabel}</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
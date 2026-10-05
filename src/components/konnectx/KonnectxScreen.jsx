import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '~/theme/AppTheme';

/**
 * Compact screen chrome shared by every KonnectX stack screen: safe area,
 * status bar, a back affordance and a title row with one optional action.
 *
 * `backTo` overrides the default "go back" so a screen can be entered both
 * from the dashboard and from a tab.
 */
export default function KonnectxScreen({
    title,
    subtitle,
    backTo,
    onBack,
    actionLabel,
    actionIcon = 'add',
    onAction,
    onRefresh,
    refreshing = false,
    children,
    scroll = true
}) {
    const router = useRouter();
    const { palette } = useAppTheme();

    const handleBack = () => {
        if (onBack) return onBack();
        if (backTo) return router.replace(backTo);
        if (router.canGoBack()) return router.back();
        return router.replace('/(modules)/konnectx/(tabs)');
    };

    const body = (
        <View className={`px-3 pb-24 ${scroll ? '' : 'flex-1'}`}>{children}</View>
    );

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: palette.colors.page }}>
            <StatusBar style={palette.statusBar} />
            <View
                className="flex-row items-center gap-2 border-b px-3 py-2"
                style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
                <TouchableOpacity
                    onPress={handleBack}
                    hitSlop={10}
                    className="h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: palette.colors.surfaceAlt }}>
                    <Ionicons name="chevron-back" size={17} color={palette.textColor} />
                </TouchableOpacity>

                <View className="flex-1">
                    <Text className={`text-[15px] font-bold ${palette.text}`} numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle ? (
                        <Text className={`text-[11px] ${palette.textSoft}`} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                {actionLabel ? (
                    <TouchableOpacity
                        onPress={onAction}
                        disabled={!onAction}
                        className="flex-row items-center gap-1 rounded-full bg-sky-600 px-2.5 py-1.5"
                        style={{ opacity: onAction ? 1 : 0.5 }}>
                        <Ionicons name={actionIcon} size={13} color="#fff" />
                        <Text className="text-[11px] font-bold text-white">{actionLabel}</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {scroll ? (
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        onRefresh ? (
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={palette.textColor}
                            />
                        ) : undefined
                    }>
                    {body}
                </ScrollView>
            ) : (
                <View className="flex-1">{body}</View>
            )}
        </SafeAreaView>
    );
}
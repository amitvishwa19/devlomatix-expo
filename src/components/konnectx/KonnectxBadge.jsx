import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '~/theme/AppTheme';

const TONES = {
    neutral: { fg: '#64748b', bg: 'rgba(100,116,139,0.12)' },
    success: { fg: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
    warning: { fg: '#d97706', bg: 'rgba(245,158,11,0.12)' },
    danger: { fg: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
    info: { fg: '#0284c7', bg: 'rgba(2,132,199,0.12)' },
    violet: { fg: '#7c3aed', bg: 'rgba(124,58,237,0.12)' }
};

/** Small pill used for every status label in the KonnectX screens. */
export default function KonnectxBadge({ label, tone = 'neutral', icon, className = '' }) {
    const { palette } = useAppTheme();
    const colors = TONES[tone] ?? TONES.neutral;

    return (
        <View
            className={`flex-row items-center gap-1 self-start rounded-full px-2 py-0.5 ${className}`}
            style={{ backgroundColor: colors.bg }}>
            {icon ? <Ionicons name={icon} size={10} color={colors.fg} /> : null}
            <Text className="text-[9px] font-extrabold uppercase tracking-[0.4px]" style={{ color: colors.fg }}>
                {label}
            </Text>
        </View>
    );
}

/** Maps a domain status string onto a tone, with a sensible default. */
export function statusTone(status) {
    switch (String(status || '').toUpperCase()) {
        case 'ACTIVE':
        case 'APPROVED':
        case 'COMPLETED':
        case 'CONNECTED':
        case 'SENT':
        case 'READ':
        case 'DELIVERED':
        case 'RUNNING':
            return 'success';
        case 'DRAFT':
        case 'PENDING':
        case 'PAUSED':
        case 'PROCESSING':
        case 'SCHEDULED':
        case 'IN STOCK':
            return 'warning';
        case 'FAILED':
        case 'ERROR':
        case 'REJECTED':
        case 'OUT OF STOCK':
            return 'danger';
        case 'INBOUND':
        case 'RECEIVED':
            return 'info';
        default:
            return 'neutral';
    }
}

/** Primary / secondary / destructive full-width action. */
export function KonnectxButton({
    label,
    onPress,
    variant = 'primary',
    icon,
    disabled = false,
    loading = false,
    className = ''
}) {
    const { palette } = useAppTheme();

    const bg =
        variant === 'primary'
            ? '#0284c7'
            : variant === 'danger'
                ? '#dc2626'
                : 'transparent';
    const fg = variant === 'secondary' ? palette.textColor : '#fff';

    return (
        <TouchableOpacity
            onPress={disabled || loading ? undefined : onPress}
            className={`flex-row items-center justify-center gap-1.5 rounded-[14px] border py-2.5 ${className}`}
            style={{
                backgroundColor: bg,
                borderColor: variant === 'secondary' ? palette.colors.border : bg,
                opacity: disabled || loading ? 0.6 : 1
            }}>
            {loading ? (
                <Ionicons name="sync" size={14} color={fg} />
            ) : icon ? (
                <Ionicons name={icon} size={14} color={fg} />
            ) : null}
            <Text className="text-[13px] font-bold" style={{ color: fg }}>
                {loading ? 'Working...' : label}
            </Text>
        </TouchableOpacity>
    );
}

/** Titled section wrapper so forms stay visually grouped. */
export function KonnectxSection({ title, action, children, className = '' }) {
    const { palette } = useAppTheme();

    return (
        <View className={`mb-3 ${className}`}>
            <View className="mb-1.5 flex-row items-center justify-between">
                <Text className={`text-[13px] font-bold ${palette.text}`}>{title}</Text>
                {action}
            </View>
            <View
                className={`gap-2 rounded-[16px] border p-3 ${palette.surface} ${palette.border}`}>
                {children}
            </View>
        </View>
    );
}
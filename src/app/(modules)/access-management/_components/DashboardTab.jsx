import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

const statMeta = [
  { label: 'Total Users', key: 'totalUsers', icon: 'people-outline', color: '#0284c7', bg: 'bg-sky-500/15' },
  { label: 'Total Roles', key: 'totalRoles', icon: 'shield-checkmark-outline', color: '#7c3aed', bg: 'bg-purple-500/15' },
  { label: 'Permissions', key: 'totalPermissions', icon: 'key-outline', color: '#16a34a', bg: 'bg-emerald-500/15' },
  { label: 'Active Perms', key: 'activePermissions', icon: 'pulse-outline', color: '#d97706', bg: 'bg-amber-500/15' },
];

export default function DashboardTab({ palette, stats = {}, roles = [] }) {
  return (
    <View>
      <View className="mb-4 flex-row flex-wrap gap-2.5">
        {statMeta.map((s) => (
          <View key={s.key} className={`w-[48%] rounded-[20px] p-4 ${s.bg}`}>
            <View
              className="mb-3 h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${s.color}20` }}
            >
              <Ionicons name={s.icon} size={18} color={s.color} />
            </View>
            <Text className={`text-[22px] font-bold ${palette.text}`}>
              {stats[s.key] ?? '—'}
            </Text>
            <Text className={`mt-0.5 text-[12px] ${palette.textSoft}`}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View className={`rounded-[24px] p-5 ${palette.surface}`}>
        <Text className={`mb-3.5 text-[17px] font-bold ${palette.text}`}>Recent Roles</Text>
        {roles.length === 0 ? (
          <Text className={`text-[13px] ${palette.textMuted}`}>No roles created yet.</Text>
        ) : (
          roles.slice(0, 3).map((role, idx) => (
            <View key={role.id} className="mb-3">
              <View className="flex-row items-center gap-3">
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: role.color || '#6b7280' }} />
                <View className="flex-1">
                  <Text className={`text-[15px] font-semibold ${palette.text}`}>{role.title}</Text>
                  <Text className={`text-[12px] ${palette.textMuted}`} numberOfLines={1}>{role.description}</Text>
                </View>
                <Text className={`text-[12px] ${palette.textMuted}`}>{role.permissionCount || 0} perm</Text>
              </View>
              {idx < Math.min(roles.length, 3) - 1 && (
                <View className={`mt-3 h-px ${palette.border}`} />
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

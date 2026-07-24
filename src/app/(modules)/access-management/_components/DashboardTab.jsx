import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

const statMeta = [
  { label: 'Total Users', key: 'totalUsers', icon: 'people-outline', color: '#0284c7', trend: '+12%' },
  { label: 'Total Roles', key: 'totalRoles', icon: 'shield-checkmark-outline', color: '#7c3aed', trend: '+3%' },
  { label: 'Permissions', key: 'totalPermissions', icon: 'key-outline', color: '#16a34a', trend: null },
  { label: 'Active Perms', key: 'activePermissions', icon: 'pulse-outline', color: '#d97706', trend: null },
];

export default function DashboardTab({ palette, stats = {}, roles = [], users = [], rolePermsMap = {} }) {
  const totalEnabled = Object.values(rolePermsMap).reduce((sum, perms) => sum + perms.length, 0);

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className={`text-[12px] font-bold uppercase tracking-[1.2px] ${palette.textMuted}`}>
          Overview
        </Text>
        <Text className={`text-text-xl ${palette.textMuted}`}>
          {stats.totalUsers || 0} users · {stats.totalRoles || 0} roles
        </Text>
      </View>

      <View className="mb-5 flex-row flex-wrap gap-3">
        {statMeta.map((s) => {
          const value = stats[s.key] ?? '—';
          return (
            <View
              key={s.key}
              className="w-[48%] rounded-2xl p-4"
              style={{ backgroundColor: `${s.color}10` }}
            >
              <View className="mb-3 flex-row items-center justify-between">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${s.color}20` }}
                >
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                {s.trend && (
                  <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                    <Text className="text-[9px] font-bold text-emerald-600">{s.trend}</Text>
                  </View>
                )}
              </View>
              <Text className="text-[26px] font-bold leading-[30px]" style={{ color: s.color }}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </Text>
              <Text className={`mt-0.5 text-[12px] ${palette.textMuted}`}>{s.label}</Text>
            </View>
          );
        })}
      </View>

      {users.length > 0 && (
        <View className="mb-5 rounded-2xl p-5" style={{ backgroundColor: palette.colors?.surface || palette.surface }}>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className={`text-[16px] font-bold ${palette.text}`}>Users</Text>
            <Text className={`text-text-xl ${palette.textMuted}`}>{stats.totalUsers || users.length} total</Text>
          </View>
          {users.slice(0, 4).map((user, idx) => (
            <View key={user.id}>
              <View className="flex-row items-center gap-3 py-2.5">
                <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${user.color || '#6b7280'}20` }}>
                  <Text className="text-xl font-bold capitalize" style={{ color: user.color || '#6b7280' }}>
                    {(user.name || '').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-[14px] font-bold ${palette.text}`}>{user.name}</Text>
                  <Text className={`text-text-xl ${palette.textMuted}`} numberOfLines={1}>{user.email}</Text>
                </View>
                <View className="flex-row flex-wrap gap-1">
                  {(user.roles || []).slice(0, 2).map((roleTitle) => {
                    const match = roles.find((r) => r.title === roleTitle || r.id === roleTitle);
                    return (
                      <View key={roleTitle} className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${match?.color || '#0d9488'}20` }}>
                        <Text className="text-[8px] font-bold" style={{ color: match?.color || '#0d9488' }}>{roleTitle}</Text>
                      </View>
                    );
                  })}
                  {(user.roles || []).length > 2 && (
                    <Text className={`text-[8px] ${palette.textMuted}`}>+{user.roles.length - 2}</Text>
                  )}
                </View>
              </View>
              {idx < Math.min(users.length, 4) - 1 && (
                <View className="h-px" style={{ backgroundColor: palette.colors?.border || palette.border }} />
              )}
            </View>
          ))}
        </View>
      )}

      <View className="mb-5 rounded-2xl p-5" style={{ backgroundColor: palette.colors?.surface || palette.surface }}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className={`text-[16px] font-bold ${palette.text}`}>Roles & Permissions</Text>
          <View className="rounded-full bg-teal-600/10 px-3 py-1">
            <Text className="text-[10px] font-bold text-teal-600">{totalEnabled} total enabled</Text>
          </View>
        </View>

        {roles.length === 0 ? (
          <View className="items-center py-6">
            <Ionicons name="shield-outline" size={28} color={palette.textMutedColor} />
            <Text className={`mt-2 text-[13px] ${palette.textMuted}`}>No roles created yet.</Text>
          </View>
        ) : (
          roles.slice(0, 4).map((role, idx) => {
            const perms = rolePermsMap[role.id] || [];
            return (
              <View key={role.id}>
                <View className="flex-row items-center justify-between gap-3 py-3">
                  <View className="flex-row flex-1 items-center gap-3">
                    <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${role.color || '#6b7280'}20` }}>
                      <Text className="text-text-xl font-bold capitalize" style={{ color: role.color || '#6b7280' }}>{role.title?.[0] || '?'}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className={`text-[14px] font-bold ${palette.text}`}>{role.title}</Text>
                        {role.userCount > 0 && (
                          <View className="rounded-full bg-purple-500/10 px-2 py-0.5">
                            <Text className="text-[9px] font-bold text-purple-600">{role.userCount} Users</Text>
                          </View>
                        )}
                      </View>
                      {perms.length > 0 && (
                        <View className="mt-1 flex-row flex-wrap gap-1">
                          {perms.slice(0, 4).map((p) => (
                            <View key={p.name} className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${p.color}20` }}>
                              <Text className="text-[8px] font-bold" style={{ color: p.color }}>{p.name}</Text>
                            </View>
                          ))}
                          {perms.length > 4 && (
                            <Text className={`text-[8px] ${palette.textMuted}`}>+{perms.length - 4} </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-[13px] font-bold" style={{ color: role.color || '#6b7280' }}>
                      {perms.length}
                    </Text>
                    <Text className={`text-[9px] ${palette.textMuted}`}>perms</Text>
                  </View>
                </View>
                {idx < Math.min(roles.length, 4) - 1 && (
                  <View className="h-px" style={{ backgroundColor: palette.colors?.border || palette.border }} />
                )}
              </View>
            );
          })
        )}
      </View>

      <View className="rounded-2xl p-5" style={{ backgroundColor: palette.colors?.surfaceAlt || `${palette.surface}` }}>
        <Text className={`mb-3 text-[14px] font-bold ${palette.text}`}>Quick Summary</Text>
        <View className="flex-row gap-4">
          <View className="flex-1 rounded-xl p-3.5" style={{ backgroundColor: palette.colors?.surface || palette.surface }}>
            <Text className={`text-text-xl ${palette.textMuted}`}>Avg. perms / role</Text>
            <Text className={`mt-1 text-[20px] font-bold ${palette.text}`}>
              {roles.length > 0 ? Math.round(totalEnabled / roles.length) : 0}
            </Text>
          </View>
          <View className="flex-1 rounded-xl p-3.5" style={{ backgroundColor: palette.colors?.surface || palette.surface }}>
            <Text className={`text-text-xl ${palette.textMuted}`}>Users per role</Text>
            <Text className={`mt-1 text-[20px] font-bold ${palette.text}`}>
              {roles.length > 0 ? Math.round((stats.totalUsers || 0) / roles.length) : 0}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

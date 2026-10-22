import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { usePermissions } from '~/hooks/usePermissions';

/**
 * Screen-level authorization wrapper.
 * If user lacks required role/permission, displays a compact iOS-style restriction card with back navigation.
 */
export function RoleProtectedScreen({
  requiredRole,
  requiredPermission,
  title = 'Access Restricted',
  message = 'You do not have the required permissions to view this screen. Please contact your organization administrator.',
  children,
}) {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { isSuperAdmin, hasRole, hasAnyRole, hasPermission, hasAnyPermission, roles, loading } = usePermissions();

  // Super Admin always allowed
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Still loading session
  if (loading) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${palette.page}`}>
        <Text className={`text-[13px] font-medium ${palette.textSoft}`}>Verifying permissions...</Text>
      </SafeAreaView>
    );
  }

  let isAllowed = true;

  // 1. Check required role
  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      isAllowed = hasAnyRole(requiredRole);
    } else {
      isAllowed = hasRole(requiredRole);
    }
  }

  // 2. Check required permission
  if (isAllowed && requiredPermission) {
    if (Array.isArray(requiredPermission)) {
      isAllowed = hasAnyPermission(requiredPermission);
    } else {
      isAllowed = hasPermission(requiredPermission);
    }
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  const roleDisplay = roles.length > 0 ? roles.join(', ') : 'Standard User';
  const requiredRolesDisplay = Array.isArray(requiredRole)
    ? requiredRole.join(' or ')
    : requiredRole || 'Elevated Access';

  return (
    <SafeAreaView className={`flex-1 items-center justify-center p-4 ${palette.page}`}>
      <View
        className={`w-full max-w-sm items-center rounded-[20px] border p-5 shadow-lg ${palette.surface} ${palette.border}`}
      >
        {/* Shield Icon in Tinted Circle */}
        <View className="mb-3.5 h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15">
          <Ionicons name="shield-outline" size={28} color="#f43f5e" />
        </View>

        <Text className={`text-center text-[18px] font-bold ${palette.text}`}>{title}</Text>

        <Text className={`mt-2 text-center text-[13px] leading-5 ${palette.textSoft}`}>
          {message}
        </Text>

        {/* Roles Breakdown Chip */}
        <View className={`my-3.5 w-full rounded-xl border p-2.5 ${palette.border} bg-black/5 dark:bg-white/5`}>
          <View className="flex-row items-center justify-between py-0.5">
            <Text className={`text-[11px] font-medium ${palette.textSoft}`}>Your Current Role:</Text>
            <Text className="text-[11px] font-bold text-amber-500">{roleDisplay}</Text>
          </View>
          <View className="mt-1 flex-row items-center justify-between py-0.5">
            <Text className={`text-[11px] font-medium ${palette.textSoft}`}>Required Access:</Text>
            <Text className="text-[11px] font-bold text-rose-500">{requiredRolesDisplay}</Text>
          </View>
        </View>

        {/* Back Navigation Button */}
        <Pressable
          onPress={() => router.back()}
          className="mt-1 flex-row items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 shadow-sm active:opacity-85"
        >
          <Ionicons name="arrow-back-outline" size={16} color="#ffffff" />
          <Text className="ml-1.5 text-[13px] font-semibold text-white">Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default RoleProtectedScreen;

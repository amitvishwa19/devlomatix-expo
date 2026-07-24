import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';
import { fetchAccessData, upsertUser, deleteUser, upsertRole, deleteRole, upsertPermissions } from '~/services/access-management';

import DashboardTab from './_components/DashboardTab';
import UsersTab from './_components/UsersTab';
import RolesTab from './_components/RolesTab';
import PermissionsTab from './_components/PermissionsTab';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
  { key: 'users', label: 'Users', icon: 'people-outline' },
  { key: 'roles', label: 'Roles', icon: 'shield-checkmark-outline' },
  { key: 'permissions', label: 'Permissions', icon: 'key-outline' },
];

const FALLBACK_DATA = {
  users: [
    { id: '1', name: 'Amit Verma', email: 'amit@devlomatix.com', roles: ['Super Admin'], status: 'active', color: '#0d9488' },
    { id: '2', name: 'Priya Sharma', email: 'priya@devlomatix.com', roles: ['Admin'], status: 'active', color: '#0284c7' },
    { id: '3', name: 'Rahul Kumar', email: 'rahul@devlomatix.com', roles: ['Manager', 'Editor'], status: 'active', color: '#7c3aed' },
  ],
  roles: [
    { id: '1', title: 'Super Admin', description: 'Full system access with all permissions.', color: '#0d9488', permissionCount: 48, userCount: 1, permissions: ['Dashboard', 'Users', 'Roles', 'Permissions', 'SolarBright', 'Curexa', 'KonnectX', 'CrystalAura'] },
    { id: '2', title: 'Admin', description: 'Administrative access to manage workspace.', color: '#0284c7', permissionCount: 36, userCount: 1, permissions: ['Dashboard', 'Users', 'Roles', 'Permissions', 'KonnectX', 'CrystalAura'] },
    { id: '3', title: 'Manager', description: 'Can manage content and moderate users.', color: '#7c3aed', permissionCount: 24, userCount: 2, permissions: ['Dashboard', 'Users', 'Curexa', 'KonnectX'] },
    { id: '4', title: 'Editor', description: 'Can create and edit content.', color: '#16a34a', permissionCount: 18, userCount: 2, permissions: ['Dashboard', 'Curexa', 'KonnectX'] },
    { id: '5', title: 'Viewer', description: 'Read-only access to approved modules.', color: '#d97706', permissionCount: 8, userCount: 1, permissions: ['Dashboard', 'SolarBright'] },
  ],
  permissions: [
    { id: 'perm-dashboard', module: 'Dashboard', category: 'dashboard', color: '#0d9488', actions: { view: true, create: false, edit: false, delete: false, manage: false } },
    { id: 'perm-users', module: 'Users', category: 'users', color: '#0284c7', actions: { view: true, create: true, edit: true, delete: true, manage: true } },
    { id: 'perm-roles', module: 'Roles', category: 'roles', color: '#7c3aed', actions: { view: true, create: true, edit: true, delete: true, manage: false } },
    { id: 'perm-permissions', module: 'Permissions', category: 'permissions', color: '#dc2626', actions: { view: true, create: true, edit: true, delete: true, manage: true } },
    { id: 'perm-solarbright', module: 'SolarBright', category: 'solarbright', color: '#d97706', actions: { view: true, create: false, edit: false, delete: false, manage: false } },
    { id: 'perm-curexa', module: 'Curexa', category: 'curexa', color: '#059669', actions: { view: true, create: true, edit: true, delete: false, manage: false } },
    { id: 'perm-konnectx', module: 'KonnectX', category: 'konnectx', color: '#0284c7', actions: { view: true, create: true, edit: true, delete: true, manage: true } },
    { id: 'perm-crystalaura', module: 'CrystalAura', category: 'crystalaura', color: '#9333ea', actions: { view: true, create: true, edit: true, delete: true, manage: false } },
  ],
  stats: { totalUsers: 3, totalRoles: 5, totalPermissions: 40, activePermissions: 32 },
};

const STATUS_OPTIONS = ['active', 'inactive', 'pending'];
const PRESET_COLORS = ['#0d9488', '#0284c7', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#6b7280'];

export default function AccessManagementScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userSearch, setUserSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [permSearch, setPermSearch] = useState('');

  const [data, setData] = useState(FALLBACK_DATA);
  const [rolePermsMap, setRolePermsMap] = useState(() => {
    const map = {};
    FALLBACK_DATA.roles.forEach((r) => {
      if (r.permissions && r.permissions.length > 0) {
        map[r.id] = r.permissions.map((name) => {
          const match = FALLBACK_DATA.permissions.find((p) => p.module === name || p.category === name);
          return { name, color: match?.color || '#6b7280' };
        });
      }
    });
    return map;
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);

  const loadData = useCallback(async (isInitial) => {
    try {
      setError(null);
      const res = await fetchAccessData();
      console.log('[ACCESS_MGMT] API response:', JSON.stringify(res));
      const body = res?.data || res;
      if (!body.users && !body.roles && !body.permissions) {
        throw new Error('Unexpected response format: ' + JSON.stringify(res).slice(0, 200));
      }
      setData({
        users: body.users || [],
        roles: body.roles || [],
        permissions: body.permissions || [],
        stats: body.stats || {},
      });
      const perms = body.permissions || [];
      const permMap = {};
      (body.roles || []).forEach((role) => {
        if (role.permissions && role.permissions.length > 0) {
          const items = role.permissions.map((p) => {
            const name = typeof p === 'object' ? (p.module || p.title || p.name) : null;
            const color = typeof p === 'object' ? (p.color || '#6b7280') : null;
            if (name) return { name, color: color || '#6b7280' };
            const match = perms.find((ap) => ap.id === p || ap.category === p || ap._id === p);
            if (match) return { name: match.module || match.title || match.name, color: match.color || '#6b7280' };
            const modMatch = perms.find((ap) => (ap.module || ap.title || ap.name) === p);
            return modMatch ? { name: p, color: modMatch.color || '#6b7280' } : null;
          }).filter(Boolean);
          const unique = items.filter((item, idx, self) => idx === self.findIndex((s) => s.name === item.name));
          if (unique.length > 0) permMap[role.id] = unique;
        }
      });
      setRolePermsMap((prev) => ({ ...prev, ...permMap }));
      setOffline(false);
    } catch (e) {
      console.log('[ACCESS_MGMT] Error:', e.message);
      setError(e.message || 'Failed to load');
      if (isInitial) {
        setData(FALLBACK_DATA);
        setOffline(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(true); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setOffline(false);
    loadData();
  }, []);

  const handleUpsertUser = async (payload) => {
    const newUser = {
      id: payload.id || Date.now().toString(),
      name: payload.name,
      email: payload.email,
      roles: payload.roles,
      status: payload.status,
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
    };

    setData((prev) => ({
      ...prev,
      users: payload.id
        ? prev.users.map((u) => (u.id === payload.id ? { ...u, ...newUser } : u))
        : [...prev.users, newUser],
      stats: { ...prev.stats, totalUsers: payload.id ? prev.stats.totalUsers : prev.stats.totalUsers + 1 },
    }));

    if (offline) return;

    try {
      const roleIds = (payload.roles || [])
        .map((title) => { const match = (data.roles || []).find((r) => r.title === title); return match ? match.id : null; })
        .filter(Boolean);
      await upsertUser({ id: payload.id, name: payload.name, email: payload.email, roles: roleIds, status: payload.status });
      await loadData();
    } catch (e) {
      console.warn('[ACCESS_MGMT] User save succeeded locally but API failed:', e.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    setData((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
      stats: { ...prev.stats, totalUsers: prev.stats.totalUsers - 1 },
    }));

    if (offline) return;

    try {
      await deleteUser(userId);
      await loadData();
    } catch (e) {
      console.warn('[ACCESS_MGMT] User delete succeeded locally but API failed:', e.message);
    }
  };

  const handleUpsertRole = async (payload) => {
    const { permissionCount: _, selectedPerms, ...roleFields } = payload;
    const newPermCount = (selectedPerms || []).length;
    const permMap = {};
    const permNames = (selectedPerms || []).map((cat) => {
      const match = (data.permissions || []).find((p) => p.category === cat);
      const name = match ? (match.module || match.title || match.name) : cat;
      permMap[name] = match?.color || '#6b7280';
      return name;
    }).filter(Boolean);
    const uniquePerms = [...new Set(permNames)];

    const newRole = {
      ...roleFields,
      permissionCount: newPermCount,
      userCount: 0,
    };

    const roleId = payload.id || Date.now().toString();
    setRolePermsMap((prev) => ({
      ...prev,
      [roleId]: uniquePerms.map((name) => ({ name, color: permMap[name] || '#6b7280' })),
    }));

    setData((prev) => ({
      ...prev,
      roles: payload.id
        ? prev.roles.map((r) => (r.id === roleId ? { ...r, ...newRole } : r))
        : [...prev.roles, { id: roleId, ...newRole }],
      stats: { ...prev.stats, totalRoles: payload.id ? prev.stats.totalRoles : prev.stats.totalRoles + 1 },
    }));

    if (offline) return;

    try {
      let permissionIds = [];
      if (selectedPerms && selectedPerms.length > 0) {
        const permsToCreate = selectedPerms
          .map((cat) => (data.permissions || []).find((p) => p.category === cat))
          .filter(Boolean)
          .map((p) => ({ category: p.category, module: p.module, color: p.color, actions: p.actions }));
        if (permsToCreate.length > 0) {
          const permResult = await upsertPermissions(permsToCreate);
          permissionIds = (permResult?.permissions || []).map((p) => p.id);
        }
      }
      await upsertRole({ ...roleFields, permissions: permissionIds });
      await loadData();
    } catch (e) {
      console.warn('[ACCESS_MGMT] Role save succeeded locally but API failed:', e.message);
    }
  };

  const handleDeleteRole = async (roleId) => {
    setData((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r.id !== roleId),
      stats: { ...prev.stats, totalRoles: prev.stats.totalRoles - 1 },
    }));

    if (offline) return;

    try {
      await deleteRole(roleId);
      await loadData();
    } catch (e) {
      console.warn('[ACCESS_MGMT] Role delete succeeded locally but API failed:', e.message);
    }
  };

  const filteredUsers = (data.users || []).filter(
    (u) => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredRoles = (data.roles || []).filter(
    (r) => r.title?.toLowerCase().includes(roleSearch.toLowerCase()) || r.description?.toLowerCase().includes(roleSearch.toLowerCase())
  );
  const filteredPerms = (data.permissions || []).filter(
    (p) => p.module?.toLowerCase().includes(permSearch.toLowerCase())
  );

  const statusBadge = (status) => {
    const map = {
      active: { bg: 'bg-emerald-500/15', text: 'text-emerald-600', label: 'Active' },
      inactive: { bg: 'bg-slate-500/15', text: 'text-slate-500', label: 'Inactive' },
      pending: { bg: 'bg-amber-500/15', text: 'text-amber-600', label: 'Pending' },
    };
    const s = map[status] || map.inactive;
    return (
      <View className={`rounded-full px-2.5 py-0.5 ${s.bg}`}>
        <Text className={`text-[10px] font-bold ${s.text}`}>{s.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        <View className="px-5 pb-2 pt-5">
          <Pressable className="mb-3 flex-row items-center gap-2" onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={palette.textColor} />
            <Text className={`text-[14px] font-semibold ${palette.text}`}>Settings</Text>
          </Pressable>

          {offline && (
            <View className="mb-3 flex-row items-center gap-2 rounded-2xl bg-amber-500/15 px-4 py-3">
              <Ionicons name="cloud-offline-outline" size={16} color="#d97706" />
              <Text className="flex-1 text-[12px] font-medium text-amber-600">
                Offline — showing sample data
              </Text>
              <Pressable onPress={() => { setLoading(true); setOffline(false); loadData(); }}>
                <Text className="text-[12px] font-bold text-teal-600">Retry</Text>
              </Pressable>
            </View>
          )}

          <View className={`mb-4 rounded-[28px] p-5 shadow-xl ${palette.surface} ${palette.shadow}`}>
            <Text className={`text-[12px] font-bold uppercase tracking-[1.8px] ${palette.accentText}`}>
              ACCESS CONTROL
            </Text>
            <Text className={`mt-2.5 text-[28px] font-bold leading-[34px] ${palette.text}`}>
              Access Management
            </Text>
            <Text className={`mt-2 text-[14px] leading-5 ${palette.textSoft}`}>
              Manage users, roles, and permissions across your workspace.
            </Text>
          </View>

          <View className={`mb-4 flex-row rounded-2xl p-1 ${palette.surface}`}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${isActive ? 'bg-teal-700' : ''}`}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Ionicons name={tab.icon} size={14} color={isActive ? '#ffffff' : palette.textMutedColor} />
                  <Text className={`text-[12px] font-bold ${isActive ? 'text-white' : palette.textMuted}`}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView
          className={`flex-1 ${palette.page}`}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textMutedColor} />}
        >
          <View className="px-5 pb-28">
            {activeTab === 'dashboard' && (
              <DashboardTab palette={palette} stats={data.stats} roles={data.roles} users={data.users} rolePermsMap={rolePermsMap} />
            )}
            {activeTab === 'users' && (
              <UsersTab
                palette={palette}
                search={userSearch}
                setSearch={setUserSearch}
                users={filteredUsers}
                statusBadge={statusBadge}
                allRoles={data.roles}
                onSave={handleUpsertUser}
                onDelete={handleDeleteUser}
                offline={offline}
              />
            )}
            {activeTab === 'roles' && (
              <RolesTab
                palette={palette}
                search={roleSearch}
                setSearch={setRoleSearch}
                roles={filteredRoles}
                allPermissions={data.permissions}
                rolePermsMap={rolePermsMap}
                onSave={handleUpsertRole}
                onDelete={handleDeleteRole}
                offline={offline}
              />
            )}
            {activeTab === 'permissions' && (
              <PermissionsTab palette={palette} search={permSearch} setSearch={setPermSearch} permissions={filteredPerms} offline={offline} onRefresh={loadData} />
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

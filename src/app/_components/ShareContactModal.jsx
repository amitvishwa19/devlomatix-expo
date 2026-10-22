import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrmTheme } from '~/utils/crm/colors';
import { fetchAccessData } from '~/services/access-management';
import { getSession } from '~/utils/authStorage';
import * as crmService from '~/services/crm';

const AVAILABLE_MODULES = [
  { id: 'crm', name: 'CRM (DevX)', icon: 'rocket-outline', desc: 'Visible in CRM pipeline, deals & activities' },
  { id: 'ats', name: 'HireFlow (ATS)', icon: 'briefcase-outline', desc: 'Visible as candidate contact in hiring workflows' },
  { id: 'konnectx', name: 'KonnectX (WhatsApp)', icon: 'logo-whatsapp', desc: 'Synced with WhatsApp messaging & broadcast lists' },
];

export default function ShareContactModal({ contact, visible, onClose, onUpdated }) {
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();

  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedModules, setSelectedModules] = useState(['crm']);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (contact && visible) {
      // Parse existing moduleAccess & relational shares
      const ma = contact.moduleAccess || {};
      const mods = Array.isArray(ma.modules) && ma.modules.length > 0 ? ma.modules : ['crm'];
      const maShared = Array.isArray(ma.sharedWith) ? ma.sharedWith : [];
      const relShared = Array.isArray(contact.sharedWith)
        ? contact.sharedWith.map((s) => s.sharedWithUserId || s.sharedWith?.id || s.id).filter(Boolean)
        : [];
      const initialShared = Array.from(new Set([...maShared, ...relShared]));

      setSelectedModules(mods);
      setSharedUsers(initialShared);
      setStatusMsg(null);

      // Load workspace team members using dedicated CRM Team endpoint
      async function loadTeam() {
        try {
          setLoading(true);
          let loadedTeam = [];
          const teamRes = await crmService.getTeam();
          if (teamRes?.success && Array.isArray(teamRes.data) && teamRes.data.length > 0) {
            loadedTeam = teamRes.data;
          } else {
            const accessRes = await fetchAccessData();
            const rawUsers = accessRes?.users || accessRes?.data?.users || accessRes?.data || [];
            if (Array.isArray(rawUsers)) {
              loadedTeam = rawUsers.map((u) => ({
                id: u.id,
                name: u.displayName || u.name || (u.email ? u.email.split('@')[0] : 'Member'),
                email: u.email || '',
                role: u.roles?.[0] || u.role || 'Team Member',
              }));
            }
          }

          // Exclude the current logged-in user so they don't share with themselves
          const session = await getSession();
          const myId = session?.user?.id || session?.user?.userId || session?.user?._id;
          const myEmail = session?.user?.email;

          const filtered = loadedTeam.filter((m) => {
            if (m.isCurrent) return false;
            if (myId && m.id === myId) return false;
            if (myEmail && m.email && m.email.toLowerCase() === myEmail.toLowerCase()) return false;
            return true;
          });

          setTeamMembers(filtered);
        } catch (e) {
          console.warn('Could not load team data:', e?.message);
        } finally {
          setLoading(false);
        }
      }
      loadTeam();
    }
  }, [contact, visible]);

  if (!visible || !contact) return null;

  const toggleModule = (modId) => {
    setSelectedModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  const toggleUser = (userId) => {
    setSharedUsers((prev) =>
      prev.includes(userId) ? prev.filter((u) => u !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMsg(null);

      const moduleAccess = {
        modules: selectedModules.length > 0 ? selectedModules : ['crm'],
        sharedWith: sharedUsers,
      };

      await crmService.updateContact(contact.id, {
        moduleAccess,
        sharedWith: sharedUsers,
      });

      setStatusMsg({ type: 'success', text: 'Contact sharing and module permissions updated!' });
      if (onUpdated) onUpdated();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to update contact permissions' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable className="flex-1" onPress={onClose} />

        <View
          className="rounded-t-3xl p-4 shadow-2xl border-t max-h-[85%]"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom + 15, 30),
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
            <View className="flex-row items-center gap-x-2.5">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.primarySoft }}
              >
                <Ionicons name="share-social" size={16} color={colors.primary} />
              </View>
              <View>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>
                  Multi-Module Visibility & Team Sharing
                </Text>
                <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                  {contact.name}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              className="h-7 w-7 items-center justify-center rounded-full border"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Ionicons name="close" size={15} color={colors.textMuted} />
            </Pressable>
          </View>

          {statusMsg && (
            <View
              className="mt-3 rounded-xl p-2.5 border"
              style={{
                backgroundColor: statusMsg.type === 'success' ? colors.successSoft : colors.dangerSoft,
                borderColor: statusMsg.type === 'success' ? colors.successBorder : colors.dangerBorder,
              }}
            >
              <Text
                className="text-[11px] font-bold text-center"
                style={{ color: statusMsg.type === 'success' ? colors.success : colors.danger }}
              >
                {statusMsg.text}
              </Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
            {/* Section 1: Active Modules */}
            <Text className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>
              Cross-Module Visibility
            </Text>
            <View className="space-y-1.5 mb-4">
              {AVAILABLE_MODULES.map((mod) => {
                const isActive = selectedModules.includes(mod.id);
                return (
                  <Pressable
                    key={mod.id}
                    onPress={() => toggleModule(mod.id)}
                    className="flex-row items-center justify-between p-2.5 rounded-xl border mb-1.5 active:opacity-75"
                    style={{
                      backgroundColor: isActive ? colors.primarySoft : colors.cardAlt,
                      borderColor: isActive ? colors.primaryBorder : colors.border,
                    }}
                  >
                    <View className="flex-row items-center gap-x-2.5 flex-1 pr-2">
                      <Ionicons
                        name={mod.icon}
                        size={16}
                        color={isActive ? colors.primary : colors.textMuted}
                      />
                      <View>
                        <Text
                          className="text-xs font-bold"
                          style={{ color: isActive ? colors.primaryDark : colors.text }}
                        >
                          {mod.name}
                        </Text>
                        <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                          {mod.desc}
                        </Text>
                      </View>
                    </View>

                    <View
                      className="h-5 w-5 rounded-md items-center justify-center border"
                      style={{
                        backgroundColor: isActive ? colors.primary : colors.inputBg,
                        borderColor: isActive ? colors.primary : colors.border,
                      }}
                    >
                      {isActive && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Section 2: Team Member Sharing */}
            <Text className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.textMuted }}>
              Team Member Access Delegation
            </Text>

            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} className="my-4" />
            ) : teamMembers.length === 0 ? (
              <Text className="text-xs text-slate-400 italic mb-3">No other team members in workspace</Text>
            ) : (
              <View className="space-y-1.5 mb-4">
                {teamMembers.map((user) => {
                  const uid = user.id || user._id;
                  const isShared = sharedUsers.includes(uid);
                  const name = user.displayName || user.name || user.email || 'Member';

                  return (
                    <Pressable
                      key={uid}
                      onPress={() => toggleUser(uid)}
                      className="flex-row items-center justify-between p-2.5 rounded-xl border mb-1 active:opacity-75"
                      style={{
                        backgroundColor: isShared ? colors.successSoft : colors.cardAlt,
                        borderColor: isShared ? colors.successBorder : colors.border,
                      }}
                    >
                      <View className="flex-row items-center gap-x-2 flex-1">
                        <View
                          className="h-7 w-7 rounded-full items-center justify-center border"
                          style={{
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          }}
                        >
                          <Text className="text-[11px] font-bold" style={{ color: colors.text }}>
                            {name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-xs font-bold" style={{ color: colors.text }}>
                            {name}
                          </Text>
                          <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                            {user.email || 'Workspace Member'}
                          </Text>
                        </View>
                      </View>

                      <View
                        className="h-5 w-5 rounded-md items-center justify-center border"
                        style={{
                          backgroundColor: isShared ? colors.success : colors.inputBg,
                          borderColor: isShared ? colors.success : colors.border,
                        }}
                      >
                        {isShared && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View className="mt-3 flex-row items-center gap-x-2">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center justify-center rounded-xl py-3 border active:opacity-75"
              style={{ backgroundColor: colors.cardAlt, borderColor: colors.border }}
            >
              <Text className="text-xs font-bold" style={{ color: colors.text }}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="flex-2 flex-row items-center justify-center gap-x-1.5 rounded-xl py-3 active:opacity-85 shadow-md"
              style={{ backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Save Permissions</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

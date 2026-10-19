import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import AppScreen from '~/components/AppScreen';
import { useCrmSocket } from '~/providers/CrmSocketProvider';
import { getSession } from '~/utils/authStorage';
import * as crmService from '~/services/crm';
import { fetchAccessData } from '~/services/access-management';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';
import CrmHeader from '../_components/CrmHeader';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';

export default function CrmChatDirectoryScreen() {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const { onlineUsers, startCall, isConnected } = useCrmSocket();
  const { openQuickWhatsApp } = useCrm();
  const [currentUser, setCurrentUser] = useState(null);

  const currentUserId = currentUser?.id || currentUser?.userId || currentUser?._id;

  const [activeTab, setActiveTab] = useState('team'); // 'team' | 'contacts' | 'whatsapp'
  const [search, setSearch] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      let resolvedUserId = currentUserId;
      if (!resolvedUserId) {
        const session = await getSession();
        if (session?.user) {
          setCurrentUser(session.user);
          resolvedUserId = session.user.id || session.user.userId || session.user._id;
        }
      }

      // Load CRM Contacts
      const contactsRes = await crmService.getContacts();
      if (contactsRes?.data) {
        setContacts(contactsRes.data);
      }

      // Load Team Members (Dedicated CRM Team API with Access Management fallback)
      try {
        let loadedTeam = [];
        const teamRes = await crmService.getTeam();
        if (teamRes?.success && Array.isArray(teamRes.data) && teamRes.data.length > 0) {
          loadedTeam = teamRes.data;
        } else {
          const accessRes = await fetchAccessData();
          const rawUsers = accessRes?.users || accessRes?.data?.users || accessRes?.data || [];
          if (Array.isArray(rawUsers)) {
            loadedTeam = rawUsers.map((u) => {
              const roleTitle =
                (Array.isArray(u.roles) && u.roles.length > 0
                  ? u.roles.map((r) => r.title || r.name || (typeof r === 'string' ? r : '')).filter(Boolean).join(', ')
                  : null) ||
                (u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1).toLowerCase() : null) ||
                (u.userRole || null) ||
                (u.roleTitle || null) ||
                'Sales Member';

              const name =
                u.displayName ||
                u.name ||
                u.username ||
                (u.email ? u.email.split('@')[0] : 'Member');

              return {
                id: u.id || u._id,
                name,
                email: u.email || '',
                phone: u.phone || '',
                avatar: u.avatar || null,
                role: roleTitle,
              };
            });
          }
        }

        // Filter out current logged in user so the 8 sales teammates are shown
        const teamTeammates = loadedTeam.filter((u) => {
          const isSelf = (resolvedUserId && String(u.id) === String(resolvedUserId)) || u.isCurrent;
          return !isSelf;
        });

        setTeamMembers(teamTeammates);
      } catch (e) {
        console.warn('Could not load team data:', e?.message);
      }
    } catch (err) {
      console.warn('Error loading chat directory:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // WhatsApp contacts with phone or synced
  const waContacts = contacts.filter((c) => c.phone || c.moduleAccess?.modules?.includes('konnectx'));

  // Filtered directory items
  const currentItems =
    activeTab === 'team' ? teamMembers : activeTab === 'contacts' ? contacts : waContacts;

  const filteredItems = currentItems.filter((item) => {
    const q = search.toLowerCase();
    const nameMatch = (item.name || '').toLowerCase().includes(q);
    const emailMatch = (item.email || '').toLowerCase().includes(q);
    const phoneMatch = (item.phone || '').toLowerCase().includes(q);
    return nameMatch || emailMatch || phoneMatch;
  });

  const isUserOnline = (id) => {
    return onlineUsers.some((u) => u.userId === id);
  };

  const openConversation = (item) => {
    if (activeTab === 'whatsapp') {
      openQuickWhatsApp(item);
      return;
    }
    router.push({
      pathname: '/(modules)/crm/chat/[chatId]',
      params: {
        chatId: item.id,
        name: item.name || 'User',
        avatar: item.avatar || '',
        phone: item.phone || '',
        email: item.email || '',
        role: item.role || item.jobTitle || '',
        type: activeTab,
      },
    });
  };

  const handleStartCall = (item, callType = 'audio') => {
    startCall({
      calleeId: item.id,
      calleeName: item.name || 'Sales Contact',
      calleeAvatar: item.avatar,
      callType,
      contactOrDealInfo: { contactId: item.id },
    });
  };

  const renderItem = ({ item }) => {
    const online = isUserOnline(item.id);
    const initial = (item.name || 'U').charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openConversation(item)}
        className="flex-row items-center justify-between p-3 mb-2 rounded-[16px] border shadow-sm"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        {/* Left: Avatar with Online indicator */}
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          <View className="relative">
            <View
              className="w-9 h-9 rounded-xl border items-center justify-center overflow-hidden"
              style={{
                backgroundColor: colors.primarySoft,
                borderColor: colors.primaryBorder,
              }}
            >
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-[13px] font-black" style={{ color: colors.primary }}>
                  {initial}
                </Text>
              )}
            </View>

            {/* Online Indicator Dot */}
            {online && (
              <View
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{
                  backgroundColor: colors.success,
                  borderColor: colors.card,
                }}
              />
            )}
          </View>

          {/* User Details */}
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text
                className="text-[13px] font-black tracking-tight"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {online && (
                <Text className="text-[9px] font-bold" style={{ color: colors.success }}>
                  Online
                </Text>
              )}
            </View>

            {activeTab === 'team' ? (
              <View className="flex-row items-center gap-1.5 mt-0.5">
                {item.role ? (
                  <View
                    className="px-1.5 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: colors.primarySoft,
                      borderColor: colors.primaryBorder,
                    }}
                  >
                    <Text className="text-[9px] font-bold" style={{ color: colors.primary }}>
                      {item.role}
                    </Text>
                  </View>
                ) : null}
                {item.email ? (
                  <Text
                    className="text-[11px] truncate flex-1"
                    style={{ color: colors.textMuted }}
                    numberOfLines={1}
                  >
                    {item.email}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text
                className="text-[11px] mt-0.5"
                style={{ color: colors.textMuted }}
                numberOfLines={1}
              >
                {item.jobTitle || item.account?.name || item.phone || 'CRM Contact'}
              </Text>
            )}
          </View>
        </View>

        {/* Right: Quick Call & Chat Action Buttons */}
        <View className="flex-row items-center gap-1.5">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleStartCall(item, 'audio')}
            className="w-8 h-8 rounded-xl border items-center justify-center"
            style={{
              backgroundColor: colors.callSoft,
              borderColor: colors.callBorder,
            }}
          >
            <Ionicons name="call" size={13} color={colors.call} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleStartCall(item, 'video')}
            className="w-8 h-8 rounded-xl border items-center justify-center"
            style={{
              backgroundColor: colors.successSoft,
              borderColor: colors.successBorder,
            }}
          >
            <Ionicons name="videocam" size={13} color={colors.success} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => openConversation(item)}
            className="w-8 h-8 rounded-xl border items-center justify-center"
            style={{
              backgroundColor: colors.cardAlt,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={13} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AppScreen>
      <CrmHeader
        title="CRM Chat & Calls"
        subtitle={isConnected ? 'Real-Time Connected' : 'Connecting to Server...'}
        showBack={true}
      />

      <View className="px-3 flex-1 pt-1">
        {/* Segmented Tab Bar */}
        <View
          className="flex-row p-1 rounded-xl border mb-2.5"
          style={{
            backgroundColor: colors.cardAlt,
            borderColor: colors.border,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('team')}
            className="flex-1 py-1.5 rounded-lg items-center justify-center"
            style={{
              backgroundColor: activeTab === 'team' ? colors.primary : 'transparent',
            }}
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name="people"
                size={13}
                color={activeTab === 'team' ? '#ffffff' : colors.textMuted}
              />
              <Text
                className="text-[11px] font-bold"
                style={{
                  color: activeTab === 'team' ? '#ffffff' : colors.textMuted,
                }}
              >
                Sales Team ({teamMembers.length})
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('contacts')}
            className="flex-1 py-1.5 rounded-lg items-center justify-center"
            style={{
              backgroundColor: activeTab === 'contacts' ? colors.primary : 'transparent',
            }}
          >
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="person-circle"
                size={13}
                color={activeTab === 'contacts' ? '#ffffff' : colors.textMuted}
              />
              <Text
                className="text-[10px] font-bold"
                style={{
                  color: activeTab === 'contacts' ? '#ffffff' : colors.textMuted,
                }}
              >
                Contacts ({contacts.length})
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('whatsapp')}
            className="flex-1 py-1.5 rounded-lg items-center justify-center"
            style={{
              backgroundColor: activeTab === 'whatsapp' ? colors.whatsapp : 'transparent',
            }}
          >
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="logo-whatsapp"
                size={12}
                color={activeTab === 'whatsapp' ? '#ffffff' : colors.textMuted}
              />
              <Text
                className="text-[10px] font-bold"
                style={{
                  color: activeTab === 'whatsapp' ? '#ffffff' : colors.textMuted,
                }}
              >
                WhatsApp ({waContacts.length})
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <QuickWhatsAppModal />

        {/* Search Filter Bar */}
        <View
          className="flex-row items-center px-3.5 py-2.5 rounded-xl border mb-2.5 min-h-[46px]"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          }}
        >
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${activeTab === 'team' ? 'team members' : 'contacts'}...`}
            placeholderTextColor={colors.inputPlaceholder}
            className="flex-1 ml-2 text-xs py-1"
            style={{ color: colors.text }}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Directory List */}
        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-xs mt-2" style={{ color: colors.textMuted }}>
              Loading Directory...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Ionicons name="chatbubbles-outline" size={36} color={colors.textSoft} />
                <Text className="text-[13px] font-bold mt-2" style={{ color: colors.text }}>
                  No {activeTab === 'team' ? 'team members' : 'contacts'} found
                </Text>
                <Text className="text-xs mt-0.5 text-center px-6" style={{ color: colors.textMuted }}>
                  {search ? 'Try adjusting your search filter' : 'Contacts and teammates will appear here.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </AppScreen>
  );
}


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
import { useAppTheme } from '~/theme/AppTheme';
import { useCrmSocket } from '~/providers/CrmSocketProvider';
import { getSession } from '~/utils/authStorage';
import * as crmService from '~/services/crm';
import { fetchAccessData } from '~/services/access-management';
import CrmHeader from '../_components/CrmHeader';

export default function CrmChatDirectoryScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { onlineUsers, startCall, isConnected } = useCrmSocket();
  const [currentUser, setCurrentUser] = useState(null);

  const currentUserId = currentUser?.id || currentUser?.userId || currentUser?._id;

  const [activeTab, setActiveTab] = useState('team'); // 'team' | 'contacts'
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

      // Load Team Members via Access Management
      try {
        const accessRes = await fetchAccessData();
        const rawUsers = accessRes?.users || accessRes?.data?.users || accessRes?.data || [];
        if (Array.isArray(rawUsers)) {
          const formatted = rawUsers
            .filter((u) => (u.id || u._id) !== currentUserId)
            .map((u) => {
              const roleTitle =
                (Array.isArray(u.roles) && u.roles.length > 0
                  ? u.roles.map((r) => r.title || r.name || (typeof r === 'string' ? r : '')).filter(Boolean).join(', ')
                  : null) ||
                (u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1).toLowerCase() : null) ||
                (u.userRole || null) ||
                (u.roleTitle || null);

              const name =
                u.displayName ||
                u.name ||
                u.username ||
                (u.email ? u.email.split('@')[0] : 'Member');

              return {
                id: u.id || u._id,
                name,
                email: u.email || '',
                avatar: u.avatar || null,
                role: roleTitle,
              };
            });
          setTeamMembers(formatted);
        }
      } catch (e) {
        console.warn('Could not load access team data:', e?.message);
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

  // Filtered directory items
  const currentItems = activeTab === 'team' ? teamMembers : contacts;
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
        className={`flex-row items-center justify-between p-3 mb-2 rounded-2xl border ${palette.border} ${palette.surface} shadow-sm`}
      >
        {/* Left: Avatar with Online indicator */}
        <View className="flex-row items-center gap-3 flex-1 mr-2">
          <View className="relative">
            <View className="w-10 h-10 rounded-full bg-indigo-500/15 border border-indigo-500/30 items-center justify-center overflow-hidden">
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-[14px] font-extrabold text-indigo-400">{initial}</Text>
              )}
            </View>

            {/* Online Green Indicator Dot */}
            {online && (
              <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
            )}
          </View>

          {/* User Details */}
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className={`text-[13px] font-extrabold ${palette.text} truncate`}>
                {item.name}
              </Text>
              {online && (
                <Text className="text-[10px] font-bold text-emerald-400">Online</Text>
              )}
            </View>

            {activeTab === 'team' ? (
              <View className="flex-row items-center gap-1.5 mt-0.5">
                {item.role ? (
                  <View className="px-1.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30">
                    <Text className="text-[10px] font-bold text-indigo-400">
                      {item.role}
                    </Text>
                  </View>
                ) : null}
                {item.email ? (
                  <Text className={`text-[11px] ${palette.textMuted} truncate flex-1`}>
                    {item.email}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text className={`text-[11px] ${palette.textMuted} truncate mt-0.5`}>
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
            className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 items-center justify-center"
          >
            <Ionicons name="call" size={14} color="#6366f1" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleStartCall(item, 'video')}
            className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center"
          >
            <Ionicons name="videocam" size={14} color="#10b981" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => openConversation(item)}
            className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/50 items-center justify-center"
          >
            <Ionicons name="chatbubble-ellipses" size={14} color={palette.textMutedColor} />
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

      <View className="px-4 flex-1">
        {/* Segmented Tab Bar */}
        <View className="flex-row p-1 rounded-2xl bg-slate-800/40 border border-slate-700/40 mb-3 mt-1">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('team')}
            className={`flex-1 py-2 rounded-xl items-center justify-center ${
              activeTab === 'team' ? 'bg-indigo-600 shadow-md' : ''
            }`}
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name="people"
                size={14}
                color={activeTab === 'team' ? '#ffffff' : palette.textMutedColor}
              />
              <Text
                className={`text-[12px] font-bold ${
                  activeTab === 'team' ? 'text-white' : palette.textMuted
                }`}
              >
                Sales Team ({teamMembers.length})
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('contacts')}
            className={`flex-1 py-2 rounded-xl items-center justify-center ${
              activeTab === 'contacts' ? 'bg-indigo-600 shadow-md' : ''
            }`}
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name="person-circle"
                size={14}
                color={activeTab === 'contacts' ? '#ffffff' : palette.textMutedColor}
              />
              <Text
                className={`text-[12px] font-bold ${
                  activeTab === 'contacts' ? 'text-white' : palette.textMuted
                }`}
              >
                Contacts ({contacts.length})
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Filter Bar */}
        <View className={`flex-row items-center px-3 py-2 rounded-2xl border ${palette.border} ${palette.surfaceAlt} mb-3`}>
          <Ionicons name="search" size={16} color={palette.textMutedColor} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${activeTab === 'team' ? 'team members' : 'contacts'}...`}
            placeholderTextColor={palette.textMutedColor}
            className={`flex-1 ml-2 text-[13px] ${palette.text}`}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={palette.textMutedColor} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Directory List */}
        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#6366f1" />
            <Text className={`text-[12px] ${palette.textMuted} mt-2`}>Loading Directory...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Ionicons name="chatbubbles-outline" size={36} color={palette.textMutedColor} />
                <Text className={`text-[13px] font-bold ${palette.text} mt-2`}>
                  No {activeTab === 'team' ? 'team members' : 'contacts'} found
                </Text>
                <Text className={`text-[11px] ${palette.textMuted} mt-0.5 text-center px-6`}>
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

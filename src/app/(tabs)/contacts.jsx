import Ionicons from '@expo/vector-icons/Ionicons';
import { useScrollToTop } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import { getSession } from '~/utils/authStorage';
import ContactCard from '../_components/ContactCard';
import CreateContactModal from '../_components/CreateContactModal';
import CrmHeader from '../_components/CrmHeader';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import ShareContactModal from '../_components/ShareContactModal';
import IosDeleteConfirmModal from '../_components/IosDeleteConfirmModal';
import { useCrmTheme } from '~/utils/crm/colors';
import { CRM_TAG_FILTERS } from '~/utils/crm/constants';

const SCOPE_FILTERS = [
  { id: 'ALL', label: 'All People' },
  { id: 'WA_SYNCED', label: 'WhatsApp Linked' },
  { id: 'ATS_LINKED', label: 'ATS Candidates' },
  { id: 'SHARED', label: 'Shared with Team' },
  ...CRM_TAG_FILTERS.filter((t) => t !== 'ALL').map((t) => ({ id: t, label: t.replace('_', ' ') })),
];

export default function CrmContactsTab() {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);
  const {
    contacts,
    loading,
    refreshing,
    refreshAll,
    openCreateContact,
    optimisticDeleteContact,
  } = useCrm();

  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState('ALL');
  const [shareContact, setShareContact] = useState(null);
  const [deleteContactTarget, setDeleteContactTarget] = useState(null);

  useEffect(() => {
    getSession().then((s) => {
      const uid = s?.user?.id || s?.user?.userId || s?.user?._id;
      if (uid) setCurrentUserId(uid);
    });
  }, []);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (selectedScope !== 'ALL') {
        const ma = c.moduleAccess || {};
        const mods = Array.isArray(ma.modules) ? ma.modules : [];
        if (selectedScope === 'ATS_LINKED') {
          if (!mods.includes('ats')) return false;
        } else if (selectedScope === 'WA_SYNCED') {
          if (!mods.includes('konnectx') && !c.phone) return false;
        } else if (selectedScope === 'SHARED') {
          const hasRelShare = Array.isArray(c.sharedWith) && c.sharedWith.length > 0;
          const hasJsonShare = Array.isArray(ma.sharedWith) && ma.sharedWith.length > 0;
          const isSharedWithMe = Boolean(currentUserId && c.userId && c.userId !== currentUserId);
          if (!hasRelShare && !hasJsonShare && !isSharedWithMe) return false;
        } else {
          if (!c.tags || !c.tags.includes(selectedScope)) return false;
        }
      }
      if (deferredSearchQuery.trim()) {
        const q = deferredSearchQuery.toLowerCase();
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchAccount = (c.account?.name || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchAccount) return false;
      }
      return true;
    });
  }, [contacts, selectedScope, deferredSearchQuery, currentUserId]);

  return (
    <AppScreen>
      <CrmHeader
        title="CRM Rolodex"
        subtitle={`${contacts.length} Total Contacts • 360° Profiles`}
        rightActions={
          <Pressable
            onPress={openCreateContact}
            className="h-9 px-3 flex-row items-center justify-center gap-x-1.5 rounded-xl active:opacity-85 shadow-sm"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="person-add" size={15} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Add</Text>
          </Pressable>
        }
      />

      <QuickWhatsAppModal />
      <CreateContactModal />
      <ShareContactModal
        contact={shareContact}
        visible={Boolean(shareContact)}
        onClose={() => setShareContact(null)}
        onUpdated={refreshAll}
      />

      {/* Search & Tag Filter Bar */}
      <View
        className="px-3 pt-2.5 pb-2 border-b"
        style={{
          backgroundColor: colors.header,
          borderColor: colors.border,
        }}
      >
        <View
          className="flex-row items-center gap-x-2 rounded-xl px-3 py-2 border"
          style={{
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          }}
        >
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, phone, email, company..."
            placeholderTextColor={colors.inputPlaceholder}
            className="flex-1 text-xs py-0.5"
            style={{ color: colors.text }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter Pills Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
          className="mt-2.5 flex-row py-0.5"
        >
          {SCOPE_FILTERS.map((f) => {
            const isSelected = selectedScope === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setSelectedScope(f.id)}
                className="mr-1.5 rounded-xl px-3 py-1.5 border active:opacity-80"
                style={{
                  backgroundColor: isSelected ? colors.primary : colors.cardAlt,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="text-[11px] font-bold"
                  style={{
                    color: isSelected ? '#ffffff' : colors.text,
                  }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
            {filteredContacts.length} people matching criteria
          </Text>
        </View>
      </View>

      {/* Contacts List */}
      <FlashList
        ref={scrollRef}
        data={filteredContacts}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            onShare={(c) => setShareContact(c)}
            onDeletePrompt={(c) => setDeleteContactTarget(c)}
          />
        )}
        ListEmptyComponent={
          loading && contacts.length === 0 ? (
            <View className="py-14 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-xs font-semibold mt-2" style={{ color: colors.textMuted }}>
                Loading CRM Rolodex...
              </Text>
            </View>
          ) : (
            <View
              className="rounded-[16px] border border-dashed p-6 items-center justify-center"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="people-outline" size={32} color={colors.textSoft} />
              <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
                No Contacts Found
              </Text>
              <Text className="text-xs text-center mt-1" style={{ color: colors.textMuted }}>
                {searchQuery
                  ? 'No contacts match your query.'
                  : 'Start adding client contacts to enable 1-click WhatsApp follow-ups.'}
              </Text>
              <Pressable
                onPress={openCreateContact}
                className="mt-3 rounded-xl px-4 py-2"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-xs font-bold text-white">+ Add First Contact</Text>
              </Pressable>
            </View>
          )
        }
      />

      {/* iOS-Style Delete Confirmation Modal */}
      <IosDeleteConfirmModal
        visible={!!deleteContactTarget}
        title={deleteContactTarget?.name ? `Delete "${deleteContactTarget.name}"` : 'Delete Contact'}
        message="Are you sure you want to delete this contact? This will remove all their details from your CRM."
        confirmText="Delete Contact"
        isPermanent={true}
        onConfirm={() => {
          if (deleteContactTarget) {
            const id = deleteContactTarget.id;
            setDeleteContactTarget(null);
            optimisticDeleteContact(id);
          }
        }}
        onCancel={() => setDeleteContactTarget(null)}
      />
    </AppScreen>
  );
}

import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCrm } from '~/providers/CrmProvider';
import { useCrmTheme } from '../utils/colors';
import { CRM_TAG_FILTERS } from '../utils/constants';
import CrmHeader from '../_components/CrmHeader';
import ContactCard from '../_components/ContactCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import CreateContactModal from '../_components/CreateContactModal';

export default function CrmContactsTab() {
  const router = useRouter();
  const { colors } = useCrmTheme();
  const { contacts, loading, refreshing, refreshAll, openCreateContact } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');

  const filteredContacts = contacts.filter((c) => {
    if (selectedTag !== 'ALL') {
      if (!c.tags || !c.tags.includes(selectedTag)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchPhone = (c.phone || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchAccount = (c.account?.name || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchAccount) return false;
    }
    return true;
  });

  return (
    <AppScreen>
      <CrmHeader
        title="Contacts (People)"
        subtitle={`${contacts.length} Total • 360° Dossiers`}
        rightActions={
          <Pressable
            onPress={openCreateContact}
            className="h-9 px-3 flex-row items-center justify-center gap-x-1 rounded-xl active:opacity-80"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="person-add" size={15} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Add</Text>
          </Pressable>
        }
      />

      <QuickWhatsAppModal />
      <CreateContactModal />

      {/* Search & Tag Filter Bar */}
      <View
        className="px-3 py-2 border-b"
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
          <Ionicons name="search" size={15} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, phone, email, company..."
            placeholderTextColor={colors.inputPlaceholder}
            className="flex-1 text-xs"
            style={{ color: colors.text }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
          className="mt-2 flex-row py-0.5"
        >
          {CRM_TAG_FILTERS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <Pressable
                key={tag}
                onPress={() => setSelectedTag(tag)}
                className="mr-2 rounded-xl px-3 py-1.5 border"
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
                  {tag.replace('_', ' ')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Contacts List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.primary} />}
        className="px-3 pt-3"
      >
        {loading && contacts.length === 0 ? (
          <View className="py-14 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-xs font-semibold mt-2" style={{ color: colors.textMuted }}>
              Loading contacts...
            </Text>
          </View>
        ) : filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => <ContactCard key={contact.id} contact={contact} />)
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
        )}
      </ScrollView>
    </AppScreen>
  );
}


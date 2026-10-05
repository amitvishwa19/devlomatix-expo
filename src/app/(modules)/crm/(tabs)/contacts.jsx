import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import { useCrm } from '~/providers/CrmProvider';
import CrmHeader from '../_components/CrmHeader';
import ContactCard from '../_components/ContactCard';
import QuickWhatsAppModal from '../_components/QuickWhatsAppModal';
import CreateContactModal from '../_components/CreateContactModal';

const TAG_FILTERS = ['ALL', 'LEAD', 'CLIENT', 'ENTERPRISE', 'ATS_CANDIDATE'];

export default function CrmContactsTab() {
  const router = useRouter();
  const { palette } = useAppTheme();
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
            className="h-9 px-3 flex-row items-center justify-center gap-x-1 rounded-xl bg-indigo-600 active:bg-indigo-700"
          >
            <Ionicons name="person-add" size={15} color="#ffffff" />
            <Text className="text-xs font-bold text-white">Add</Text>
          </Pressable>
        }
      />

      <QuickWhatsAppModal />
      <CreateContactModal />

      {/* Search & Tag Filter Bar */}
      <View className={`${palette.surface} px-4 py-2.5 border-b ${palette.border}`}>
        <View className={`flex-row items-center gap-x-2 rounded-xl ${palette.surfaceAlt} px-3 py-2 border ${palette.border}`}>
          <Ionicons name="search" size={16} color={palette.textMutedColor} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, phone, email, company..."
            placeholderTextColor={palette.textMutedColor}
            className={`flex-1 text-xs ${palette.text}`}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={14} color={palette.textMutedColor} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
          className="mt-2.5 flex-row py-0.5"
        >
          {TAG_FILTERS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <Pressable
                key={tag}
                onPress={() => setSelectedTag(tag)}
                className={`mr-2.5 rounded-xl px-3.5 py-1.5 border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600'
                    : `${palette.surfaceAlt} ${palette.border} active:opacity-75`
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    isSelected ? 'text-white' : palette.text
                  }`}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
        className="px-4 pt-3.5"
      >
        {loading && contacts.length === 0 ? (
          <View className="py-14 items-center justify-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className={`text-xs ${palette.textMuted} font-semibold mt-2`}>Loading contacts...</Text>
          </View>
        ) : filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => <ContactCard key={contact.id} contact={contact} />)
        ) : (
          <View className={`rounded-2xl border border-dashed ${palette.border} p-8 items-center justify-center ${palette.surface}`}>
            <Ionicons name="people-outline" size={32} color={palette.textMutedColor} />
            <Text className={`text-sm font-bold ${palette.text} mt-2`}>No Contacts Found</Text>
            <Text className={`text-xs ${palette.textMuted} text-center mt-1`}>
              {searchQuery
                ? 'No contacts match your query.'
                : 'Start adding client contacts to enable 1-click WhatsApp follow-ups.'}
            </Text>
            <Pressable
              onPress={openCreateContact}
              className="mt-3.5 rounded-xl bg-indigo-600 px-4 py-2"
            >
              <Text className="text-xs font-bold text-white">+ Add First Contact</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '~/theme/AppTheme';
import * as leadgenService from '~/services/leadgen';

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'realestate', label: 'Real Estate' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'finance', label: 'Finance' },
  { value: 'construction', label: 'Construction' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'legal', label: 'Legal' },
];

const Input = ({ label, value, onChange, placeholder, multiline, numeric, palette }) => (
  <View>
    <Text className={`text-[12px] font-semibold mb-1 ${palette.text}`}>{label}</Text>
    <TextInput
      className={`rounded-[10px] border px-3 py-2 text-[13px] ${multiline ? 'min-h-[60px]' : ''}`}
      style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border, color: palette.textColor }}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={palette.textMutedColor}
      multiline={multiline}
      keyboardType={numeric ? 'numeric' : 'default'}
    />
  </View>
);

export default function LeadGenScreen() {
  const { palette } = useAppTheme();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searched, setSearched] = useState(false);

  const handleSearch = async (pageToken) => {
    if (!keyword.trim()) {
      Toast.show({ type: 'error', text1: 'Keyword is required' });
      return;
    }

    setSearching(true);
    try {
      const res = await leadgenService.searchLeads({
        keyword: keyword.trim(),
        category,
        country,
        state,
        city,
        pincode,
        pageToken: pageToken || undefined,
      });

      if (res?.success) {
        if (pageToken) {
          setLeads((prev) => [...prev, ...res.leads]);
        } else {
          setLeads(res.leads);
        }
        setNextPageToken(res.nextPageToken);
        setStats(res.stats);
        setSearched(true);
      } else {
        Toast.show({ type: 'error', text1: res?.message || 'Search failed' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Search error', text2: err?.response?.data?.message || err.message });
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveSelected = async () => {
    const selectedLeads = leads.filter((l) => selectedIds.has(l.id));
    if (selectedLeads.length === 0) {
      Toast.show({ type: 'error', text1: 'No leads selected' });
      return;
    }

    setSaving(true);
    try {
      const res = await leadgenService.saveLeads({ leads: selectedLeads });
      if (res?.success) {
        Toast.show({ type: 'success', text1: res.message || 'Leads saved' });
        setSelectedIds(new Set());
        setLeads((prev) => prev.map((l) => selectedIds.has(l.id) ? { ...l, isSaved: true } : l));
      } else {
        Toast.show({ type: 'error', text1: res?.message || 'Save failed' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Save error', text2: err?.response?.data?.error || err.message });
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setKeyword('');
    setCategory('all');
    setCountry('');
    setState('');
    setCity('');
    setPincode('');
    setLeads([]);
    setNextPageToken(null);
    setStats(null);
    setSelectedIds(new Set());
    setSearched(false);
  };

  return (
    <SafeAreaView className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: palette.colors.surface, borderColor: palette.colors.border }}>
        <Text className={`text-[18px] font-bold ${palette.text}`}>Lead Generator</Text>
        <TouchableOpacity onPress={clearFilters} className="rounded-full border px-3 py-1.5" style={{ borderColor: palette.colors.border }}>
          <Text className={`text-[11px] font-bold ${palette.textMuted}`}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-4 gap-3">
          {/* Search Filters */}
          <View className="rounded-[16px] overflow-hidden border" style={{ borderColor: palette.colors.border }}>
            <View className="px-4 py-3" style={{ backgroundColor: palette.colors.surface }}>
              <Text className={`text-[15px] font-bold mb-3 ${palette.text}`}>Search Filters</Text>
              <View className="gap-3">
                <Input label="Keyword *" value={keyword} onChange={setKeyword} placeholder="e.g. hospitals, schools" palette={palette} />

                {/* Category selector */}
                <View>
                  <Text className={`text-[12px] font-semibold mb-1 ${palette.text}`}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    <View className="flex-row flex-wrap gap-1.5">
                      {categories.map((c) => (
                        <TouchableOpacity key={c.value} onPress={() => setCategory(c.value)}
                          className={`px-3 py-1.5 rounded-[8px] ${category === c.value ? 'bg-red-600' : 'border'}`}
                          style={category !== c.value ? { borderColor: palette.colors.border } : {}}>
                          <Text className={`text-[11px] font-bold ${category === c.value ? 'text-white' : palette.text}`}>
                            {c.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

<Input label="Country" value={country} onChange={setCountry} placeholder="e.g. India" palette={palette} />
<Input label="State" value={state} onChange={setState} placeholder="e.g. Maharashtra" palette={palette} />
<Input label="City" value={city} onChange={setCity} placeholder="e.g. Mumbai" palette={palette} />
<Input label="Pincode" value={pincode} onChange={setPincode} placeholder="e.g. 400001" numeric palette={palette} />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleSearch(null)}
              disabled={searching}
              className="bg-red-600 py-3.5 items-center"
            >
              {searching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Ionicons name="search" size={16} color="#fff" />
                  <Text className="text-white text-[14px] font-bold">Find Leads</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Stats */}
          {stats && (
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-[12px] bg-red-50 px-3 py-2.5 border border-red-200">
                <Text className="text-[18px] font-bold text-red-700">{stats.totalLeads}</Text>
                <Text className="text-[10px] text-red-600">Total Leads</Text>
              </View>
              <View className="flex-1 rounded-[12px] bg-green-50 px-3 py-2.5 border border-green-200">
                <Text className="text-[18px] font-bold text-green-700">{stats.withPhone}</Text>
                <Text className="text-[10px] text-green-600">With Phone</Text>
              </View>
              <View className="flex-1 rounded-[12px] bg-amber-50 px-3 py-2.5 border border-amber-200">
                <Text className="text-[18px] font-bold text-amber-700">{stats.avgRating}</Text>
                <Text className="text-[10px] text-amber-600">Avg Rating</Text>
              </View>
            </View>
          )}

          {/* Results */}
          {leads.length > 0 && (
            <View className="rounded-[16px] overflow-hidden border" style={{ borderColor: palette.colors.border }}>
              <View className="px-4 py-3 flex-row items-center justify-between" style={{ backgroundColor: palette.colors.surface }}>
                <Text className={`text-[15px] font-bold ${palette.text}`}>Results ({leads.length})</Text>
                {selectedIds.size > 0 && (
                  <TouchableOpacity onPress={handleSaveSelected} disabled={saving}
                    className="bg-red-600 rounded-full px-3 py-1.5 flex-row items-center gap-1">
                    {saving ? (
                      <ActivityIndicator color="#fff" size={12} />
                    ) : (
                      <Ionicons name="save" size={12} color="#fff" />
                    )}
                    <Text className="text-white text-[11px] font-bold">Save ({selectedIds.size})</Text>
                  </TouchableOpacity>
                )}
              </View>

              {leads.map((lead) => {
                const selected = selectedIds.has(lead.id);
                return (
                  <TouchableOpacity key={lead.id} onPress={() => toggleSelect(lead.id)}
                    className={`px-4 py-3 border-b flex-row items-start gap-3 ${selected ? 'bg-red-50/50' : ''}`}
                    style={{ borderColor: palette.colors.border }}>
                    <View className={`w-5 h-5 rounded-[4px] border-2 items-center justify-center mt-0.5 ${selected ? 'bg-red-600 border-red-600' : ''}`}
                      style={{ borderColor: selected ? '#dc2626' : palette.colors.border }}>
                      {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className={`text-[14px] font-bold ${palette.text} flex-1`}>{lead.name}</Text>
                        {lead.isSaved && (
                          <View className="rounded-full bg-green-100 px-2 py-0.5">
                            <Text className="text-[9px] font-bold text-green-700">Saved</Text>
                          </View>
                        )}
                      </View>
                      {lead.phone && <Text className="text-[12px] text-blue-600 mt-0.5">{lead.phone}</Text>}
                      {lead.address && (
                        <Text className={`text-[11px] ${palette.textMuted} mt-0.5`} numberOfLines={2}>{lead.address}</Text>
                      )}
                      <View className="flex-row items-center gap-3 mt-1">
                        {lead.rating > 0 && (
                          <View className="flex-row items-center gap-0.5">
                            <Ionicons name="star" size={11} color="#f59e0b" />
                            <Text className="text-[10px] text-amber-600">{lead.rating}</Text>
                          </View>
                        )}
                        {lead.reviews > 0 && (
                          <Text className="text-[10px] text-gray-400">({lead.reviews} reviews)</Text>
                        )}
                        {lead.category && (
                          <View className="rounded-full bg-gray-100 px-2 py-0.5">
                            <Text className="text-[9px] text-gray-600">{lead.category}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Load More */}
              {nextPageToken && (
                <TouchableOpacity onPress={() => handleSearch(nextPageToken)} disabled={searching}
                  className="py-3 items-center border-t" style={{ borderColor: palette.colors.border }}>
                  {searching ? (
                    <ActivityIndicator color={palette.textMutedColor} size="small" />
                  ) : (
                    <Text className={`text-[12px] font-bold ${palette.textMuted}`}>Load More</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Empty state */}
          {searched && leads.length === 0 && !searching && (
            <View className="items-center py-12">
              <Ionicons name="search-outline" size={48} color={palette.textMutedColor} />
              <Text className={`text-[15px] font-bold mt-3 ${palette.textMuted}`}>No leads found</Text>
              <Text className={`text-[12px] ${palette.textMuted} mt-1`}>Try different keywords or location</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

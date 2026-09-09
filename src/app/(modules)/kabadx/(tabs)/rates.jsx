import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKabadx } from '~/providers/KabadxProvider';
import { useAppTheme } from '~/theme/AppTheme';

export default function KabadxRatesScreen() {
  const { palette } = useAppTheme();
  const router = useRouter();
  const { rates } = useKabadx();

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculator Weight State (in kg / units)
  const [calcWeights, setCalcWeights] = useState({
    paper: 20,
    metal: 5,
    plastic: 4,
    ewaste: 2,
  });

  const categories = ['ALL', 'Paper', 'Metal', 'Plastic', 'E-Waste', 'Glass'];

  const filteredRates = rates.filter((r) => {
    const matchesCat = activeCategory === 'ALL' || r.category === activeCategory;
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const estTotalEarnings =
    calcWeights.paper * 16 +
    calcWeights.metal * 28 +
    calcWeights.plastic * 22 +
    calcWeights.ewaste * 180;

  const totalEstWeight = calcWeights.paper + calcWeights.metal + calcWeights.plastic + calcWeights.ewaste;

  const updateWeight = (key, delta) => {
    setCalcWeights((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  const categoryImages = {
    Paper: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=300&q=80',
    Metal: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80',
    Plastic: 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=300&q=80',
    'E-Waste': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=80',
    Glass: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80',
  };

  return (
    <SafeAreaView edges={['top']} className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        {/* Header */}
        <View className={`px-4 py-3 border-b ${palette.surface} ${palette.border}`}>
          <Text className={`text-[18px] font-bold ${palette.text}`}>Live Scrap Rates in Vadodara</Text>
          <Text className={`text-[11px] ${palette.textMuted}`}>Updated daily market prices per kg & piece</Text>

          {/* Search Input */}
          <View className={`mt-2.5 flex-row items-center gap-2 rounded-xl border px-3 py-2 ${palette.page} ${palette.border}`}>
            <Ionicons name="search-outline" size={16} color={palette.textMutedColor} />
            <TextInput
              className="flex-1 text-[13px]"
              style={{ color: palette.textColor }}
              placeholder="Search scrap (e.g. Newspaper, Copper)..."
              placeholderTextColor={palette.textMutedColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={palette.textMutedColor} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Category Pills */}
        <View className="px-4 py-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {categories.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setActiveCategory(c)}
                className={`rounded-full px-3.5 py-1.5 border ${
                  activeCategory === c ? 'bg-teal-600 border-teal-600' : `${palette.surface} ${palette.border}`
                }`}>
                <Text className={`text-[11px] font-bold ${activeCategory === c ? 'text-white' : palette.textColor}`}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
          {/* Live Market Alert */}
          <View className="mb-3 rounded-2xl p-3.5 bg-teal-600/10 border border-teal-500/20 flex-row items-center gap-2.5">
            <Ionicons name="trending-up" size={18} color="#0d9488" />
            <View className="flex-1">
              <Text className={`text-[12px] font-bold ${palette.text}`}>Daily Price Assurance</Text>
              <Text className={`text-[10px] ${palette.textMuted}`}>Updated today at 09:00 AM • Guaranteed highest scrap rates in Vadodara</Text>
            </View>
          </View>

          {/* Household Earnings Estimator Card */}
          <View className={`mb-4 rounded-[24px] border p-4 shadow-md ${palette.surface} ${palette.border}`}>
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="calculator" size={18} color="#0d9488" />
                <Text className={`text-[15px] font-bold ${palette.text}`}>Household Payout Estimator</Text>
              </View>
              <View className="rounded-full bg-teal-600/10 px-2.5 py-0.5">
                <Text className="text-[10px] font-extrabold text-teal-600">ESTIMATOR</Text>
              </View>
            </View>

            {/* Estimator Rows */}
            <View className="gap-2">
              <View className="flex-row items-center justify-between rounded-xl p-2.5 border border-gray-500/10 bg-teal-600/5">
                <View>
                  <Text className={`text-[12px] font-bold ${palette.text}`}>Paper & Newspapers</Text>
                  <Text className={`text-[10px] ${palette.textMuted}`}>₹16 / kg</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity onPress={() => updateWeight('paper', -5)} className="rounded-lg bg-teal-600/20 px-2.5 py-1">
                    <Text className="text-[13px] font-bold text-teal-700">-</Text>
                  </TouchableOpacity>
                  <Text className={`w-10 text-center text-[12px] font-bold ${palette.text}`}>{calcWeights.paper} kg</Text>
                  <TouchableOpacity onPress={() => updateWeight('paper', 5)} className="rounded-lg bg-teal-600/20 px-2.5 py-1">
                    <Text className="text-[13px] font-bold text-teal-700">+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row items-center justify-between rounded-xl p-2.5 border border-gray-500/10 bg-amber-500/5">
                <View>
                  <Text className={`text-[12px] font-bold ${palette.text}`}>Iron & Scrap Metal</Text>
                  <Text className={`text-[10px] ${palette.textMuted}`}>₹28 / kg</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity onPress={() => updateWeight('metal', -2)} className="rounded-lg bg-amber-500/20 px-2.5 py-1">
                    <Text className="text-[13px] font-bold text-amber-800">-</Text>
                  </TouchableOpacity>
                  <Text className={`w-10 text-center text-[12px] font-bold ${palette.text}`}>{calcWeights.metal} kg</Text>
                  <TouchableOpacity onPress={() => updateWeight('metal', 2)} className="rounded-lg bg-amber-500/20 px-2.5 py-1">
                    <Text className="text-[13px] font-bold text-amber-800">+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row items-center justify-between rounded-xl p-2.5 border border-gray-500/10 bg-emerald-500/5">
                <View>
                  <Text className={`text-[12px] font-bold ${palette.text}`}>Plastics & PET Bottles</Text>
                  <Text className={`text-[10px] ${palette.textMuted}`}>₹22 / kg</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity onPress={() => updateWeight('plastic', -2)} className="rounded-lg bg-emerald-500/20 px-2.5 py-1">
                    <Text className="text-[13px] font-bold text-emerald-800">-</Text>
                  </TouchableOpacity>
                  <Text className={`w-10 text-center text-[12px] font-bold ${palette.text}`}>{calcWeights.plastic} kg</Text>
                  <TouchableOpacity onPress={() => updateWeight('plastic', 2)} className="rounded-lg bg-emerald-500/20 px-2.5 py-1">
                    <Text className="text-[13px] font-bold text-emerald-800">+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row items-center justify-between rounded-xl p-2.5 border border-gray-500/10 bg-purple-500/5">
                <View>
                  <Text className={`text-[12px] font-bold ${palette.text}`}>E-Waste & Laptops</Text>
                  <Text className={`text-[10px] ${palette.textMuted}`}>₹180 / pc</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity onPress={() => updateWeight('ewaste', -1)} className="rounded-lg bg-purple-500/20 px-2.5 py-1">
                    <Text className="text-[13px] font-bold text-purple-800">-</Text>
                  </TouchableOpacity>
                  <Text className={`w-10 text-center text-[12px] font-bold ${palette.text}`}>{calcWeights.ewaste} pc</Text>
                  <TouchableOpacity onPress={() => updateWeight('ewaste', 1)} className="rounded-lg bg-purple-500/20 px-2.5 py-1">
                    <Text className="text-[13px] font-bold text-purple-800">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Total Calculation & CTA */}
            <View className="mt-3.5 flex-row items-center justify-between rounded-xl bg-teal-600/15 p-3">
              <View>
                <Text className={`text-[10px] ${palette.textMuted}`}>Total Est. Quantity</Text>
                <Text className={`text-[14px] font-bold ${palette.text}`}>{totalEstWeight} items/kg</Text>
              </View>
              <View className="items-end">
                <Text className={`text-[10px] ${palette.textMuted}`}>Est. Cash Payout</Text>
                <Text className="text-[22px] font-black text-teal-600">₹{estTotalEarnings}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(modules)/kabadx/pickups')}
              className="mt-3 rounded-xl bg-teal-600 py-3 items-center shadow-md flex-row justify-center gap-2">
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text className="text-[12px] font-extrabold text-white">Book Doorstep Pickup for ₹{estTotalEarnings}</Text>
            </TouchableOpacity>
          </View>

          {/* Scrap Rates List with Category Photos */}
          <Text className={`mb-2.5 text-[15px] font-bold ${palette.text}`}>Vadodara Scrap Rate List ({filteredRates.length})</Text>
          <View className="gap-2.5">
            {filteredRates.map((item) => (
              <View key={item.id} className={`rounded-[20px] border p-3 flex-row items-center justify-between ${palette.surface} ${palette.border}`}>
                <View className="flex-row items-center gap-3">
                  <Image
                    source={{ uri: categoryImages[item.category] || categoryImages.Paper }}
                    className="h-11 w-11 rounded-xl"
                  />
                  <View>
                    <Text className={`text-[13px] font-bold ${palette.text}`}>{item.name}</Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>{item.category} • Free Pickup</Text>
                  </View>
                </View>

                <View className="items-end">
                  <View className="flex-row items-baseline gap-1">
                    <Text className="text-[16px] font-extrabold text-teal-600">₹{item.pricePerKg}</Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>/{item.unit}</Text>
                  </View>
                  <View className="flex-row items-center gap-0.5">
                    {item.trend === 'up' ? (
                      <Ionicons name="caret-up" size={10} color="#16a34a" />
                    ) : item.trend === 'down' ? (
                      <Ionicons name="caret-down" size={10} color="#dc2626" />
                    ) : null}
                    <Text className={`text-[9px] font-bold ${item.trend === 'up' ? 'text-green-600' : item.trend === 'down' ? 'text-red-600' : palette.textMuted}`}>
                      {item.trend === 'up' ? 'Price Up' : item.trend === 'down' ? 'Price Down' : 'Stable'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

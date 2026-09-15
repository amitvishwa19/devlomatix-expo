import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useCurexa } from '~/providers/CurexaProvider';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';

export default function CurexaPharmacyScreen() {
  const { palette } = useAppTheme();
  const { medicines, setMedicines } = useCurexa();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [dispenseMed, setDispenseMed] = useState(null);

  // New Drug Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cardiovascular');
  const [stock, setStock] = useState('100');
  const [price, setPrice] = useState('15.00');
  const [batch, setBatch] = useState('BAT-2026-01');

  const categories = ['ALL', 'Cardiovascular', 'Antibiotics', 'Antidiabetic', 'Gastrointestinal', 'Analgesic'];

  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.generic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.batch?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || m.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [medicines, searchQuery, selectedCategory]);

  const handleAddMedicine = () => {
    if (!name || !stock) return;
    const newMed = {
      id: `med-${Date.now()}`,
      name,
      generic: name.split(' ')[0],
      category,
      stock: parseInt(stock) || 100,
      minStock: 50,
      price: parseFloat(price) || 10.0,
      expiry: '2028-06-30',
      form: 'Tablet',
      batch,
    };
    setMedicines((prev) => [newMed, ...prev]);
    setShowAddModal(false);
    setName('');
  };

  const handleDispense = (qtyToDispense = 10) => {
    if (!dispenseMed) return;
    setMedicines((prev) =>
      prev.map((m) =>
        m.id === dispenseMed.id ? { ...m, stock: Math.max(0, m.stock - qtyToDispense) } : m
      )
    );
    setDispenseMed(null);
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="Pharmacy & Drug Stock"
        subtitle={`${filteredMedicines.length} Medicines Cataloged`}
        showBack
        rightAction={
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="flex-row items-center gap-1 rounded-[12px] bg-purple-600 px-2.5 py-1.5"
          >
            <Ionicons name="add" size={15} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Add Drug</Text>
          </Pressable>
        }
      />

      <View className="flex-1 px-3 pt-2">
        {/* Search */}
        <View className="mb-2 flex-row items-center gap-2">
          <View
            className={`flex-1 flex-row items-center gap-2 rounded-[14px] px-2.5 py-1.5 border ${palette.surface} ${palette.border}`}
          >
            <Ionicons name="search-outline" size={16} color={palette.textMutedColor} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search medicine, generic, or batch..."
              placeholderTextColor={palette.textMutedColor}
              className={`flex-1 text-[12px] ${palette.text}`}
            />
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 max-h-8">
          <View className="flex-row gap-1.5">
            {categories.map((c) => (
              <Pressable
                key={c}
                onPress={() => setSelectedCategory(c)}
                className={`rounded-[10px] px-2.5 py-1 ${
                  selectedCategory === c ? 'bg-purple-600' : palette.surface
                }`}
              >
                <Text
                  className={`text-[10px] font-semibold ${
                    selectedCategory === c ? 'text-white font-bold' : palette.text
                  }`}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Medicine Inventory Cards */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pb-24">
          <View className="gap-2">
            {filteredMedicines.map((m) => {
              const isLowStock = m.stock <= (m.minStock || 50);

              return (
                <View
                  key={m.id}
                  className={`rounded-[16px] p-3 shadow-sm ${palette.surface}`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View className="h-9 w-9 items-center justify-center rounded-[12px] bg-purple-500/15">
                        <Ionicons name="medkit" size={17} color="#9333ea" />
                      </View>
                      <View>
                        <Text className={`text-[13px] font-bold ${palette.text}`}>{m.name}</Text>
                        <Text className={`text-[10px] ${palette.textMuted}`}>
                          {m.category} • Batch: {m.batch} • Exp: {m.expiry}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-[13px] font-bold text-purple-600">
                        ${typeof m.price === 'number' ? m.price.toFixed(2) : m.price}
                      </Text>
                      <View
                        className={`mt-0.5 rounded-full px-2 py-0.2 ${
                          isLowStock ? 'bg-red-500/20' : 'bg-emerald-500/20'
                        }`}
                      >
                        <Text
                          className={`text-[9px] font-bold ${
                            isLowStock ? 'text-red-700' : 'text-emerald-700'
                          }`}
                        >
                          {m.stock} In Stock
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Dispense Action */}
                  <View className="mt-2.5 flex-row items-center justify-between border-t border-gray-200/15 pt-2">
                    <Text className={`text-[10px] ${palette.textMuted}`}>
                      Min threshold: {m.minStock || 50} units
                    </Text>
                    <Pressable
                      onPress={() => setDispenseMed(m)}
                      className="rounded-[10px] bg-purple-600 px-3 py-1"
                    >
                      <Text className="text-[10px] font-bold text-white">Dispense</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Add Medicine Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`max-h-[85%] rounded-t-[24px] p-3.5 ${palette.surface}`}>
            <View className="mb-2.5 flex-row items-center justify-between border-b border-gray-200/15 pb-2">
              <Text className={`text-[15px] font-bold ${palette.text}`}>Add New Medicine to Stock</Text>
              <Pressable onPress={() => setShowAddModal(false)} className={`rounded-full p-1 ${palette.surfaceAlt}`}>
                <Ionicons name="close" size={18} color={palette.textMutedColor} />
              </Pressable>
            </View>

            <View className="gap-2 mb-3">
              <View>
                <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Brand / Generic Name *</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Azithromycin 500mg"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                />
              </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Initial Stock Qty</Text>
                  <TextInput
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="numeric"
                    className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Unit Price ($)</Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                  />
                </View>
              </View>

              <View>
                <Text className={`text-[10px] font-semibold mb-1 ${palette.textMuted}`}>Batch Number</Text>
                <TextInput
                  value={batch}
                  onChangeText={setBatch}
                  className={`rounded-[12px] p-2.5 text-[12px] border ${palette.surfaceInset} ${palette.border} ${palette.text}`}
                />
              </View>
            </View>

            <View className="flex-row gap-2 pt-2 border-t border-gray-200/15">
              <Pressable onPress={() => setShowAddModal(false)} className="flex-1 rounded-[12px] bg-gray-500/15 py-2.5 items-center">
                <Text className={`text-[12px] font-bold ${palette.text}`}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddMedicine} className="flex-1 rounded-[12px] bg-purple-600 py-2.5 items-center">
                <Text className="text-[12px] font-bold text-white">Save Drug</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dispense Confirm Sheet */}
      <Modal visible={!!dispenseMed} transparent animationType="slide" onRequestClose={() => setDispenseMed(null)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`rounded-t-[24px] p-3.5 ${palette.surface}`}>
            <Text className={`text-[15px] font-bold ${palette.text}`}>Dispense {dispenseMed?.name}</Text>
            <Text className={`text-[11px] ${palette.textMuted} mb-3`}>
              Current Stock: {dispenseMed?.stock} units • Price: ${dispenseMed?.price}
            </Text>

            <View className="flex-row gap-2 mb-3">
              {[5, 10, 15, 30].map((q) => (
                <Pressable
                  key={q}
                  onPress={() => handleDispense(q)}
                  className="flex-1 rounded-[12px] bg-purple-600 py-2.5 items-center"
                >
                  <Text className="text-[11px] font-bold text-white">Dispense {q}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={() => setDispenseMed(null)} className="rounded-[12px] bg-gray-500/15 py-2 items-center">
              <Text className={`text-[11px] font-bold ${palette.text}`}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

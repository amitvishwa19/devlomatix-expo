import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AppScreen from '~/components/AppScreen';
import { useAppTheme } from '~/theme/AppTheme';
import CurexaHeader from './_components/CurexaHeader';
import { createMedicine, dispensePrescription, getPharmacyData } from '~/services/curexa';

const initialMedicines = [
  { id: 'MED-101', name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 450, unit: 'Tablets', price: '$12.50', batch: 'AMX-2026-09', status: 'In Stock' },
  { id: 'MED-102', name: 'Paracetamol 650mg', category: 'Analgesic', stock: 85, unit: 'Tablets', price: '$4.20', batch: 'PCM-2026-11', status: 'Low Stock' },
  { id: 'MED-103', name: 'Pantoprazole 40mg', category: 'Antacid', stock: 320, unit: 'Tablets', price: '$8.50', batch: 'PAN-2026-08', status: 'In Stock' },
  { id: 'MED-104', name: 'Metformin 500mg', category: 'Antidiabetic', stock: 12, unit: 'Tablets', price: '$6.00', batch: 'MET-2026-05', status: 'Critical' },
  { id: 'MED-105', name: 'Atorvastatin 10mg', category: 'Cardiovascular', stock: 210, unit: 'Tablets', price: '$15.00', batch: 'ATO-2026-12', status: 'In Stock' },
];

const pendingPrescriptions = [
  { id: 'RX-901', patient: 'Robert Fox', doctor: 'Dr. Sarah Jenkins', items: ['Amoxicillin 500mg (15 tabs)', 'Paracetamol 650mg (10 tabs)'], status: 'Pending Dispense' },
  { id: 'RX-902', patient: 'Eleanor Vance', doctor: 'Dr. Alan Vance', items: ['Pantoprazole 40mg (10 tabs)', 'Atorvastatin 10mg (30 tabs)'], status: 'Pending Dispense' },
];

export default function CurexaPharmacyScreen() {
  const { palette } = useAppTheme();
  const [medicines, setMedicines] = useState([]);
  const [rxList, setRxList] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'prescriptions'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddStockModal, setShowAddStockModal] = useState(false);

  // Form for new drug stock
  const [medName, setMedName] = useState('');
  const [medCategory, setMedCategory] = useState('General');
  const [medStock, setMedStock] = useState('100');
  const [medPrice, setMedPrice] = useState('$10.00');

  useEffect(() => {
    async function loadPharmacy() {
      const res = await getPharmacyData();
      if (res) {
        if (res.medicines) {
          const formattedMeds = res.medicines.map((m) => ({
            id: m.id.slice(-4),
            name: m.name,
            category: m.category || 'General',
            stock: m.quantity || 100,
            unit: m.unit || 'Tablets',
            price: `$${(m.sellingPrice || 10).toFixed(2)}`,
            batch: m.batchNumber || 'BATCH-2026',
            status: m.quantity < 20 ? 'Critical' : m.quantity < 50 ? 'Low Stock' : 'In Stock',
          }));
          setMedicines(formattedMeds);
        } else {
          setMedicines([]);
        }

        if (res.prescriptions) {
          const formattedRx = res.prescriptions.map((rx) => ({
            id: rx.id,
            patient: rx.patient?.displayName || 'Patient',
            doctor: rx.doctor?.displayName || 'Dr. Sarah Jenkins',
            items: rx.items?.map((i) => `${i.medicineName} (${i.quantity} tabs)`) || ['Medication prescribed'],
            status: 'Pending Dispense',
          }));
          setRxList(formattedRx);
        } else {
          setRxList([]);
        }
      } else {
        setMedicines([]);
        setRxList([]);
      }
    }
    loadPharmacy();
  }, []);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [medicines, searchQuery]);

  const handleAddStock = async () => {
    if (!medName.trim()) return;
    const newMed = {
      id: `MED-${Date.now().toString().slice(-3)}`,
      name: medName,
      category: medCategory,
      stock: parseInt(medStock) || 100,
      unit: 'Tablets',
      price: medPrice,
      batch: `BATCH-${new Date().getFullYear()}`,
      status: parseInt(medStock) < 50 ? 'Low Stock' : 'In Stock',
    };
    setMedicines((prev) => [newMed, ...prev]);
    await createMedicine({ name: medName, category: medCategory, quantity: medStock, unitPrice: medPrice });
    setMedName('');
    setShowAddStockModal(false);
  };

  const handleDispenseRx = async (rxId) => {
    setRxList((prev) => prev.filter((r) => r.id !== rxId));
    await dispensePrescription({ prescriptionId: rxId });
  };


  const getStockBadge = (status) => {
    switch (status) {
      case 'Critical':
        return { bg: 'bg-red-500/20', text: 'text-red-600' };
      case 'Low Stock':
        return { bg: 'bg-amber-500/20', text: 'text-amber-600' };
      case 'In Stock':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-600' };
      default:
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-600' };
    }
  };

  return (
    <AppScreen>
      <CurexaHeader
        title="Pharmacy & Stock"
        showBack={true}
        rightAction={
          <Pressable
            onPress={() => setShowAddStockModal(true)}
            className="flex-row items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2"
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">Add Medicine</Text>
          </Pressable>
        }
      />
      <View className="flex-1 px-4 pt-3 pb-4">

        {/* Tab Switcher: Inventory vs e-Prescriptions */}
        <View className="mb-3 flex-row rounded-2xl bg-gray-500/10 p-1">
          <Pressable
            onPress={() => setActiveTab('inventory')}
            className={`flex-1 items-center rounded-xl py-2 ${
              activeTab === 'inventory' ? 'bg-emerald-600' : 'transparent'
            }`}
          >
            <Text className={`text-[12px] font-semibold ${activeTab === 'inventory' ? 'text-white' : palette.textMuted}`}>
              Drug Inventory ({medicines.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('prescriptions')}
            className={`flex-1 items-center rounded-xl py-2 ${
              activeTab === 'prescriptions' ? 'bg-emerald-600' : 'transparent'
            }`}
          >
            <Text className={`text-[12px] font-semibold ${activeTab === 'prescriptions' ? 'text-white' : palette.textMuted}`}>
              e-Prescriptions ({rxList.length})
            </Text>
          </Pressable>
        </View>

        {activeTab === 'inventory' ? (
          <View className="flex-1">
            {/* Search Bar */}
            <View className={`mb-3 flex-row items-center rounded-2xl border px-3 py-2 ${palette.surface} ${palette.border}`}>
              <Ionicons name="search-outline" size={18} color={palette.textMutedColor} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search medicine name or category..."
                placeholderTextColor={palette.textMutedColor}
                className={`ml-2 flex-1 text-[13px] ${palette.text}`}
              />
            </View>

            {/* Medicine Inventory Cards */}
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="gap-2.5 pb-8">
                {filteredMedicines.map((med) => {
                  const badge = getStockBadge(med.status);
                  return (
                    <View key={med.id} className={`rounded-[22px] p-4 shadow-sm ${palette.surface}`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15">
                            <Ionicons name="medkit-outline" size={20} color="#0284c7" />
                          </View>
                          <View>
                            <Text className={`text-[15px] font-bold ${palette.text}`}>{med.name}</Text>
                            <Text className={`text-[11px] ${palette.textMuted}`}>{med.category} • Batch: {med.batch}</Text>
                          </View>
                        </View>
                        <View className={`rounded-full px-2.5 py-0.5 ${badge.bg}`}>
                          <Text className={`text-[10px] font-bold ${badge.text}`}>{med.status}</Text>
                        </View>
                      </View>

                      <View className="mt-3 flex-row items-center justify-between border-t border-gray-200/10 pt-2.5">
                        <Text className={`text-[12px] font-bold ${palette.text}`}>
                          Stock: {med.stock} {med.unit}
                        </Text>
                        <Text className="text-[13px] font-bold text-emerald-600">{med.price} / unit</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ) : (
          /* e-Prescriptions Queue */
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {rxList.length === 0 ? (
              <View className={`mt-8 items-center rounded-2xl p-6 ${palette.surface}`}>
                <Ionicons name="checkmark-circle-outline" size={36} color="#10b981" />
                <Text className={`mt-2 text-[15px] font-bold ${palette.text}`}>All Prescriptions Dispensed</Text>
                <Text className={`mt-1 text-[12px] ${palette.textMuted}`}>No pending pharmacy orders.</Text>
              </View>
            ) : (
              <View className="gap-2.5 pb-8">
                {rxList.map((rx) => (
                  <View key={rx.id} className={`rounded-[22px] p-4 shadow-sm ${palette.surface}`}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className={`text-[16px] font-bold ${palette.text}`}>{rx.patient}</Text>
                        <Text className={`text-[11px] ${palette.textMuted}`}>#{rx.id}</Text>
                      </View>
                      <View className="rounded-full bg-amber-500/20 px-2.5 py-0.5">
                        <Text className="text-[10px] font-bold text-amber-600">{rx.status}</Text>
                      </View>
                    </View>

                    <Text className={`mt-1 text-[11px] ${palette.textSoft}`}>Prescribed by: {rx.doctor}</Text>

                    <View className="mt-2.5 rounded-xl bg-gray-500/10 p-3 gap-1">
                      {rx.items.map((item, idx) => (
                        <View key={idx} className="flex-row items-center gap-2">
                          <Ionicons name="checkmark" size={14} color="#10b981" />
                          <Text className={`text-[12px] ${palette.text}`}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      onPress={() => handleDispenseRx(rx.id)}
                      className="mt-3 rounded-xl bg-emerald-600 py-2.5 items-center"
                    >
                      <Text className="text-[12px] font-bold text-white">Dispense Medicines</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Add Stock Modal */}
      <Modal visible={showAddStockModal} transparent animationType="slide" onRequestClose={() => setShowAddStockModal(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className={`rounded-t-[28px] p-5 ${palette.surface}`}>
            <View className="mb-3 flex-row items-center justify-between border-b border-gray-200/20 pb-3">
              <Text className={`text-[17px] font-bold ${palette.text}`}>Add New Medicine Stock</Text>
              <Pressable onPress={() => setShowAddStockModal(false)} className={`rounded-full p-1.5 ${palette.surfaceAlt}`}>
                <Ionicons name="close" size={20} color={palette.textMutedColor} />
              </Pressable>
            </View>

            <View className="gap-3">
              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Medicine Name *</Text>
                <TextInput
                  value={medName}
                  onChangeText={setMedName}
                  placeholder="e.g. Ibuprofen 400mg"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Category</Text>
                  <TextInput
                    value={medCategory}
                    onChangeText={setMedCategory}
                    placeholder="General"
                    placeholderTextColor={palette.textMutedColor}
                    className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Initial Stock Quantity</Text>
                  <TextInput
                    value={medStock}
                    onChangeText={setMedStock}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor={palette.textMutedColor}
                    className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                  />
                </View>
              </View>

              <View>
                <Text className={`mb-1 text-[11px] font-semibold ${palette.textMuted}`}>Unit Price</Text>
                <TextInput
                  value={medPrice}
                  onChangeText={setMedPrice}
                  placeholder="$10.00"
                  placeholderTextColor={palette.textMutedColor}
                  className={`rounded-xl border px-3 py-2.5 text-[13px] ${palette.text} ${palette.border} ${palette.surfaceInset}`}
                />
              </View>
            </View>

            <View className="mt-4 flex-row gap-2">
              <Pressable onPress={() => setShowAddStockModal(false)} className="flex-1 rounded-xl bg-gray-500/15 py-3 items-center">
                <Text className={`text-[13px] font-bold ${palette.text}`}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddStock} className="flex-1 rounded-xl bg-emerald-600 py-3 items-center">
                <Text className="text-[13px] font-bold text-white">Save Medicine</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

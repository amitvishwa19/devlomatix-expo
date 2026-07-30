import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import IosConfirmModal from '~/components/IosConfirmModal';
import { useKabadx } from '~/providers/KabadxProvider';
import { useAppTheme } from '~/theme/AppTheme';

const STATUS_BADGES = {
  PENDING: { label: 'Requested', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', step: 1 },
  ASSIGNED: { label: 'Collector Assigned', color: '#0284c7', bg: 'rgba(2,132,199,0.1)', step: 2 },
  IN_PROGRESS: { label: 'En Route', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', step: 3 },
  COMPLETED: { label: 'Completed', color: '#16a34a', bg: 'rgba(22,163,74,0.1)', step: 4 },
  CANCELLED: { label: 'Cancelled', color: '#dc2626', bg: 'rgba(220,38,38,0.1)', step: 0 },
};

export default function KabadxClientBookingsScreen() {
  const { palette } = useAppTheme();
  const params = useLocalSearchParams();
  const { pickups, addPickup, updatePickupStatus } = useKabadx();

  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [showBookModal, setShowBookModal] = useState(false);
  const [cancelPickupId, setCancelPickupId] = useState(null);

  // Booking Form State
  const [custName, setCustName] = useState('Amit Sharma');
  const [custPhone, setCustPhone] = useState('+91 98712 34567');
  const [custAddress, setCustAddress] = useState('202-10, Rajeshwer Planet, Harni Road, Vadodara');
  const [paperWeight, setPaperWeight] = useState(15);
  const [metalWeight, setMetalWeight] = useState(5);
  const [plasticWeight, setPlasticWeight] = useState(4);
  const [selectedSlot, setSelectedSlot] = useState('Today (02:00 PM - 05:00 PM)');

  const [bookingType, setBookingType] = useState(params?.mode === 'CORPORATE' ? 'CORPORATE' : 'HOUSEHOLD');
  const [gstNo, setGstNo] = useState('24AAACK1234F1Z9');

  useEffect(() => {
    if (params?.category || params?.mode) {
      if (params?.mode) setBookingType(params.mode);
      setShowBookModal(true);
    }
  }, [params]);

  const totalEstKg = Number(paperWeight) + Number(metalWeight) + Number(plasticWeight);
  const estPayout = (Number(paperWeight) * 16) + (Number(metalWeight) * 28) + (Number(plasticWeight) * 22);

  const activeOrders = pickups.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED');
  const pastOrders = pickups.filter((p) => p.status === 'COMPLETED' || p.status === 'CANCELLED');
  const displayedOrders = activeTab === 'ACTIVE' ? activeOrders : pastOrders;

  const handleBookingSubmit = () => {
    if (!custName.trim() || !custAddress.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter name and pickup address.' });
      return;
    }

    addPickup({
      customerName: custName.trim(),
      phone: custPhone.trim(),
      address: custAddress.trim(),
      scrapItems: [
        { category: 'Paper', name: 'Newspaper & Cartons', estWeight: paperWeight, rate: 16 },
        { category: 'Metal', name: 'Iron & Scrap Metal', estWeight: metalWeight, rate: 28 },
        { category: 'Plastic', name: 'Bottles & Hard Plastic', estWeight: plasticWeight, rate: 22 },
      ],
      totalEstWeight: totalEstKg,
      estPayout: estPayout,
      scheduledDate: new Date().toISOString().split('T')[0],
      timeSlot: selectedSlot,
    });

    Toast.show({ type: 'success', text1: 'Doorstep Pickup Requested!', text2: 'We are assigning nearest Kabadi Wala.' });
    setShowBookModal(false);
  };

  return (
    <SafeAreaView edges={['top']} className={`flex-1 ${palette.page}`}>
      <StatusBar style={palette.statusBar} />
      <View className={`flex-1 ${palette.page}`}>
        {/* Header */}
        <View className={`px-4 py-3 border-b flex-row items-center justify-between ${palette.surface} ${palette.border}`}>
          <View>
            <Text className={`text-[18px] font-bold ${palette.text}`}>My Scrap Bookings</Text>
            <Text className={`text-[11px] ${palette.textMuted}`}>Track doorstep pickups & cash history</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowBookModal(true)}
            className="flex-row items-center gap-1 rounded-xl bg-teal-600 px-3.5 py-2 shadow-md">
            <Ionicons name="add" size={16} color="#fff" />
            <Text className="text-[12px] font-extrabold text-white">Book Pickup</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View className="px-4 py-2 flex-row gap-2">
          <TouchableOpacity
            onPress={() => setActiveTab('ACTIVE')}
            className={`flex-1 rounded-xl py-2 items-center border ${
              activeTab === 'ACTIVE' ? 'bg-teal-600 border-teal-600' : `${palette.surface} ${palette.border}`
            }`}>
            <Text className={`text-[12px] font-bold ${activeTab === 'ACTIVE' ? 'text-white' : palette.textColor}`}>
              Active ({activeOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('PAST')}
            className={`flex-1 rounded-xl py-2 items-center border ${
              activeTab === 'PAST' ? 'bg-teal-600 border-teal-600' : `${palette.surface} ${palette.border}`
            }`}>
            <Text className={`text-[12px] font-bold ${activeTab === 'PAST' ? 'text-white' : palette.textColor}`}>
              Past Orders ({pastOrders.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Orders List */}
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
          <View className="gap-3 pt-1">
            {displayedOrders.length === 0 ? (
              <View className={`mt-8 rounded-[24px] p-6 items-center border ${palette.surface} ${palette.border}`}>
                <Ionicons name="car-outline" size={42} color={palette.textMutedColor} />
                <Text className={`mt-3 text-[16px] font-bold ${palette.text}`}>No {activeTab.toLowerCase()} bookings</Text>
                <Text className={`mt-1 text-[12px] text-center ${palette.textSoft}`}>
                  Schedule your first doorstep scrap pickup and get instant cash!
                </Text>
                <TouchableOpacity
                  onPress={() => setShowBookModal(true)}
                  className="mt-4 rounded-xl bg-teal-600 px-4 py-2.5">
                  <Text className="text-[12px] font-bold text-white">Book Scrap Pickup Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              displayedOrders.map((pk) => {
                const badge = STATUS_BADGES[pk.status] || STATUS_BADGES.PENDING;
                return (
                  <View key={pk.id} className={`rounded-[20px] border p-4 shadow-sm ${palette.surface} ${palette.border}`}>
                    {/* Header */}
                    <View className="flex-row items-center justify-between">
                      <Text className={`text-[13px] font-bold ${palette.text}`}>Booking #{pk.id}</Text>
                      <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: badge.bg }}>
                        <Text style={{ color: badge.color, fontSize: 10, fontWeight: '800' }}>{badge.label}</Text>
                      </View>
                    </View>

                    {/* Timeline Step Indicator */}
                    {pk.status !== 'CANCELLED' && pk.status !== 'COMPLETED' ? (
                      <View className="my-3 flex-row items-center justify-between px-2">
                        <View className="items-center">
                          <View className={`h-6 w-6 rounded-full items-center justify-center ${badge.step >= 1 ? 'bg-teal-600' : 'bg-gray-300'}`}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                          <Text className={`mt-1 text-[9px] ${palette.textMuted}`}>Requested</Text>
                        </View>

                        <View className={`h-0.5 flex-1 ${badge.step >= 2 ? 'bg-teal-600' : 'bg-gray-300'}`} />

                        <View className="items-center">
                          <View className={`h-6 w-6 rounded-full items-center justify-center ${badge.step >= 2 ? 'bg-teal-600' : 'bg-gray-300'}`}>
                            <Ionicons name="person" size={12} color="#fff" />
                          </View>
                          <Text className={`mt-1 text-[9px] ${palette.textMuted}`}>Assigned</Text>
                        </View>

                        <View className={`h-0.5 flex-1 ${badge.step >= 3 ? 'bg-teal-600' : 'bg-gray-300'}`} />

                        <View className="items-center">
                          <View className={`h-6 w-6 rounded-full items-center justify-center ${badge.step >= 3 ? 'bg-teal-600' : 'bg-gray-300'}`}>
                            <Ionicons name="car" size={12} color="#fff" />
                          </View>
                          <Text className={`mt-1 text-[9px] ${palette.textMuted}`}>En Route</Text>
                        </View>
                      </View>
                    ) : null}

                    {/* Details */}
                    <View className="rounded-xl p-3 bg-teal-600/10">
                      <View className="flex-row justify-between">
                        <View>
                          <Text className={`text-[10px] ${palette.textMuted}`}>Pickup Slot</Text>
                          <Text className={`text-[12px] font-bold ${palette.text}`}>{pk.timeSlot}</Text>
                        </View>
                        <View className="items-end">
                          <Text className={`text-[10px] ${palette.textMuted}`}>Est. Cash Payout</Text>
                          <Text className="text-[14px] font-extrabold text-teal-600">₹{pk.estPayout}</Text>
                        </View>
                      </View>

                      <View className="mt-2 border-t pt-2 border-teal-500/20">
                        <Text className={`text-[11px] ${palette.textSoft}`}>
                          <Ionicons name="location-outline" size={12} color={palette.textMutedColor} /> {pk.address}
                        </Text>
                      </View>
                    </View>

                    {/* Assigned Collector */}
                    {pk.collectorName ? (
                      <View className="mt-3 flex-row items-center justify-between rounded-xl border p-2.5 border-teal-500/30">
                        <View className="flex-row items-center gap-2">
                          <View className="h-8 w-8 items-center justify-center rounded-full bg-teal-600/20">
                            <Ionicons name="person" size={16} color="#0d9488" />
                          </View>
                          <View>
                            <Text className={`text-[12px] font-bold ${palette.text}`}>{pk.collectorName}</Text>
                            <Text className={`text-[10px] ${palette.textMuted}`}>Assigned Kabadi Wala</Text>
                          </View>
                        </View>

                        <TouchableOpacity className="flex-row items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5">
                          <Ionicons name="call" size={12} color="#fff" />
                          <Text className="text-[11px] font-bold text-white">Call</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    {/* Action Bar */}
                    {pk.status !== 'CANCELLED' && pk.status !== 'COMPLETED' ? (
                      <View className="mt-3 flex-row justify-end">
                        <TouchableOpacity
                          onPress={() => setCancelPickupId(pk.id)}
                          className="rounded-lg border border-red-500/20 px-3 py-1.5">
                          <Text className="text-[11px] font-bold text-red-600">Cancel Request</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Book Pickup Modal */}
        <Modal visible={showBookModal} transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/50">
            <View className={`rounded-t-[32px] p-5 max-h-[90%] ${palette.surface}`}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className={`text-[18px] font-bold ${palette.text}`}>Book Scrap Pickup</Text>
                  <Pressable onPress={() => setShowBookModal(false)}>
                    <Ionicons name="close-circle" size={24} color={palette.textMutedColor} />
                  </Pressable>
                </View>

                {/* Step 1: Items Selection */}
                <Text className={`mb-2 text-[12px] font-bold ${palette.text}`}>1. Estimate Scrap Quantity (kg)</Text>
                
                <View className={`mb-2 rounded-xl border p-3 flex-row items-center justify-between ${palette.surfaceAlt} ${palette.border}`}>
                  <View>
                    <Text className={`text-[13px] font-bold ${palette.text}`}>Paper & Newspapers</Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>₹16 per kg</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity onPress={() => setPaperWeight(Math.max(0, paperWeight - 5))} className="rounded-lg bg-teal-600/20 px-2.5 py-1">
                      <Text className="text-[14px] font-bold text-teal-600">-</Text>
                    </TouchableOpacity>
                    <Text className={`text-[13px] font-bold ${palette.text}`}>{paperWeight} kg</Text>
                    <TouchableOpacity onPress={() => setPaperWeight(paperWeight + 5)} className="rounded-lg bg-teal-600/20 px-2.5 py-1">
                      <Text className="text-[14px] font-bold text-teal-600">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className={`mb-2 rounded-xl border p-3 flex-row items-center justify-between ${palette.surfaceAlt} ${palette.border}`}>
                  <View>
                    <Text className={`text-[13px] font-bold ${palette.text}`}>Iron & Scrap Metal</Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>₹28 per kg</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity onPress={() => setMetalWeight(Math.max(0, metalWeight - 2))} className="rounded-lg bg-teal-600/20 px-2.5 py-1">
                      <Text className="text-[14px] font-bold text-teal-600">-</Text>
                    </TouchableOpacity>
                    <Text className={`text-[13px] font-bold ${palette.text}`}>{metalWeight} kg</Text>
                    <TouchableOpacity onPress={() => setMetalWeight(metalWeight + 2)} className="rounded-lg bg-teal-600/20 px-2.5 py-1">
                      <Text className="text-[14px] font-bold text-teal-600">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className={`mb-3 rounded-xl border p-3 flex-row items-center justify-between ${palette.surfaceAlt} ${palette.border}`}>
                  <View>
                    <Text className={`text-[13px] font-bold ${palette.text}`}>Plastics & Bottles</Text>
                    <Text className={`text-[10px] ${palette.textMuted}`}>₹22 per kg</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity onPress={() => setPlasticWeight(Math.max(0, plasticWeight - 2))} className="rounded-lg bg-teal-600/20 px-2.5 py-1">
                      <Text className="text-[14px] font-bold text-teal-600">-</Text>
                    </TouchableOpacity>
                    <Text className={`text-[13px] font-bold ${palette.text}`}>{plasticWeight} kg</Text>
                    <TouchableOpacity onPress={() => setPlasticWeight(plasticWeight + 2)} className="rounded-lg bg-teal-600/20 px-2.5 py-1">
                      <Text className="text-[14px] font-bold text-teal-600">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Step 2: Preferred Slot */}
                <Text className={`mb-2 text-[12px] font-bold ${palette.text}`}>2. Select Pickup Time Slot</Text>
                <View className="mb-3 gap-1.5">
                  {[
                    'Today (10:00 AM - 01:00 PM)',
                    'Today (02:00 PM - 05:00 PM)',
                    'Tomorrow Morning (09:00 AM - 12:00 PM)'
                  ].map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => setSelectedSlot(slot)}
                      className={`rounded-xl p-3 border ${
                        selectedSlot === slot ? 'bg-teal-600/10 border-teal-600' : `${palette.surfaceAlt} ${palette.border}`
                      }`}>
                      <Text className={`text-[12px] font-bold ${selectedSlot === slot ? 'text-teal-600' : palette.textColor}`}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Step 3: Address */}
                <Text className={`mb-1 text-[12px] font-bold ${palette.text}`}>3. Your Address</Text>
                <TextInput
                  className={`mb-3 rounded-xl border px-3 py-2 text-[12px] ${palette.page} ${palette.border}`}
                  style={{ color: palette.textColor }}
                  multiline
                  numberOfLines={2}
                  value={custAddress}
                  onChangeText={setCustAddress}
                />

                {/* Summary Box */}
                <View className="mb-4 rounded-2xl p-3 bg-teal-600/15 flex-row items-center justify-between">
                  <View>
                    <Text className={`text-[11px] ${palette.textMuted}`}>Total Est. Weight</Text>
                    <Text className={`text-[14px] font-bold ${palette.text}`}>{totalEstKg} kg</Text>
                  </View>
                  <View className="items-end">
                    <Text className={`text-[11px] ${palette.textMuted}`}>Est. Cash Payout</Text>
                    <Text className="text-[20px] font-black text-teal-600">₹{estPayout}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleBookingSubmit}
                  className="rounded-2xl bg-teal-600 py-3.5 items-center shadow-lg">
                  <Text className="text-[14px] font-bold text-white">Confirm Doorstep Pickup</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <IosConfirmModal
          visible={!!cancelPickupId}
          onClose={() => setCancelPickupId(null)}
          onConfirm={() => {
            updatePickupStatus(cancelPickupId, 'CANCELLED');
            Toast.show({ type: 'success', text1: 'Request Cancelled' });
            setCancelPickupId(null);
          }}
          title="Cancel Pickup Request?"
          message="Are you sure you want to cancel your doorstep pickup request?"
          confirmText="Yes, Cancel"
          cancelText="Keep Booking"
          isDestructive={true}
        />
      </View>
    </SafeAreaView>
  );
}

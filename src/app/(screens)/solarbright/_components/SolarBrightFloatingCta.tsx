import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Modal, Pressable, Text, View } from 'react-native';

import { vars } from '../_lib/constants';
import { useAppTheme } from '~/theme/AppTheme';

const whatsappNumber = vars.whats_app_number.replace(/\D/g, '');

export default function SolarBrightFloatingCta() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { palette } = useAppTheme();
  const actions = [
    {
      label: 'WhatsApp',
      icon: 'whatsapp' as const,
      onPress: () => Linking.openURL(`https://wa.me/${whatsappNumber}`),
    },
    {
      label: 'Energy Explorer',
      icon: 'bolt' as const,
      onPress: () => router.push('/solarbright/EnergyExplorer'),
    },
    {
      label: 'Dummy Action',
      icon: 'circle-o' as const,
      onPress: () => {},
    },
  ];

  return (
    <>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-slate-950/20" onPress={() => setOpen(false)}>
          <View
            className={`w-56 rounded-3xl p-3 shadow-xl ${palette.surface} ${palette.shadow}`}
            style={{ position: 'absolute', right: 20, bottom: 96 }}>
            {actions.map((action, index) => (
              <Pressable
                key={action.label}
                className={`flex-row items-center rounded-2xl px-3 py-3 ${index < actions.length - 1 ? 'mb-2' : ''}`}
                onPress={() => {
                  setOpen(false);
                  action.onPress();
                }}>
                <View className={`mr-3 h-9 w-9 items-center justify-center rounded-full ${palette.iconCard}`}>
                  <FontAwesome name={action.icon} size={18} color={palette.iconColor} />
                </View>
                <Text className={`text-sm font-bold ${palette.text}`}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', right: 20, bottom: 20, zIndex: 1000 }}>
        <Pressable
          className="h-16 w-16 items-center justify-center rounded-full bg-amber-500 shadow-xl shadow-amber-900/20"
          onPress={() => setOpen(true)}>
          <FontAwesome name="plus" size={24} color="#ffffff" />
        </Pressable>
      </View>
    </>
  );
}

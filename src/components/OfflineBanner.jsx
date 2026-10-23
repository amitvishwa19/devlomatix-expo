import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '~/contexts/NetworkContext';
import { useCrmTheme } from '~/utils/crm/colors';

export default function OfflineBanner() {
  const { isOnline } = useNetwork();
  const insets = useSafeAreaInsets();
  const { colors } = useCrmTheme();

  if (isOnline) return null;

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 flex-row items-center justify-center gap-x-2 px-3 py-2"
      style={{
        top: insets.top,
        zIndex: 500,
        elevation: 30,
        backgroundColor: '#b45309',
      }}
    >
      <Ionicons name="cloud-offline-outline" size={14} color="#ffffff" />
      <Text className="text-[11px] font-bold text-white">
        You're offline — changes will sync when you reconnect
      </Text>
    </View>
  );
}

import { Stack } from 'expo-router';
import { CrystalAuraProvider } from '~/providers/CrystalAuraProvider';

export default function CrystalAuraRootLayout() {
  return (
    <CrystalAuraProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </CrystalAuraProvider>
  );
}

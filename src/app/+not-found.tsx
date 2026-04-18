import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

export default function NotFoundScreen() {
  const { palette } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className={`flex-1 items-center justify-center px-6 ${palette.page}`}>
        <Text className={`text-center text-3xl font-bold ${palette.text}`}>This screen doesn&apos;t exist.</Text>

        <Link href="/" className="mt-4 rounded-full bg-teal-700 px-5 py-3">
          <Text className="text-sm font-bold text-slate-50">Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

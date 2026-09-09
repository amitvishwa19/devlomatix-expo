import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

export default function BackButton() {
  const router = useRouter();
  const { palette } = useAppTheme();

  return (
    <Pressable
      className={`mb-4 h-11 w-11 items-center justify-center rounded-full shadow-xl ${palette.surface} ${palette.shadow}`}
      onPress={() => router.back()}>
      <FontAwesome name="chevron-left" size={18} color={palette.mode === 'dark' ? '#f8fafc' : '#0f172a'} />
    </Pressable>);

}
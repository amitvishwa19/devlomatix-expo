
import { Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';






export default function SolarBrightSection({ title, children }) {
  const { palette } = useAppTheme();

  return (
    <View className={`mb-4 rounded-3xl p-5 ${palette.surface}`}>
      <Text className={`text-xl font-bold ${palette.text}`}>{title}</Text>
      {children}
    </View>);

}
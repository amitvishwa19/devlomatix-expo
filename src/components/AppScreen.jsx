import { ImageBackground, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

export default function AppScreen({ children, style, statusBarStyle }) {
  const { palette, isDark } = useAppTheme();
  return (
    <ImageBackground
      source={palette.pageBackground}
      style={{ flex: 1, backgroundColor: palette.colors.page }}
      imageStyle={{ opacity: isDark ? 0.2 : 0.35 }}
      className="flex-1"
      resizeMode="cover"
    >
      <StatusBar style={statusBarStyle || palette.statusBar} />
      <SafeAreaView className={`flex-1 ${style || ''}`}>
        {children}
      </SafeAreaView>
    </ImageBackground>
  );
}

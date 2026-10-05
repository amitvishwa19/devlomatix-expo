import { ImageBackground, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '~/theme/AppTheme';

export default function AppScreen({
  children,
  style,
  statusBarStyle,
  imageOpacity,
  imageStyle,
  edges
}) {
  const { palette, isDark } = useAppTheme();
  
  // Provide subtle transparency so the background is soft and not overpowering
  const defaultOpacity = isDark ? 0.35 : 0.6;
  const resolvedOpacity = typeof imageOpacity === 'number' ? imageOpacity : defaultOpacity;

  return (
    <View style={{ flex: 1, backgroundColor: palette.colors.page }}>
      <ImageBackground
        source={palette.pageBackground}
        className="flex-1"
        resizeMode="cover"
        imageStyle={[{ opacity: resolvedOpacity }, imageStyle]}
      >
        <StatusBar style={statusBarStyle || palette.statusBar} />
        <SafeAreaView edges={edges} className={`flex-1 ${style || ''}`}>
          {children}
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}


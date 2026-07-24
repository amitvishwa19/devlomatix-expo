import { ImageBackground, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pageBackground } from '~/utils/constants';

export default function AppScreen({ children, style, statusBarStyle = 'dark' }) {
  return (
    <ImageBackground source={pageBackground} className="flex-1" resizeMode="cover">
      <StatusBar style={statusBarStyle} />
      <SafeAreaView className={`flex-1 ${style || ''}`}>
        {children}
      </SafeAreaView>
    </ImageBackground>
  );
}

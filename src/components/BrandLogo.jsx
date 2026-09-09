import { Image } from 'react-native';

<<<<<<< HEAD
import darkLogo from '../assets/images/logos/dark_logo.png';
import lightLogo from '../assets/images/logos/light_logo.png';
import { useAppTheme } from '~/theme/AppTheme';
=======
import logo from '../assets/images/logos/krishimitra-logo.png';
>>>>>>> 4d55017624c67ee4f061413f722c5826a7077a6e

const variantDimensions = {
  auth: { width: 220, height: 32 },
  home: { width: 140, height: 22 },
  profile: { width: 140, height: 22 },
  compact: { width: 100, height: 16 }
};

export default function BrandLogo({
  size,
  width,
  height,
  variant = 'auth',
  theme,
  style,
  className = '',
  resizeMode = 'contain'
}) {
  let isDark = false;
  try {
    const themeContext = useAppTheme();
    isDark = themeContext?.isDark ?? false;
  } catch {
    isDark = false;
  }

<<<<<<< HEAD
  const activeTheme = theme ?? (isDark ? 'dark' : 'light');
  const logoSource = activeTheme === 'dark' ? darkLogo : lightLogo;
=======
  return (
    <View
      className="items-center justify-center bg-white shadow-lg shadow-slate-900/10"
      style={variantShellStyles[variant]}>
      <Image
        source={logo}
        className="shrink-0"
        style={variantImageStyles[variant]}
        resizeMode="contain" />

    </View>);
>>>>>>> 4d55017624c67ee4f061413f722c5826a7077a6e

  const defaultDimensions = variantDimensions[variant] ?? variantDimensions.auth;
  const targetWidth = width ?? size ?? defaultDimensions.width;
  const targetHeight = height ?? (size !== undefined || width !== undefined ? Math.round(targetWidth * (100 / 800)) : defaultDimensions.height);

  return (
    <Image
      source={logoSource}
      className={`shrink-0 ${className}`}
      style={[{ width: targetWidth, height: targetHeight }, style]}
      resizeMode={resizeMode}
    />
  );
}
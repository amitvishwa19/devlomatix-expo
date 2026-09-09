import { Image } from 'react-native';

import darkLogo from '../assets/images/logos/dark_logo.png';
import lightLogo from '../assets/images/logos/light_logo.png';
import { useAppTheme } from '~/theme/AppTheme';

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

  const activeTheme = theme ?? (isDark ? 'dark' : 'light');
  const logoSource = activeTheme === 'dark' ? darkLogo : lightLogo;

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
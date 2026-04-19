import { Image, View } from 'react-native';

import logo from '../assets/images/logos/devlomatix_logo.png';








const variantShellStyles = {
  auth: { width: 156, height: 156, borderRadius: 44 },
  home: { width: 72, height: 72, borderRadius: 22 },
  profile: { width: 72, height: 72, borderRadius: 22 }
};

const variantImageStyles = {
  auth: { width: 68, height: 68 },
  home: { width: 38, height: 38 },
  profile: { width: 38, height: 38 }
};

export default function BrandLogo({ size, variant = 'auth' }) {
  if (size !== undefined) {
    return (
      <Image
        source={logo}
        className="shrink-0"
        style={{ width: size, height: size }}
        resizeMode="contain" />);


  }

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

}
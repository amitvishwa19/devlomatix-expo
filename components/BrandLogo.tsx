import { Image, View } from 'react-native';

type BrandLogoProps = {
  size?: number;
  shellSize?: number;
};

export default function BrandLogo({
  size = 68,
  shellSize = 156,
}: BrandLogoProps) {
  return (
    <View
      className="items-center justify-center bg-white shadow-lg shadow-slate-900/10"
      style={{ width: shellSize, height: shellSize, borderRadius: shellSize * 0.28 }}>
      <Image
        source={require('../assets/images/logos/devlomatix_logo.png')}
        className="h-full w-full"
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

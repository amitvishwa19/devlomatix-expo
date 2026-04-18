import { Image, View } from 'react-native';

const logoVariants = {
  auth: {
    shell: 'h-28 w-28 rounded-[31px]',
    image: 'h-[92px] w-[92px]',
  },
  home: {
    shell: 'h-[72px] w-[72px] rounded-[20px]',
    image: 'h-[54px] w-[54px]',
  },
  profile: {
    shell: 'h-[68px] w-[68px] rounded-[19px]',
    image: 'h-[50px] w-[50px]',
  },
  default: {
    shell: 'h-24 w-24 rounded-[27px]',
    image: 'h-[68px] w-[68px]',
  },
} as const;

type BrandLogoProps = {
  variant?: keyof typeof logoVariants;
};

export default function BrandLogo({ variant = 'default' }: BrandLogoProps) {
  const selectedVariant = logoVariants[variant];

  return (
    <View
      className={`items-center justify-center bg-white shadow-lg shadow-slate-900/10 ${selectedVariant.shell}`}>
      <Image
        source={require('../assets/images/logos/devlomatix_logo.png')}
        className={selectedVariant.image}
        resizeMode="contain"
      />
    </View>
  );
}

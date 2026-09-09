import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '~/theme/AppTheme';

export default function CrystalAuraCard({ title, description, onPress, children, style }) {
  const { palette } = useAppTheme();
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      className="mb-4 rounded-[24px] p-5"
      style={[{ backgroundColor: palette.colors.surface }, style]}>
      {title ? (
        <Text className={`text-[18px] font-bold ${palette.text}`}>{title}</Text>
      ) : null}
      {description ? (
        <Text className={`mt-2 text-[14px] leading-6 ${palette.textSoft}`}>{description}</Text>
      ) : null}
      {children}
    </Container>
  );
}

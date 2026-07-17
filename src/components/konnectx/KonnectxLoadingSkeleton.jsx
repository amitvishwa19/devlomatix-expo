import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import { useAppTheme } from '~/theme/AppTheme';

function SkeletonBlock({ width, height, style }) {
  const { palette, isDark } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const skeletonBgColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <Animated.View
      style={[{ width: width ?? '100%', height: height ?? 20, borderRadius: 8, backgroundColor: skeletonBgColor, opacity }, style]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View className="mb-4 rounded-[24px] p-5" style={{ backgroundColor: 'transparent' }}>
      <SkeletonBlock width="60%" height={22} />
      <SkeletonBlock width="100%" height={16} style={{ marginTop: 12 }} />
      <SkeletonBlock width="80%" height={16} style={{ marginTop: 6 }} />
    </View>
  );
}

export function SkeletonStatRow() {
  return (
    <View className="mb-4 flex-row gap-2.5">
      <SkeletonBlock style={{ flex: 1, height: 90, borderRadius: 22 }} />
      <SkeletonBlock style={{ flex: 1, height: 90, borderRadius: 22 }} />
      <SkeletonBlock style={{ flex: 1, height: 90, borderRadius: 22 }} />
    </View>
  );
}

export default SkeletonBlock;

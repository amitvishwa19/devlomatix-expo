import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import { useAppTheme } from '~/theme/AppTheme';

/**
 * Pulsing skeleton loader shown while a conversation's messages are loading.
 * Renders WhatsApp-style placeholder bubbles (incoming left / outgoing right).
 */
export default function ChatSkeleton() {
  const { isDark } = useAppTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true })
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const block = (w, h, rounded, invert) => {
    const bg = isDark
      ? invert ? '#005c4b' : '#202c33'
      : invert ? '#d9fdd3' : '#eef0ee';
    return (
      <View style={{
        width: w, height: h, borderRadius: rounded,
        backgroundColor: bg, marginTop: 5, marginLeft: invert ? 'auto' : 0
      }} />
    );
  };

  return (
    <Animated.View className="px-3 py-4" style={{ opacity: pulse, gap: 14 }}>
      <View className="self-start max-w-[85%] rounded-xl rounded-tl-none px-3 py-2"
        style={{ backgroundColor: isDark ? '#202c33' : '#eef0ee' }}>
        {block('70%', 10, 6, false)}
        {block('45%', 10, 6, false)}
      </View>
      <View className="self-end max-w-[85%] rounded-xl rounded-tr-none px-3 py-2"
        style={{ backgroundColor: isDark ? '#005c4b' : '#d9fdd3' }}>
        {block('60%', 10, 6, true)}
      </View>
      <View className="self-start max-w-[85%] rounded-xl rounded-tl-none px-3 py-2"
        style={{ backgroundColor: isDark ? '#202c33' : '#eef0ee' }}>
        {block('85%', 10, 6, false)}
        {block('55%', 10, 6, false)}
        {block('30%', 10, 6, false)}
      </View>
      <View className="self-end max-w-[85%] rounded-xl rounded-tr-none px-3 py-2"
        style={{ backgroundColor: isDark ? '#005c4b' : '#d9fdd3' }}>
        {block('75%', 10, 6, true)}
        {block('30%', 10, 6, true)}
      </View>
    </Animated.View>
  );
}
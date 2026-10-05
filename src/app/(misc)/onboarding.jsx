import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ob1 from '~/assets/images/onboarding/ob-1.png';
import ob2 from '~/assets/images/onboarding/ob-2.png';
import ob3 from '~/assets/images/onboarding/ob-3.png';
import { getSession } from '~/utils/authStorage';
import { completeOnboarding } from '~/utils/onboardingStorage';

const SLIDES = [
  {
    image: ob1,
    title: 'All your work, one place',
    subtitle:
      'Track projects, tasks and conversations without jumping between a dozen tools.'
  },
  {
    image: ob2,
    title: 'Stay in sync with your team',
    subtitle:
      'Messages, campaigns and boards update in real time across every device you use.'
  },
  {
    image: ob3,
    title: 'Ready when you are',
    subtitle:
      'Pick up exactly where you left off and get straight back to work.'
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const isLastSlide = index === SLIDES.length - 1;

  const finish = useCallback(async () => {
    await completeOnboarding();

    try {
      const session = await getSession();
      router.replace(session?.isLoggedIn ? '/(tabs)/home' : '/(auth)/login');
    } catch {
      router.replace('/(auth)/login');
    }
  }, [router]);

  const goNext = useCallback(() => {
    if (isLastSlide) {
      finish();
      return;
    }

    const next = index + 1;
    setIndex(next);
    listRef.current?.scrollToOffset({
      offset: next * width,
      animated: true
    });
  }, [finish, index, isLastSlide, width]);

  const handleScrollEnd = useCallback((event) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(next);
  }, [width]);

  const renderItem = useCallback(
    ({ item }) => (
      <View style={{ width }}>
        <Image
          source={item.image}
          style={{ width, height }}
          resizeMode="cover"
        />
      </View>
    ),
    [width, height]
  );

  return (
    <View className="flex-1 bg-slate-950">
      <StatusBar hidden translucent backgroundColor="transparent" />

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.title}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
      />

      <View
        pointerEvents="box-none"
        className="absolute inset-0 justify-between"
      >
        <View className="flex-row justify-end" style={{ paddingTop: insets.top + 8 }}>
          <TouchableOpacity onPress={finish} hitSlop={12} className="px-4 py-2 rounded-full">
            <Text className="text-[13px] font-semibold text-white/80">Skip</Text>
          </TouchableOpacity>
        </View>

        <View
          className="relative px-6 pb-4"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <View className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

          <View className="relative pt-32">
            <Text className="text-[26px] font-bold text-white">
              {SLIDES[index].title}
            </Text>
            <Text className="text-[14px] leading-5 text-slate-300 mt-1.5">
              {SLIDES[index].subtitle}
            </Text>

            <View className="flex-row items-center justify-between mt-5">
              <View className="flex-row items-center gap-1.5">
                {SLIDES.map((slide, dotIndex) => (
                  <View
                    key={slide.title}
                    className={
                      dotIndex === index
                        ? 'w-6 h-1.5 rounded-full bg-white'
                        : 'w-1.5 h-1.5 rounded-full bg-white/35'
                    }
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={goNext}
                activeOpacity={0.85}
                className="h-11 px-6 rounded-full items-center justify-center bg-teal-500"
              >
                <Text className="text-[14px] font-bold text-slate-950">
                  {isLastSlide ? 'Get Started' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

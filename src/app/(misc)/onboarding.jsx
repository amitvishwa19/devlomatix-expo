import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
    Animated,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSession } from '~/utils/authStorage';

const ONBOARDING_SLIDES = [
    {
        id: 'slide-1',
        tag: 'AGROHOMEOPATHY SOLUTIONS',
        title: 'Welcome to KrishiMitra',
        subtitle:
            'Empowering farmers with natural, chemical-free homeopathic remedies for sustainable and eco-friendly agriculture.',
        image: require('~/assets/images/onboarding/splash-1.png'),
        accentColor: '#10b981',
        badgeBg: 'rgba(16, 185, 129, 0.25)',
        badgeBorder: 'rgba(52, 211, 153, 0.4)',
        badgeText: '#34d399',
        icon: 'leaf-outline',
    },
    {
        id: 'slide-2',
        tag: 'NATURAL CROP HEALING',
        title: 'Holistic Crop Protection & Immunity',
        subtitle:
            'Safeguard crops against pests, fungal infections, and viral diseases without toxic pesticides or chemical residue.',
        image: require('~/assets/images/onboarding/splash-2.png'),
        accentColor: '#059669',
        badgeBg: 'rgba(5, 150, 105, 0.25)',
        badgeBorder: 'rgba(16, 185, 129, 0.4)',
        badgeText: '#6ee7b7',
        icon: 'shield-checkmark-outline',
    },
    {
        id: 'slide-3',
        tag: 'SOIL HEALTH & HARVEST',
        title: 'Rejuvenate Soil & Boost Harvest',
        subtitle:
            'Enrich soil biology, accelerate root development, and maximize organic crop yield with tailored homeopathic dosages.',
        image: require('~/assets/images/onboarding/splash-3.png'),
        accentColor: '#047857',
        badgeBg: 'rgba(4, 120, 87, 0.25)',
        badgeBorder: 'rgba(52, 211, 153, 0.4)',
        badgeText: '#a7f3d0',
        icon: 'flower-outline',
    },
];

export default function AppOnboardingScreen() {
    const router = useRouter();
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = async () => {
        if (currentIndex < ONBOARDING_SLIDES.length - 1) {
            const nextIndex = currentIndex + 1;
            scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
            setCurrentIndex(nextIndex);
        } else {
            await finishOnboarding();
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            scrollViewRef.current?.scrollTo({ x: prevIndex * SCREEN_WIDTH, animated: true });
            setCurrentIndex(prevIndex);
        }
    };

    const finishOnboarding = async () => {
        try {
            const session = await getSession();
            if (session?.isLoggedIn) {
                router.replace('/(tabs)/home');
            } else {
                router.replace('/(auth)/login');
            }
        } catch {
            router.replace('/(auth)/login');
        }
    };

    const currentSlide = ONBOARDING_SLIDES[currentIndex];
    const isLast = currentIndex === ONBOARDING_SLIDES.length - 1;

    return (
        <View style={[styles.container, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }]}>
            <StatusBar style="light" translucent backgroundColor="transparent" />

            {/* Horizontal Paging Carousel */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                scrollEventThrottle={16}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: false,
                    listener: (event) => {
                        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                        if (slideIndex >= 0 && slideIndex < ONBOARDING_SLIDES.length) {
                            setCurrentIndex(slideIndex);
                        }
                    },
                })}
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                contentContainerStyle={{ width: SCREEN_WIDTH * ONBOARDING_SLIDES.length, height: SCREEN_HEIGHT }}
            >
                {ONBOARDING_SLIDES.map((slide) => (
                    <View
                        key={slide.id}
                        style={{
                            width: SCREEN_WIDTH,
                            height: SCREEN_HEIGHT,
                            overflow: 'hidden',
                            backgroundColor: '#0a0d1a',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Contained image to prevent any clipping/overflow */}
                        <Image
                            source={slide.image}
                            style={{
                                width: SCREEN_WIDTH,
                                height: SCREEN_HEIGHT,
                            }}
                            resizeMode="contain"
                        />
                        {/* Dark scrim gradient to blend with background and enhance contrast */}
                        <View
                            pointerEvents="none"
                            style={[
                                StyleSheet.absoluteFillObject,
                                { backgroundColor: 'rgba(0, 0, 0, 0.25)' },
                            ]}
                        />
                    </View>
                ))}
            </ScrollView>

            {/* Floating Top Bar */}
            <SafeAreaView
                edges={['top']}
                pointerEvents="box-none"
                style={styles.topBar}
            >
                <View className="flex-row items-center justify-between px-5 pt-2" pointerEvents="box-none">
                    {currentIndex > 0 ? (
                        <TouchableOpacity
                            onPress={handleBack}
                            activeOpacity={0.8}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            className="h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50"
                        >
                            <Ionicons name="arrow-back" size={18} color="#ffffff" />
                        </TouchableOpacity>
                    ) : (
                        <View className="h-10 w-10" />
                    )}

                    <Pressable
                        onPress={finishOnboarding}
                        className="rounded-full border border-white/20 bg-black/50 px-4 py-2"
                    >
                        <Text className="text-[12px] font-bold text-white/90">Skip</Text>
                    </Pressable>
                </View>
            </SafeAreaView>

            {/* Floating Bottom Card */}
            <SafeAreaView
                edges={['bottom']}
                pointerEvents="box-none"
                style={styles.bottomBar}
            >
                <View
                    className="mx-4 mb-2 rounded-[24px] border border-white/10 p-5 shadow-2xl bg-black/60"

                >
                    {/* Tag Badge */}
                    <View
                        className="mb-2.5 self-start flex-row items-center gap-1.5 rounded-full border px-3 py-1"
                        style={{
                            backgroundColor: currentSlide.badgeBg,
                            borderColor: currentSlide.badgeBorder,
                        }}
                    >
                        <Ionicons name={currentSlide.icon} size={12} color={currentSlide.badgeText} />
                        <Text
                            className="text-[10px] font-black tracking-wider uppercase"
                            style={{ color: currentSlide.badgeText }}
                        >
                            {currentSlide.tag}
                        </Text>
                    </View>

                    {/* Title */}
                    <Text className="text-[20px] font-black leading-6 text-white">
                        {currentSlide.title}
                    </Text>

                    {/* Subtitle */}
                    <Text className="mt-2 text-[12.5px] leading-4 text-slate-300">
                        {currentSlide.subtitle}
                    </Text>

                    {/* Pagination Indicators */}
                    <View className="my-4 flex-row items-center justify-center gap-2">
                        {ONBOARDING_SLIDES.map((slide, i) => (
                            <View
                                key={slide.id}
                                className="h-1.5 rounded-full transition-all"
                                style={{
                                    width: currentIndex === i ? 24 : 6,
                                    backgroundColor:
                                        currentIndex === i ? currentSlide.accentColor : 'rgba(255,255,255,0.25)',
                                }}
                            />
                        ))}
                    </View>

                    {/* Action CTA Button */}
                    <TouchableOpacity
                        onPress={handleNext}
                        activeOpacity={0.85}
                        className="h-12 flex-row items-center justify-center gap-2 rounded-xl shadow-lg"
                        style={{ backgroundColor: currentSlide.accentColor }}
                    >
                        <Text className="text-[14px] font-extrabold text-white">
                            {isLast ? 'Get Started 🚀' : 'Continue'}
                        </Text>
                        <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0d1a',
        overflow: 'hidden',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
});
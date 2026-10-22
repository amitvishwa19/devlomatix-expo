import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppScreen from '~/components/AppScreen';
import BrandLogo from '~/components/BrandLogo';
import { useAppTheme } from '~/theme/AppTheme';
import { getSession } from '~/utils/authStorage';
import { completeOnboarding } from '~/utils/onboardingStorage';

const SLIDES = [
  {
    id: 'pipeline',
    badge: 'REVENUE COMMAND',
    badgeColor: '#2563eb',
    badgeBg: 'rgba(37, 99, 235, 0.12)',
    title: 'Pipeline Velocity\nat Enterprise Scale',
    subtitle:
      'Track high-stakes B2B deals, monitor stage probability, and forecast quarterly revenue with real-time accuracy.',
    previewType: 'pipeline',
  },
  {
    id: 'copilot',
    badge: 'FLOWGENIX AI COPILOT',
    badgeColor: '#7c3aed',
    badgeBg: 'rgba(124, 58, 237, 0.12)',
    title: 'Intelligent AI That\nCloses Stalled Deals',
    subtitle:
      'Real-time conversation intelligence, AI-generated WhatsApp proposals, automated follow-up drafts, and deal revival.',
    previewType: 'copilot',
  },
  {
    id: 'comms',
    badge: 'VOIP & MULTI-CHANNEL',
    badgeColor: '#059669',
    badgeBg: 'rgba(5, 150, 105, 0.12)',
    title: 'HD In-App Calls &\nUnified Messaging',
    subtitle:
      'Seamless WebRTC audio/video calling, official Meta WhatsApp Cloud API integration, and enterprise shared mailbox.',
    previewType: 'comms',
  },
  {
    id: 'operations',
    badge: 'FIELD DCR & BILLING',
    badgeColor: '#d97706',
    badgeBg: 'rgba(217, 119, 6, 0.12)',
    title: 'Field DCR, Quotes &\nExecutive Analytics',
    subtitle:
      'GPS-verified Daily Call Records, instant branded PDF quotations, and leaderboards that keep your field reps winning.',
    previewType: 'operations',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDark } = useAppTheme();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const isLastSlide = index === SLIDES.length - 1;

  // Theme tokens
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subtitleColor = isDark ? '#94a3b8' : '#475569';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.90)' : 'rgba(255, 255, 255, 0.96)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
  const subCardBg = isDark ? 'rgba(30, 41, 59, 0.70)' : '#f8fafc';
  const orb1 = isDark ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.08)';
  const orb2 = isDark ? 'rgba(124, 58, 237, 0.14)' : 'rgba(124, 58, 237, 0.06)';

  const finish = useCallback(async () => {
    await completeOnboarding();
    try {
      const session = await getSession();
      router.replace(session?.isLoggedIn ? '/(tabs)' : '/(auth)/login');
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
      animated: true,
    });
  }, [finish, index, isLastSlide, width]);

  const handleScrollEnd = useCallback(
    (event) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      setIndex(next);
    },
    [width]
  );

  /* Render Interactive Mockup Previews */
  const renderPreviewCard = (type) => {
    switch (type) {
      case 'pipeline':
        return (
          <View
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderWidth: 1,
              borderRadius: 20,
              padding: 16,
              shadowColor: '#1d4ed8',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: isDark ? 0.35 : 0.08,
              shadowRadius: 20,
              elevation: 8,
            }}>
            {/* Header info */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b', letterSpacing: 0.5 }}>
                  ACTIVE PIPELINE
                </Text>
              </View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#10b981' }}>+24% Win Rate</Text>
              </View>
            </View>

            {/* Deal Card 1 */}
            <View style={{ backgroundColor: subCardBg, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: cardBorder }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: titleColor }}>
                    Enterprise Cloud Migration
                  </Text>
                  <Text style={{ fontSize: 11, color: subtitleColor, marginTop: 2 }}>
                    Acme Aerospace Corp • Q4
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#2563eb' }}>
                  $140,000
                </Text>
              </View>

              <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', overflow: 'hidden' }}>
                  <View style={{ width: '85%', height: '100%', backgroundColor: '#2563eb', borderRadius: 3 }} />
                </View>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#2563eb' }}>85%</Text>
              </View>
            </View>

            {/* Deal Card 2 */}
            <View style={{ backgroundColor: subCardBg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: cardBorder }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: titleColor }}>
                    Omnichannel Support Platform
                  </Text>
                  <Text style={{ fontSize: 11, color: subtitleColor, marginTop: 2 }}>
                    Nova Financial • Tier 1
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#10b981' }}>
                  $85,000
                </Text>
              </View>
            </View>

            {/* Metrics footer */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: cardBorder }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: subtitleColor }}>Weighted Total: $1.24M</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563eb' }}>48 Open Deals →</Text>
            </View>
          </View>
        );

      case 'copilot':
        return (
          <View
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderWidth: 1,
              borderRadius: 20,
              padding: 16,
              shadowColor: '#7c3aed',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: isDark ? 0.35 : 0.08,
              shadowRadius: 20,
              elevation: 8,
            }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="sparkles" size={16} color="#8b5cf6" />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#8b5cf6', letterSpacing: 0.5 }}>
                  FLOWGENIX AI AGENT
                </Text>
              </View>
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#8b5cf6' }}>ONLINE</Text>
              </View>
            </View>

            {/* AI Insight Box */}
            <View style={{ backgroundColor: subCardBg, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: cardBorder }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Feather name="zap" size={12} color="#f59e0b" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#f59e0b' }}>
                  Stalled Deal Recovery Opportunity
                </Text>
              </View>
              <Text style={{ fontSize: 12, lineHeight: 18, color: titleColor }}>
                "Apex Retail hasn't responded in 12 days. Their budget cycle closes Friday. Recommended: send the 10% prepayment waiver draft."
              </Text>
            </View>

            {/* Quick Action Pill */}
            <View style={{ backgroundColor: 'rgba(124, 58, 237, 0.10)', borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.25)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Ionicons name="chatbubble-ellipses" size={15} color="#8b5cf6" />
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: titleColor }}>
                  Send WhatsApp Revival Pitch
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color="#8b5cf6" />
            </View>

            {/* Sentiment Meter */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: cardBorder }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: subtitleColor }}>Lead Buying Intent</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>High (88%) ★</Text>
            </View>
          </View>
        );

      case 'comms':
        return (
          <View
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderWidth: 1,
              borderRadius: 20,
              padding: 16,
              shadowColor: '#059669',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: isDark ? 0.35 : 0.08,
              shadowRadius: 20,
              elevation: 8,
            }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="call" size={14} color="#10b981" />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#10b981', letterSpacing: 0.5 }}>
                  LIVE WEBRTC VOIP CALL
                </Text>
              </View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: subtitleColor }}>04:18 MIN</Text>
            </View>

            {/* Caller Row */}
            <View style={{ backgroundColor: subCardBg, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: cardBorder, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#ffffff' }}>SJ</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: titleColor }}>Sarah Jenkins</Text>
                <Text style={{ fontSize: 11, color: subtitleColor }}>VP Operations • Horizon Dynamics</Text>
              </View>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(16, 185, 129, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="volume-2" size={15} color="#10b981" />
              </View>
            </View>

            {/* Omnichannel integrations row */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(37, 211, 102, 0.10)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(37, 211, 102, 0.25)', alignItems: 'center' }}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: titleColor, marginTop: 4 }}>WhatsApp Cloud</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(59, 130, 246, 0.10)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.25)', alignItems: 'center' }}>
                <Ionicons name="mail" size={16} color="#3b82f6" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: titleColor, marginTop: 4 }}>Shared Mailbox</Text>
              </View>
            </View>
          </View>
        );

      case 'operations':
        return (
          <View
            style={{
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderWidth: 1,
              borderRadius: 20,
              padding: 16,
              shadowColor: '#d97706',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: isDark ? 0.35 : 0.08,
              shadowRadius: 20,
              elevation: 8,
            }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="receipt" size={14} color="#f59e0b" />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#f59e0b', letterSpacing: 0.5 }}>
                  QUOTATIONS & DCR FIELD
                </Text>
              </View>
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#10b981' }}>APPROVED</Text>
              </View>
            </View>

            {/* Quotation card */}
            <View style={{ backgroundColor: subCardBg, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: cardBorder }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: subtitleColor }}>QUO-2026-089</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: titleColor, marginTop: 1 }}>TechCore Solutions</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#10b981' }}>$42,500.00</Text>
              </View>
            </View>

            {/* DCR Geo Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9', padding: 10, borderRadius: 12 }}>
              <Ionicons name="location" size={16} color="#f59e0b" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: titleColor }}>GPS Daily Call Record Verified</Text>
                <Text style={{ fontSize: 10, color: subtitleColor }}>Client Site Visit • Pune Hub</Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderSlide = useCallback(
    ({ item }) => (
      <View style={{ width, paddingHorizontal: 24, justifyContent: 'center' }}>
        {/* Mockup Preview Card */}
        <View style={{ marginBottom: 32 }}>
          {renderPreviewCard(item.previewType)}
        </View>

        {/* Slide Copy */}
        <View style={{ alignItems: 'flex-start' }}>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: item.badgeBg,
              marginBottom: 12,
            }}>
            <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: item.badgeColor }}>
              {item.badge}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              lineHeight: 32,
              letterSpacing: -0.6,
              color: titleColor,
              marginBottom: 8,
            }}>
            {item.title}
          </Text>

          <Text
            style={{
              fontSize: 13.5,
              lineHeight: 20,
              color: subtitleColor,
              maxWidth: width - 48,
            }}>
            {item.subtitle}
          </Text>
        </View>
      </View>
    ),
    [width, isDark, cardBg, cardBorder, subCardBg, titleColor, subtitleColor]
  );

  return (
    <AppScreen imageOpacity={isDark ? 0.35 : 0.55}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Ambient gradient glow orbs */}
      <View style={{ position: 'absolute', top: -80, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: orb1 }} pointerEvents="none" />
      <View style={{ position: 'absolute', bottom: 120, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: orb2 }} pointerEvents="none" />

      {/* Top Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 22,
          paddingTop: 8,
          zIndex: 10,
        }}>
        <BrandLogo variant="auth" size={130} />

        <TouchableOpacity
          onPress={finish}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
          }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: subtitleColor }}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Swiper Content */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={handleScrollEnd}
        />
      </View>

      {/* Bottom Controls */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 20,
          paddingTop: 12,
        }}>
        {/* Pagination Indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {SLIDES.map((slide, dotIndex) => {
              const isActive = dotIndex === index;
              return (
                <View
                  key={slide.id}
                  style={{
                    height: 5,
                    width: isActive ? 24 : 6,
                    borderRadius: 3,
                    backgroundColor: isActive ? '#2563eb' : isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1',
                  }}
                />
              );
            })}
          </View>

          <Text style={{ fontSize: 11, fontWeight: '700', color: subtitleColor }}>
            {String(index + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </Text>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          onPress={goNext}
          activeOpacity={0.88}
          style={{
            height: 50,
            borderRadius: 14,
            backgroundColor: '#1d4ed8',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            shadowColor: '#1d4ed8',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.45,
            shadowRadius: 14,
            elevation: 6,
          }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}>
            {isLastSlide ? 'Get Started with Devlomatix' : 'Continue'}
          </Text>
          <Ionicons
            name={isLastSlide ? 'rocket' : 'arrow-forward'}
            size={16}
            color="#ffffff"
          />
        </TouchableOpacity>

        {/* Return to Sign in link */}
        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <Pressable onPress={finish} hitSlop={10}>
            <Text style={{ fontSize: 12, color: subtitleColor }}>
              Already registered?{' '}
              <Text style={{ color: '#2563eb', fontWeight: '700' }}>
                Sign in to workspace
              </Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </AppScreen>
  );
}

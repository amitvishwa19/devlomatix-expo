import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import AppScreen from '~/components/AppScreen';
import UserStatusBar from '~/components/UserStatusBar';
import {
  CONFIGURED_PRIMARY_CHANNEL,
  CONFIGURED_YOUTUBE_CHANNELS,
  DEFAULT_CHANNEL,
  VIDEO_CATEGORIES,
  VIDEOS_DATA,
} from '~/constants/videosData';
import { useLanguage } from '~/contexts/LanguageContext';
import { useAppTheme } from '~/theme/AppTheme';
import { videoChannelUrl } from '~/utils/constants';

const SAVED_VIDEOS_KEY = 'devlomatix.saved_videos';
const JOURNAL_STORAGE_KEY = 'devlomatix.farm_journal_entries';

/**
 * In-App YouTube Player Component
 */
function InAppYouTubePlayer({ video, isPlaying, onTogglePlay }) {
  if (!video) return null;

  const originParam = typeof window !== 'undefined' && window.location?.origin
    ? encodeURIComponent(window.location.origin)
    : 'https://dev.devlomatix.com';

  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&playsinline=1&rel=0&enablejsapi=1&origin=${originParam}`;

  if (Platform.OS === 'web') {
    return (
      <View style={{ width: '100%', height: 230, backgroundColor: '#000', overflow: 'hidden' }}>
        <iframe
          key={video.youtubeId}
          src={embedUrl}
          title={video.title}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </View>
    );
  }

  // Native In-App Player Card
  return (
    <View
      className="overflow-hidden border-b border-slate-800"
      style={{ width: '100%', height: 200, backgroundColor: video.thumbnailGradient?.[0] || '#0f172a' }}>
      <View className="flex-1 items-center justify-center relative p-3">
        {isPlaying ? (
          <View className="items-center justify-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-2xl mb-2">
              <Ionicons name="volume-high" size={28} color="#fff" />
            </View>
            <View className="rounded-full bg-black/80 px-3 py-1 flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-full bg-emerald-400" />
              <Text className="text-[11px] font-bold text-white tracking-wide">
                NOW PLAYING IN APP
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onTogglePlay}
            className="h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-2xl">
            <Ionicons name="play" size={32} color="#fff" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        )}

        {/* Top Badges */}
        <View className="absolute top-2.5 left-2.5 flex-row items-center gap-1.5">
          <View className="rounded-md bg-red-600 px-2 py-0.5 flex-row items-center gap-1">
            <Ionicons name="logo-youtube" size={12} color="#fff" />
            <Text className="text-[9.5px] font-extrabold text-white">
              IN-APP
            </Text>
          </View>
          <View className="rounded-md bg-black/75 px-2 py-0.5">
            <Text className="text-[9.5px] font-bold text-teal-400">
              HD 1080p
            </Text>
          </View>
        </View>

        <View className="absolute bottom-2.5 right-2.5 rounded bg-black/85 px-2 py-0.5">
          <Text className="text-[10.5px] font-bold text-white">
            ⏱️ {video.duration}
          </Text>
        </View>
      </View>

      {/* Scrub bar */}
      <View className="bg-black/95 px-3 py-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={onTogglePlay} className="p-1">
            <Ionicons name={isPlaying ? "pause" : "play"} size={18} color="#fff" />
          </TouchableOpacity>
          <Text className="text-[10px] text-slate-300 font-mono">
            {isPlaying ? '02:15' : '00:00'} / {video.duration}
          </Text>
        </View>

        <View className="flex-1 mx-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <View className="h-full bg-red-600 rounded-full" style={{ width: isPlaying ? '35%' : '0%' }} />
        </View>

        <View className="flex-row items-center gap-2">
          <Ionicons name="volume-medium-outline" size={16} color="#94a3b8" />
          <Ionicons name="expand-outline" size={16} color="#94a3b8" />
        </View>
      </View>
    </View>
  );
}

export default function VideosScreen() {
  const router = useRouter();
  const { palette, isDark } = useAppTheme();
  const { t, currentLanguage } = useLanguage();

  const scrollViewRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activePlayingVideo, setActivePlayingVideo] = useState(VIDEOS_DATA[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDetailModal, setActiveDetailModal] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [filterSavedOnly, setFilterSavedOnly] = useState(false);

  // Load saved bookmarks
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SAVED_VIDEOS_KEY);
        if (stored) setBookmarkedIds(JSON.parse(stored));
      } catch {
        // ignore
      }
    })();
  }, []);

  const toggleBookmark = async (videoId) => {
    try {
      const next = bookmarkedIds.includes(videoId)
        ? bookmarkedIds.filter((id) => id !== videoId)
        : [...bookmarkedIds, videoId];
      setBookmarkedIds(next);
      await AsyncStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(next));
      Toast.show({
        type: 'success',
        text1: next.includes(videoId) ? 'Video Bookmarked' : 'Bookmark Removed',
        visibilityTime: 1800,
      });
    } catch {
      // ignore
    }
  };

  // Play video strictly in app
  const handlePlayInApp = (video) => {
    setActivePlayingVideo(video);
    setIsPlaying(true);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    Toast.show({
      type: 'success',
      text1: 'Playing in App',
      text2: video.title,
      visibilityTime: 2000,
    });
  };

  const handleLogToJournal = async (video) => {
    try {
      const stored = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      const newEntry = {
        id: `vlog_${Date.now()}`,
        cropName: video.targetCrops?.[0] || 'System Guide',
        plotLocation: 'In-App Video Tutorial',
        issueType: 'Technical Guide Notes',
        symptoms: `Studied: ${video.title}`,
        remedy: video.remedies.join(', '),
        potency: 'Standard Protocol',
        dosage: 'Follow operational specifications',
        status: 'MONITORING',
        notes: `Key takeaway: ${video.keyTakeaways?.[0] || video.description}`,
        date: new Date().toISOString(),
      };
      list.unshift(newEntry);
      await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(list));
      Toast.show({
        type: 'success',
        text1: 'Logged to Notes',
        text2: `${video.remedies[0] || 'Protocol'} logged successfully`,
        visibilityTime: 2500,
      });
      setActiveDetailModal(null);
      router.push('/(tabs)/journal');
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to log entry',
      });
    }
  };

  // Filter videos
  const filteredVideos = useMemo(() => {
    return VIDEOS_DATA.filter((v) => {
      if (filterSavedOnly && !bookmarkedIds.includes(v.id)) return false;

      const matchesCat =
        selectedCategory === 'all' || v.category === selectedCategory;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesCat;

      const matchesSearch =
        v.title.toLowerCase().includes(q) ||
        (v.titleHi && v.titleHi.toLowerCase().includes(q)) ||
        v.description.toLowerCase().includes(q) ||
        v.speaker.toLowerCase().includes(q) ||
        v.remedies.some((r) => r.toLowerCase().includes(q)) ||
        v.targetCrops.some((c) => c.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory, filterSavedOnly, bookmarkedIds]);

  return (
    <AppScreen>
      <UserStatusBar />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 90 }}>
        
        {/* Top Header: Channel Status & Controls */}
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="logo-youtube" size={20} color="#ef4444" />
              <Text
                className="text-[17px] font-extrabold"
                style={{ color: palette.colors.text }}>
                {CONFIGURED_PRIMARY_CHANNEL.name}
              </Text>
              <View className="rounded-full bg-rose-500/15 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  IN-APP
                </Text>
              </View>
            </View>
            <Text
              className="mt-0.5 text-[11px] opacity-70"
              style={{ color: palette.colors.subtext }}>
              {CONFIGURED_PRIMARY_CHANNEL.handle} • {CONFIGURED_PRIMARY_CHANNEL.subscriberCount}
            </Text>
          </View>

          {/* Bookmarks Filter Toggle */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterSavedOnly(!filterSavedOnly)}
            className="flex-row items-center gap-1 rounded-xl px-2.5 py-1.5 border border-slate-300 dark:border-slate-700"
            style={{ backgroundColor: filterSavedOnly ? '#0d9488' : palette.colors.card }}>
            <Ionicons
              name={filterSavedOnly ? 'bookmark' : 'bookmark-outline'}
              size={14}
              color={filterSavedOnly ? '#fff' : palette.colors.text}
            />
            <Text
              className="text-[11px] font-bold"
              style={{ color: filterSavedOnly ? '#fff' : palette.colors.text }}>
              {bookmarkedIds.length}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Primary Configured Channel Banner */}
        <View
          className="mb-2.5 flex-row items-center justify-between rounded-2xl border p-2.5 shadow-sm"
          style={{
            backgroundColor: isDark ? '#18202f' : '#f8fafc',
            borderColor: palette.colors.border,
          }}>
          <View className="flex-row items-center gap-2 flex-1">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-red-600/15">
              <MaterialCommunityIcons name="youtube" size={18} color="#ef4444" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text
                  className="text-[12px] font-extrabold"
                  style={{ color: palette.colors.text }}
                  numberOfLines={1}>
                  {CONFIGURED_PRIMARY_CHANNEL.name}
                </Text>
                <Ionicons name="checkmark-circle" size={12} color="#0d9488" />
              </View>
              <Text
                className="text-[10px] opacity-70"
                style={{ color: palette.colors.subtext }}>
                {videoChannelUrl}
              </Text>
            </View>
          </View>
          <View className="rounded-full bg-teal-500/15 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
              {filteredVideos.length} Videos
            </Text>
          </View>
        </View>

        {/* Main Active Video Player */}
        {activePlayingVideo && (
          <View
            className="mb-3 overflow-hidden rounded-2xl border shadow-lg"
            style={{
              backgroundColor: palette.colors.card,
              borderColor: palette.colors.border,
            }}>
            
            {/* Embedded Player */}
            <InAppYouTubePlayer
              video={activePlayingVideo}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
            />

            {/* Player Details */}
            <View className="p-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <View className="rounded bg-red-600 px-1.5 py-0.5">
                      <Text className="text-[9px] font-extrabold text-white">
                        {isPlaying ? 'PLAYING NOW' : 'READY TO PLAY'}
                      </Text>
                    </View>
                    <Text
                      className="text-[10.5px] opacity-65"
                      style={{ color: palette.colors.subtext }}>
                      {activePlayingVideo.duration} • {activePlayingVideo.views} views
                    </Text>
                  </View>
                  <Text
                    className="text-[13.5px] font-bold leading-4"
                    style={{ color: palette.colors.text }}>
                    {currentLanguage === 'hi' && activePlayingVideo.titleHi
                      ? activePlayingVideo.titleHi
                      : activePlayingVideo.title}
                  </Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  onPress={() => setIsPlaying(!isPlaying)}
                  className="rounded-xl bg-red-600 px-3 py-2 flex-row items-center gap-1 shadow-md">
                  <Ionicons name={isPlaying ? "pause" : "play"} size={14} color="#fff" />
                  <Text className="text-[11.5px] font-bold text-white">
                    {isPlaying ? 'Pause' : 'Play'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tag Chips */}
              <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
                {activePlayingVideo.remedies.map((r, i) => (
                  <View key={i} className="rounded-full bg-red-500/15 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-red-600 dark:text-red-400">
                      🏷️ {r}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => setActiveDetailModal(activePlayingVideo)}
                  className="ml-auto rounded-lg bg-slate-500/10 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                    View Details →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View
          className="mb-2 flex-row items-center rounded-xl border px-2.5 py-1.5"
          style={{
            backgroundColor: palette.colors.card,
            borderColor: palette.colors.border,
          }}>
          <Ionicons
            name="search-outline"
            size={16}
            color={palette.colors.subtext}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${CONFIGURED_PRIMARY_CHANNEL.name} videos...`}
            placeholderTextColor={palette.colors.subtext}
            className="ml-2 flex-1 text-[12.5px]"
            style={{ color: palette.colors.text }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={16}
                color={palette.colors.subtext}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Filter Chips */}
        <View className="mb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 6 }}
            className="py-0.5">
            {VIDEO_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.75}
                  onPress={() => setSelectedCategory(cat.id)}
                  className="mr-2 flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-800"
                  style={{
                    backgroundColor: isSelected ? '#dc2626' : palette.colors.card,
                  }}>
                  <Ionicons
                    name={cat.icon}
                    size={13}
                    color={isSelected ? '#fff' : palette.colors.text}
                  />
                  <Text
                    className="text-[11.5px] font-semibold"
                    style={{
                      color: isSelected ? '#fff' : palette.colors.text,
                    }}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Video List Items */}
        <View className="mt-1">
          {filteredVideos.map((item) => {
            const isBookmarked = bookmarkedIds.includes(item.id);
            const isCurrentlySelected = activePlayingVideo?.id === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => handlePlayInApp(item)}
                className="mb-2.5 overflow-hidden rounded-2xl border"
                style={{
                  backgroundColor: palette.colors.card,
                  borderColor: isCurrentlySelected ? '#ef4444' : palette.colors.border,
                }}>
                <View className="flex-row p-2.5">
                  {/* Thumbnail Box */}
                  <View
                    className="h-20 w-28 rounded-xl items-center justify-center relative overflow-hidden"
                    style={{
                      backgroundColor: item.thumbnailGradient?.[0] || '#0f766e',
                    }}>
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-red-600 shadow-md">
                      <Ionicons name="play" size={16} color="#fff" style={{ marginLeft: 2 }} />
                    </View>
                    <View className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-0.5">
                      <Text className="text-[9px] font-bold text-white">
                        {item.duration}
                      </Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View className="ml-2.5 flex-1 justify-between">
                    <View>
                      <View className="flex-row items-center justify-between">
                        <View className="rounded-md bg-red-500/15 px-1.5 py-0.5">
                          <Text className="text-[9px] font-bold uppercase text-red-600 dark:text-red-400">
                            {item.category.replace('_', ' ')}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <TouchableOpacity
                            onPress={() => setActiveDetailModal(item)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons
                              name="information-circle-outline"
                              size={16}
                              color={palette.colors.subtext}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => toggleBookmark(item.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons
                              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                              size={16}
                              color={isBookmarked ? '#0d9488' : palette.colors.subtext}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text
                        className="mt-1 text-[12.5px] font-bold leading-4"
                        numberOfLines={2}
                        style={{ color: palette.colors.text }}>
                        {currentLanguage === 'hi' && item.titleHi
                          ? item.titleHi
                          : item.title}
                      </Text>
                    </View>

                    {/* Footer Row */}
                    <View className="mt-1 flex-row items-center justify-between">
                      <Text
                        className="text-[10px] opacity-65"
                        style={{ color: palette.colors.subtext }}
                        numberOfLines={1}>
                        📺 {CONFIGURED_PRIMARY_CHANNEL.name.split(' ')[0]} • 👁️ {item.views}
                      </Text>
                      <Text className="text-[10.5px] font-bold text-red-600 dark:text-red-400">
                        ▶ Play In App
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredVideos.length === 0 && (
            <View className="items-center justify-center py-12">
              <Ionicons
                name="videocam-outline"
                size={42}
                color={palette.colors.subtext}
              />
              <Text
                className="mt-2 text-[13px] font-semibold"
                style={{ color: palette.colors.text }}>
                {filterSavedOnly
                  ? 'No bookmarked videos'
                  : 'No matching videos found'}
              </Text>
              <Text
                className="mt-1 text-[11px] opacity-60"
                style={{ color: palette.colors.subtext }}>
                {filterSavedOnly
                  ? 'Tap bookmark icon on any video to save here.'
                  : 'Try adjusting your search query.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Video Detail Modal */}
      {activeDetailModal && (
        <Modal
          visible={!!activeDetailModal}
          animationType="slide"
          transparent
          onRequestClose={() => setActiveDetailModal(null)}>
          <View className="flex-1 justify-end bg-black/60">
            <View
              className="max-h-[92%] rounded-t-3xl border-t p-4"
              style={{
                backgroundColor: palette.colors.card,
                borderColor: palette.colors.border,
              }}>
              {/* Modal Header */}
              <View className="flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center gap-2">
                    <View className="rounded-md bg-red-500/15 px-2 py-0.5">
                      <Text className="text-[9.5px] font-bold text-red-600 dark:text-red-400 uppercase">
                        {activeDetailModal.category.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text className="text-[11px] opacity-60" style={{ color: palette.colors.subtext }}>
                      ⏱️ {activeDetailModal.duration} • 👁️ {activeDetailModal.views}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setActiveDetailModal(null)}
                  className="rounded-full bg-slate-200 dark:bg-slate-800 p-1.5">
                  <Ionicons name="close" size={18} color={palette.colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
                {/* Video Title */}
                <Text
                  className="text-[15px] font-extrabold leading-5"
                  style={{ color: palette.colors.text }}>
                  {currentLanguage === 'hi' && activeDetailModal.titleHi
                    ? activeDetailModal.titleHi
                    : activeDetailModal.title}
                </Text>

                <Text
                  className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  Channel: {CONFIGURED_PRIMARY_CHANNEL.name} ({activeDetailModal.language})
                </Text>

                {/* Big In-App Play Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    handlePlayInApp(activeDetailModal);
                    setActiveDetailModal(null);
                  }}
                  className="my-3 flex-row items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 shadow-md">
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text className="text-[13px] font-bold text-white">
                    ▶ Play Video In App
                  </Text>
                </TouchableOpacity>

                {/* Description */}
                <Text
                  className="text-[12px] leading-5 opacity-80"
                  style={{ color: palette.colors.text }}>
                  {activeDetailModal.description}
                </Text>

                {/* Highlights Section */}
                <View
                  className="mt-3 rounded-2xl border p-3"
                  style={{
                    backgroundColor: palette.colors.item,
                    borderColor: palette.colors.border,
                  }}>
                  <Text
                    className="text-[12px] font-bold"
                    style={{ color: palette.colors.text }}>
                    🏷️ Key Systems & Topics
                  </Text>
                  <View className="mt-2 flex-row flex-wrap gap-1.5">
                    {activeDetailModal.remedies.map((rem, i) => (
                      <View
                        key={i}
                        className="rounded-xl bg-red-500/15 px-2.5 py-1">
                        <Text className="text-[11px] font-bold text-red-700 dark:text-red-300">
                          {rem}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Key Takeaways */}
                <View
                  className="mt-2.5 rounded-2xl border p-3"
                  style={{
                    backgroundColor: palette.colors.item,
                    borderColor: palette.colors.border,
                  }}>
                  <Text
                    className="text-[12px] font-bold"
                    style={{ color: palette.colors.text }}>
                    📋 Key Insights & Analysis
                  </Text>
                  <View className="mt-2 gap-1.5">
                    {activeDetailModal.keyTakeaways.map((step, idx) => (
                      <View key={idx} className="flex-row items-start gap-2">
                        <Text className="text-[12px] text-red-600 font-bold">•</Text>
                        <Text
                          className="flex-1 text-[11.5px] leading-4"
                          style={{ color: palette.colors.text }}>
                          {step}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="mt-4 mb-6 flex-row gap-2">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleBookmark(activeDetailModal.id)}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border py-2.5"
                    style={{
                      backgroundColor: palette.colors.card,
                      borderColor: palette.colors.border,
                    }}>
                    <Ionicons
                      name={
                        bookmarkedIds.includes(activeDetailModal.id)
                          ? 'bookmark'
                          : 'bookmark-outline'
                      }
                      size={16}
                      color="#0d9488"
                    />
                    <Text
                      className="text-[11.5px] font-bold"
                      style={{ color: palette.colors.text }}>
                      {bookmarkedIds.includes(activeDetailModal.id)
                        ? 'Bookmarked'
                        : 'Bookmark'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleLogToJournal(activeDetailModal)}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-teal-600 py-2.5">
                    <Ionicons name="book-outline" size={16} color="#fff" />
                    <Text className="text-[11.5px] font-bold text-white">
                      Save to Notes
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </AppScreen>
  );
}

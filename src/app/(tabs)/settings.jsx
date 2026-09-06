import Ionicons from "@expo/vector-icons/Ionicons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppScreen from "~/components/AppScreen";
import { useLanguage } from "~/contexts/LanguageContext";
import { fetchAccessData } from "~/services/access-management";
import { useAppTheme } from "~/theme/AppTheme";
import { clearSession, getSession } from "~/utils/authStorage";

const settingGroups = [
  {
    title: "Experience",
    items: [
      { label: "Push notifications", value: true },
      { label: "Email updates", value: false },
      { label: "Auto sync drafts", value: true },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "Usage analytics", value: false },
      { label: "Experimental features", value: false },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { themeMode, setThemeMode, isDark, palette } = useAppTheme();
  const { language, currentLanguage, setLanguage, availableLanguages } = useLanguage();
  const [user, setUser] = useState(null);
  const [permModules, setPermModules] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  const [languageCategory, setLanguageCategory] = useState("ALL");

  const categories = [
    { key: "ALL", label: "All Languages" },
    { key: "South Indian", label: "South Indian (4)" },
    { key: "North / Central", label: "Hindi & North" },
    { key: "Western", label: "Gujarati & Marathi" },
    { key: "Global", label: "English" },
  ];

  const filteredLanguages = useMemo(() => {
    return availableLanguages.filter((item) => {
      const matchesCategory =
        languageCategory === "ALL" ||
        item.category.toLowerCase().includes(languageCategory.toLowerCase());

      const query = languageSearch.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.nativeName.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.subtext.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [availableLanguages, languageCategory, languageSearch]);

  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      const session = await getSession();
      if (!isMounted) return;
      setUser(session?.user ?? null);
    };
    loadSession();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadPerms = async () => {
      try {
        const res = await fetchAccessData();
        const body = res?.data || res;
        if (body?.permissions && isMounted) {
          setPermModules(body.permissions);
        }
      } catch {
        // ignore
      }
    };
    loadPerms();
    return () => {
      isMounted = false;
    };
  }, []);

  const performLogout = async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // ignore
    }
    await clearSession();
    router.replace("/(auth)/login");
  };

  const handleSignOut = () => {
    setShowLogoutModal(true);
  };

  const settingsGroups = [
    { title: "Email", value: user?.email || "hello@devlomatix.com" },
    { title: "Notifications", value: "Product updates, comments, mentions" },
    { title: "Security", value: "2-step verification enabled" },

  ];

  return (
    <AppScreen>
      <StatusBar style={palette.statusBar} />

      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <View className="px-5 pt-5">
          {/* User Profile Header Card */}
          <View
            className="mb-4 rounded-3xl p-5 shadow-xl flex-row items-center gap-4"
            style={{
              backgroundColor: palette.colors.surface,
              shadowColor: palette.colors.shadow,
            }}
          >
            {user?.avatar || user?.photo ? (
              <Image
                source={{ uri: user.avatar || user.photo }}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <View className="h-16 w-16 items-center justify-center rounded-full bg-teal-700">
                <Text className="text-[24px] font-bold text-white">
                  {user?.displayName?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text
                className="text-xl font-bold"
                style={{ color: palette.textColor }}
              >
                {user?.displayName || "User"}
              </Text>
              <Text
                className="text-sm mt-0.5"
                style={{ color: palette.textSoftColor }}
              >
                {user?.email || "No email configured"}
              </Text>
            </View>
          </View>

          {/* Account details */}
          <View
            className="mb-4 rounded-3xl px-5 py-2"
            style={{ backgroundColor: palette.colors.surface }}
          >
            <Text
              className="py-4 text-sm font-bold uppercase tracking-[0.3px]"
              style={{ color: palette.textColor }}
            >
              Account Details
            </Text>
            {settingsGroups.map((item, index) => (
              <View
                key={item.title}
                className={`py-4 ${index < settingsGroups.length - 1 ? "border-b" : ""}`}
                style={
                  index < settingsGroups.length - 1
                    ? { borderColor: palette.colors.border }
                    : undefined
                }
              >
                <Text
                  className="text-[13px] font-bold uppercase tracking-[0.3px]"
                  style={{ color: palette.textSoftColor }}
                >
                  {item.title}
                </Text>
                <Text
                  className="mt-1 text-base leading-6"
                  style={{ color: palette.textColor }}
                >
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Appearance setting */}
          {/* <View
            className="mb-4 rounded-3xl px-5 py-5"
            style={{ backgroundColor: palette.colors.surface }}
          >
            <Text
              className="text-sm font-bold uppercase tracking-[0.3px]"
              style={{ color: palette.textColor }}
            >
              Appearance
            </Text>
            <Text
              className="mt-2 text-sm leading-6"
              style={{ color: palette.textMutedColor }}
            >
              Switch between light and dark mode for the settings experience.
            </Text>

            <View
              className={`mt-4 flex-row rounded-2xl p-1 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
            >
              {["light", "dark"].map((mode) => {
                const selected = themeMode === mode;

                return (
                  <Pressable
                    key={mode}
                    className={`flex-1 rounded-xl px-4 py-3 ${selected ? "bg-teal-700" : ""}`}
                    onPress={() => setThemeMode(mode)}
                  >
                    <Text
                      className="text-center text-sm font-bold"
                      style={{
                        color: selected ? "#ffffff" : palette.textColor,
                      }}
                    >
                      {mode === "light" ? "Light" : "Dark"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View> */}

          {/* Language selection card */}
          <Pressable
            className="mb-4 rounded-3xl p-4 shadow-sm"
            style={{ backgroundColor: palette.colors.surface }}
            onPress={() => setShowLanguageModal(true)}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/15">
                  <Ionicons name="language" size={22} color="#0f766e" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[12px] font-bold uppercase tracking-[0.3px]"
                    style={{ color: palette.textSoftColor }}
                  >
                    Language / भाषा
                  </Text>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Text
                      className="text-[17px] font-bold"
                      style={{ color: palette.textColor }}
                    >
                      {currentLanguage?.nativeName || "English"}
                    </Text>
                    <View className="rounded-full bg-teal-500/15 px-2 py-0.5">
                      <Text className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                        {currentLanguage?.name || "English"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center gap-1">
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: palette.textMutedColor }}
                >
                  Change
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={palette.colors.textMuted}
                />
              </View>
            </View>
          </Pressable>

          {/* Experience and Workspace Switch Groups */}
          {settingGroups.map((group) => (
            <View
              key={group.title}
              className="mb-4 rounded-3xl px-5 py-2"
              style={{ backgroundColor: palette.colors.surface }}
            >
              <Text
                className="py-4 text-sm font-bold uppercase tracking-[0.3px]"
                style={{ color: palette.textColor }}
              >
                {group.title}
              </Text>
              {group.items.map((item, index) => (
                <View
                  key={item.label}
                  className={`flex-row items-center justify-between py-4 ${index < group.items.length - 1 ? "border-b" : ""}`}
                  style={
                    index < group.items.length - 1
                      ? { borderColor: palette.colors.border }
                      : undefined
                  }
                >
                  <View className="mr-4 flex-1">
                    <Text
                      className="text-base font-bold"
                      style={{ color: palette.textColor }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      className="mt-1 text-sm"
                      style={{ color: palette.textMutedColor }}
                    >
                      Placeholder control for the settings tab preview.
                    </Text>
                  </View>
                  <Switch
                    value={item.value}
                    trackColor={{
                      false: palette.mode === "dark" ? "#334155" : "#cbd5e1",
                      true: "#14b8a6",
                    }}
                    thumbColor={palette.mode === "dark" ? "#f8fafc" : "#ffffff"}
                  />
                </View>
              ))}
            </View>
          ))}

          {/* Shared Preferences */}
          <Pressable
            className="mb-4 rounded-3xl px-5 py-2"
            style={{ backgroundColor: palette.colors.surface }}
            onPress={() => router.push("/(misc)/sharedpref")}
          >
            <Text
              className="py-4 text-sm font-bold uppercase tracking-[0.3px]"
              style={{ color: palette.textColor }}
            >
              Shared Preferences
            </Text>
            <Text
              className="mt-1 text-[13px] leading-5"
              style={{ color: palette.textMutedColor }}
            >
              View and manage stored app data
            </Text>
          </Pressable>

          {/* Logout */}
          <Pressable
            className="h-12 flex-row items-center justify-center rounded-2xl bg-rose-600"
            onPress={handleSignOut}
          >
            <Text className="text-base font-bold text-slate-50">Logout</Text>
          </Pressable>
        </View>
      </Animated.ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setShowLanguageModal(false)}
        >
          <Pressable
            className="w-full rounded-t-[28px] overflow-hidden max-h-[85%]"
            style={{
              backgroundColor: palette.colors.surface,
              paddingBottom: Math.max(insets.bottom + 16, 28),
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Drag Handle */}
            <View className="items-center pt-3 pb-1">
              <View
                className="h-1.5 w-12 rounded-full"
                style={{
                  backgroundColor:
                    palette.mode === "dark" ? "#475569" : "#cbd5e1",
                }}
              />
            </View>

            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b"
              style={{ borderColor: palette.colors.border }}
            >
              <View className="flex-row items-center gap-2.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15">
                  <Ionicons name="language" size={18} color="#0f766e" />
                </View>
                <View>
                  <Text
                    className="text-[17px] font-bold"
                    style={{ color: palette.textColor }}
                  >
                    Select Language / भाषा
                  </Text>
                  <Text
                    className="text-[12px]"
                    style={{ color: palette.textMutedColor }}
                  >
                    Choose your preferred regional language
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{
                  backgroundColor:
                    palette.mode === "dark" ? "#334155" : "#f1f5f9",
                }}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={palette.colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="px-5 pt-3 pb-2">
              <View
                className="flex-row items-center rounded-2xl px-3.5 py-2.5 border"
                style={{
                  backgroundColor: palette.colors.surfaceAlt,
                  borderColor: palette.colors.border,
                }}
              >
                <Ionicons
                  name="search"
                  size={17}
                  color={palette.colors.textMuted}
                />
                <TextInput
                  placeholder="Search language (Hindi, Tamil, ગુજરાતી...)"
                  placeholderTextColor={palette.textMutedColor}
                  value={languageSearch}
                  onChangeText={setLanguageSearch}
                  className="flex-1 ml-2 text-[14px]"
                  style={{ color: palette.textColor }}
                />
                {languageSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setLanguageSearch("")}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={palette.colors.textMuted}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Category Filter Pills */}
            <View className="py-2">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
              >
                {categories.map((cat) => {
                  const isSelected = languageCategory === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setLanguageCategory(cat.key)}
                      className={`rounded-full px-3.5 py-1.5 border ${isSelected ? "bg-teal-700 border-teal-700" : ""}`}
                      style={
                        !isSelected
                          ? {
                              backgroundColor: palette.colors.surfaceAlt,
                              borderColor: palette.colors.border,
                            }
                          : undefined
                      }
                    >
                      <Text
                        className={`text-[12px] font-semibold ${isSelected ? "text-white" : ""}`}
                        style={!isSelected ? { color: palette.textColor } : undefined}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Languages List */}
            <ScrollView
              className="px-5 max-h-[380px]"
              showsVerticalScrollIndicator={false}
            >
              <View className="py-1 gap-2">
                {filteredLanguages.map((langItem) => {
                  const isSelected = language === langItem.code;
                  return (
                    <TouchableOpacity
                      key={langItem.code}
                      onPress={() => {
                        setLanguage(langItem.code);
                        setShowLanguageModal(false);
                      }}
                      activeOpacity={0.7}
                      className={`flex-row items-center justify-between rounded-2xl p-3.5 border ${
                        isSelected
                          ? "border-teal-600 bg-teal-500/10 dark:bg-teal-500/15"
                          : "border-transparent"
                      }`}
                      style={
                        !isSelected
                          ? { backgroundColor: palette.colors.surfaceAlt }
                          : undefined
                      }
                    >
                      <View className="flex-row items-center gap-3 flex-1">
                        {/* Native Initial Badge */}
                        <View
                          className={`h-11 w-11 items-center justify-center rounded-2xl ${
                            isSelected ? "bg-teal-600" : "bg-teal-500/10"
                          }`}
                        >
                          <Text
                            className={`text-[17px] font-bold ${
                              isSelected
                                ? "text-white"
                                : "text-teal-700 dark:text-teal-300"
                            }`}
                          >
                            {langItem.nativeName.slice(0, 2)}
                          </Text>
                        </View>

                        {/* Language Text Info */}
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text
                              className="text-[16px] font-bold"
                              style={{ color: palette.textColor }}
                            >
                              {langItem.nativeName}
                            </Text>
                            <View className="rounded-md bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.5">
                              <Text
                                className="text-[10px] font-semibold"
                                style={{ color: palette.textSoftColor }}
                              >
                                {langItem.category}
                              </Text>
                            </View>
                          </View>

                          <Text
                            className="text-[12px] mt-0.5"
                            style={{ color: palette.textMutedColor }}
                          >
                            {langItem.name} • {langItem.subtext}
                          </Text>
                        </View>
                      </View>

                      {/* Selection Checkmark */}
                      <View className="ml-2">
                        {isSelected ? (
                          <View className="h-6 w-6 items-center justify-center rounded-full bg-teal-600">
                            <Ionicons name="checkmark" size={15} color="#ffffff" />
                          </View>
                        ) : (
                          <View
                            className="h-6 w-6 rounded-full border-2"
                            style={{ borderColor: palette.colors.border }}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {filteredLanguages.length === 0 && (
                  <View className="items-center justify-center py-8">
                    <Ionicons
                      name="search-outline"
                      size={36}
                      color={palette.colors.textMuted}
                    />
                    <Text
                      className="mt-2 text-[14px] font-medium"
                      style={{ color: palette.textMutedColor }}
                    >
                      No language found for "{languageSearch}"
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* iOS Style Logout Action Sheet */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/50 p-4"
          style={{ paddingBottom: Math.max(insets.bottom + 90, 110) }}
          onPress={() => setShowLogoutModal(false)}
        >
          <Pressable className="w-full gap-2" onPress={(e) => e.stopPropagation()}>
            {/* Top Info & Action Card */}
            <View
              className="overflow-hidden rounded-[16px]"
              style={{
                backgroundColor: palette.mode === "dark" ? "#1c1c1e" : "#f9f9f9",
              }}
            >
              <View className="items-center px-4 py-3.5 border-b border-gray-500/20">
                <Text className="text-[13px] font-semibold text-gray-400">
                  Log Out of Devlomatix?
                </Text>
                <Text className="mt-0.5 text-[11px] text-gray-400">
                  You will need to sign back in to access your workspace.
                </Text>
              </View>

              <Pressable
                className="items-center py-3.5 active:bg-gray-500/20"
                onPress={async () => {
                  setShowLogoutModal(false);
                  await performLogout();
                }}
              >
                <Text className="text-[17px] font-semibold text-red-500">
                  Log Out
                </Text>
              </Pressable>
            </View>

            {/* Bottom Cancel Button Card */}
            <Pressable
              className="items-center rounded-[16px] py-3.5 active:bg-gray-500/20"
              style={{
                backgroundColor: palette.mode === "dark" ? "#1c1c1e" : "#ffffff",
              }}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text
                className="text-[17px] font-bold text-sky-500"
              >
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AppScreen>
  );
}

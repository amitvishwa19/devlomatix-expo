import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "~/theme/AppTheme";
import { getSession } from "~/utils/authStorage";

const STORAGE_KEYS = [
  { key: "devlomatix.user", label: "User Data", secure: false },
  { key: "devlomatix.workspaceId", label: "Workspace ID", secure: false },
  { key: "devlomatix.accessToken", label: "Access Token", secure: true },
  { key: "devlomatix.deviceToken", label: "Device Token", secure: false },
  { key: "devlomatix.expoPushToken", label: "Expo Push Token", secure: false },
];

function formatValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default function SharedPrefScreen() {
  const router = useRouter();
  const { palette, isDark } = useAppTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState("");
  const isMounted = useRef(true);

  const loadItems = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    const results = [];
    for (const { key, label, secure } of STORAGE_KEYS) {
      try {
        let value;
        if (secure) {
          value = await SecureStore.getItemAsync(key);
        } else {
          value = await AsyncStorage.getItem(key);
        }
        results.push({ key, label, value: value ?? "—", secure });
      } catch {
        results.push({ key, label, value: "Error", secure });
      }
    }
    if (isMounted.current) {
      setItems(results);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSaveUser = async (userData) => {
    try {
      const json = JSON.stringify(userData);
      await AsyncStorage.setItem("devlomatix.user", json);
      await SecureStore.setItemAsync(
        "devlomatix.workspaceId",
        userData.workspaceId || "",
      );
      await SecureStore.setItemAsync(
        "devlomatix.accessToken",
        userData.accessToken || "",
      );
      if (userData.deviceToken) {
        await AsyncStorage.setItem(
          "devlomatix.deviceToken",
          userData.deviceToken,
        );
      }
      if (userData.expoPushToken) {
        await AsyncStorage.setItem(
          "devlomatix.expoPushToken",
          userData.expoPushToken,
        );
      }
      await loadItems();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (key, secure) => {
    try {
      if (secure) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
      await loadItems();
    } catch {
      // ignore
    }
  };

  const handleSave = async (key, secure) => {
    try {
      const value = editValue.trim();
      if (secure) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
      setEditingKey(null);
      setEditValue("");
      await loadItems();
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: palette.colors.page }}
    >
      <StatusBar style={palette.statusBar} />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: palette.colors.page }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-5">
          <Text
            className="text-xl font-bold mb-1"
            style={{ color: palette.textColor }}
          >
            Shared Preferences
          </Text>
          <Text
            className="text-sm mb-5"
            style={{ color: palette.textMutedColor }}
          >
            Persistent storage for app data
          </Text>

          {loading ? (
            <View className="items-center py-10">
              <Text style={{ color: palette.textMutedColor }}>Loading...</Text>
            </View>
          ) : (
            <View
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: palette.colors.surface }}
            >
              {items.map((item, index) => (
                <View
                  key={item.key}
                  className="px-4 py-4"
                  style={{
                    borderBottomWidth: index < items.length - 1 ? 1 : 0,
                    borderBottomColor: palette.colors.border + "40",
                  }}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: palette.textMutedColor }}
                    >
                      {item.label}
                    </Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => {
                          setEditingKey(item.key);
                          setEditValue(item.value === "—" ? "" : item.value);
                        }}
                        className="px-2.5 py-1 rounded-lg"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.04)",
                        }}
                      >
                        <Text
                          className="text-[11px] font-bold"
                          style={{ color: palette.textMutedColor }}
                        >
                          Edit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.key, item.secure)}
                        className="px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: "rgba(225,29,72,0.1)" }}
                      >
                        <Text className="text-[11px] font-bold text-rose-600">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {editingKey === item.key ? (
                    <View className="flex-row gap-2 mt-2">
                      <TextInput
                        className="flex-1 h-10 px-3 rounded-xl text-[13px]"
                        style={{
                          backgroundColor: palette.colors.surfaceMuted,
                          color: palette.textColor,
                        }}
                        value={editValue}
                        onChangeText={setEditValue}
                      />
                      <TouchableOpacity
                        onPress={() => handleSave(item.key, item.secure)}
                        className="px-4 h-10 items-center justify-center rounded-xl bg-teal-600"
                      >
                        <Text className="text-[12px] font-bold text-white">
                          Save
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingKey(null);
                          setEditValue("");
                        }}
                        className="px-4 h-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: palette.colors.surfaceMuted }}
                      >
                        <Text
                          className="text-[12px] font-bold"
                          style={{ color: palette.textMutedColor }}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text
                      className="text-[12px] leading-5 mt-1"
                      style={{ color: palette.textColor }}
                      numberOfLines={5}
                    >
                      {item.value}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={loadItems}
            className="mt-5 h-12 rounded-2xl items-center justify-center flex-row gap-2"
            style={{ backgroundColor: palette.colors.surface }}
          >
            <Text
              className="text-[13px] font-bold"
              style={{ color: palette.textColor }}
            >
              Refresh Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              const session = await getSession();
              if (session?.user) {
                await handleSaveUser(session.user);
              }
            }}
            className="mt-3 h-12 rounded-2xl items-center justify-center flex-row gap-2"
            style={{ backgroundColor: palette.colors.surface }}
          >
            <Text
              className="text-[13px] font-bold"
              style={{ color: palette.textColor }}
            >
              Save Current User Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-3 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: palette.colors.surfaceMuted }}
          >
            <Text
              className="text-[13px] font-bold"
              style={{ color: palette.textMutedColor }}
            >
              Back to Settings
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

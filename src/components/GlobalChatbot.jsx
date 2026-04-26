import Ionicons from "@expo/vector-icons/Ionicons";
import { useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "~/theme/AppTheme";
import { apiUrls } from "~/utils/api";
import { getSession } from "~/utils/authStorage";
import axios from "~/utils/axios";
import { storageKey } from "~/utils/constants";

const SHEET_SNAP_POINTS = [0.5, 0.75, 1];
const SPRING_CONFIG = {
  damping: 22,
  stiffness: 240,
};

function getSnapHeight(windowHeight, snapPoint) {
  return windowHeight * snapPoint;
}

function clamp(value, min, max) {
  "worklet";

  return Math.min(Math.max(value, min), max);
}

async function getAuthorizationHeader() {
  const session = await getSession();
  const secureStoreToken = await SecureStore.getItemAsync(
    storageKey.ACCESSTOKEN,
  );

  return (
    session?.accessToken || session?.user?.accessToken || secureStoreToken || ""
  );
}

function extractJsonResponse(payload) {
  if (!payload) {
    return "";
  }

  if (typeof payload === "string") {
    return payload;
  }

  return (
    payload.response ||
    payload.message ||
    payload.content ||
    payload.text ||
    payload.msg ||
    payload.data?.response ||
    payload.data?.message ||
    payload.data?.content ||
    payload.data?.msg ||
    ""
  );
}

function tokenizeResponse(content) {
  return `${content ?? ""}`.match(/\S+\s*|\n/g) || [];
}

function getTypingDelay(token) {
  if (!token) {
    return 42;
  }

  if (token.includes("\n")) {
    return 135;
  }

  if (/[.!?]\s*$/.test(token)) {
    return 120;
  }

  if (token.length > 10) {
    return 63;
  }

  return 51;
}

export default function GlobalChatbot({
  bottom = 24,
  right = 20,
  tabBarBottomOffset = 84,
}) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { palette, isDark } = useAppTheme();
  const scrollViewRef = useRef(null);
  const dragStartHeight = useRef(0);
  const typingTimeoutRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I am your Devlomatix assistant. Ask anything and drag this sheet up to expand it.",
    },
  ]);

  const sheetHeight = useSharedValue(0);

  const currentScreen = useMemo(() => {
    const routeParts = segments.filter((segment) => !segment.startsWith("("));

    return routeParts.length ? routeParts.join(" / ") : "home";
  }, [segments]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    },
    [],
  );

  const isTabsScreen = segments[0] === "(tabs)";
  const launcherBottom =
    insets.bottom + bottom + (isTabsScreen ? tabBarBottomOffset : 0);

  const snapTo = (snapPoint, callback) => {
    sheetHeight.value = withSpring(
      getSnapHeight(windowHeight, snapPoint),
      SPRING_CONFIG,
      callback,
    );
  };

  const openSheet = () => {
    setIsVisible(true);
    sheetHeight.value = 0;
    requestAnimationFrame(() => {
      snapTo(0.5);
    });
  };

  const closeSheet = () => {
    sheetHeight.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(setIsVisible)(false);
      }
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 8,
        onPanResponderGrant: () => {
          dragStartHeight.current = sheetHeight.value;
        },
        onPanResponderMove: (_, gestureState) => {
          const nextHeight = clamp(
            dragStartHeight.current - gestureState.dy,
            getSnapHeight(windowHeight, 0.5),
            getSnapHeight(windowHeight, 1),
          );

          sheetHeight.value = nextHeight;
        },
        onPanResponderRelease: (_, gestureState) => {
          const projectedHeight = clamp(
            sheetHeight.value - gestureState.vy * 80,
            getSnapHeight(windowHeight, 0.5),
            getSnapHeight(windowHeight, 1),
          );

          const nearestSnapPoint = SHEET_SNAP_POINTS.reduce(
            (closest, point) => {
              const pointHeight = getSnapHeight(windowHeight, point);

              return Math.abs(pointHeight - projectedHeight) <
                Math.abs(getSnapHeight(windowHeight, closest) - projectedHeight)
                ? point
                : closest;
            },
            0.5,
          );

          snapTo(nearestSnapPoint);
        },
      }),
    [sheetHeight, windowHeight],
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      sheetHeight.value,
      [0, windowHeight],
      [0, 0.45],
      Extrapolation.CLAMP,
    ),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
  }));

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    const token = await SecureStore.getItemAsync(storageKey.ACCESSTOKEN);

    console.log("token", token);

    const messageId = Date.now();
    const userMessage = {
      id: `user-${messageId}`,
      role: "user",
      content: trimmedMessage,
    };

    const assistantMessage = {
      id: `assistant-${messageId + 1}`,
      role: "assistant",
      content: "",
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantMessage,
    ]);
    setMessage("");

    // await sendAgentMessage({
    //   prompt: trimmedMessage,
    //   screen: currentScreen,
    //   history: [...messages, userMessage],
    //   assistantMessageId: assistantMessage.id,
    // });
  };

  const sendAgentMessage = async ({
    prompt,
    screen,
    history,
    assistantMessageId,
  }) => {
    setIsSending(true);

    try {
      const authHeader = await getAuthorizationHeader();

      if (authHeader) {
        axios.defaults.headers.common.Authorization = authHeader;
      } else {
        delete axios.defaults.headers.common.Authorization;
      }

      const res = await axios.post(apiUrls.agent, {
        message: prompt,
        prompt,
        screen,
        route: screen,
        messages: history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
      });

      await revealAssistantMessage(
        assistantMessageId,
        extractJsonResponse(res?.data) || "No response received.",
      );
    } catch (error) {
      await revealAssistantMessage(
        assistantMessageId,
        extractJsonResponse(error?.response?.data) ||
          error?.message ||
          "Something went wrong while contacting the agent.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const updateAssistantMessage = (assistantMessageId, content) => {
    setMessages((currentMessages) =>
      currentMessages.map((item) =>
        item.id === assistantMessageId
          ? {
              ...item,
              content,
            }
          : item,
      ),
    );
  };

  const revealAssistantMessage = (assistantMessageId, content) =>
    new Promise((resolve) => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      const tokens = tokenizeResponse(content);

      if (!tokens.length) {
        updateAssistantMessage(assistantMessageId, "");
        resolve();
        return;
      }

      let nextMessage = "";
      let index = 0;

      const typeNextToken = () => {
        nextMessage += tokens[index];
        updateAssistantMessage(assistantMessageId, nextMessage);
        index += 1;

        if (index >= tokens.length) {
          typingTimeoutRef.current = null;
          resolve();
          return;
        }

        typingTimeoutRef.current = setTimeout(
          typeNextToken,
          getTypingDelay(tokens[index]),
        );
      };

      typeNextToken();
    });

  return (
    <>
      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 top-0 bottom-0"
        style={{ zIndex: 200 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open chatbot"
          onPress={openSheet}
          className="absolute h-16 w-16 items-center justify-center rounded-full"
          style={{
            right,
            bottom: launcherBottom,
            backgroundColor: palette.colors.tabBar,
            shadowColor: palette.colors.shadow,
            shadowOpacity: 0.25,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 18,
          }}
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="#ffffff" />
        </Pressable>
      </View>

      <Modal
        animationType="none"
        transparent
        visible={isVisible}
        onRequestClose={closeSheet}
      >
        <View className="flex-1 justify-end">
          <Animated.View
            className="absolute left-0 right-0 top-0 bottom-0"
            style={[{ backgroundColor: "#020617" }, backdropStyle]}
          >
            <Pressable className="flex-1" onPress={closeSheet} />
          </Animated.View>

          <Animated.View
            className="overflow-hidden rounded-t-[28px]"
            style={[
              {
                height: windowHeight,
                backgroundColor: palette.colors.surface,
                shadowColor: palette.colors.shadow,
                shadowOpacity: 0.18,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: -4 },
                elevation: 24,
              },
              sheetStyle,
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
              className="flex-1"
            >
              <View
                className="flex-1 px-5"
                style={{
                  paddingTop: Math.max(insets.top, 12),
                  paddingBottom: Math.max(insets.bottom, 16),
                }}
              >
                <View
                  {...panResponder.panHandlers}
                  className="items-center pb-3 pt-1"
                >
                  <View
                    className="h-1.5 w-14 rounded-full"
                    style={{ backgroundColor: isDark ? "#475569" : "#cbd5e1" }}
                  />
                </View>

                <View className="mb-4 flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
                    <Text
                      className="text-xl font-semibold"
                      style={{ color: palette.textColor }}
                    >
                      Devlomatix Assistant
                    </Text>
                    <Text
                      className="mt-1 text-sm"
                      style={{ color: palette.textMutedColor }}
                    >
                      Available on every screen. Drag up to 75% or full screen.
                    </Text>
                  </View>

                  <Pressable
                    onPress={closeSheet}
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: isDark ? "#1e293b" : "#e2e8f0" }}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={palette.textColor}
                    />
                  </Pressable>
                </View>

                <View style={{ flex: 1, minHeight: 0 }}>
                  <ScrollView
                    ref={scrollViewRef}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 16 }}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() =>
                      scrollViewRef.current?.scrollToEnd({ animated: true })
                    }
                    showsVerticalScrollIndicator={false}
                  >
                    {messages.map((item) => (
                      <View
                        key={item.id}
                        className={`mb-3 max-w-[88%] rounded-3xl px-4 py-3 ${
                          item.role === "user"
                            ? "self-end rounded-br-md"
                            : "self-start rounded-bl-md"
                        }`}
                        style={{
                          backgroundColor:
                            item.role === "user"
                              ? palette.colors.tabBar
                              : isDark
                                ? "#1e293b"
                                : "#f1f5f9",
                        }}
                      >
                        <Text
                          className="text-[15px] leading-6"
                          style={{
                            color:
                              item.role === "user"
                                ? "#ffffff"
                                : palette.textColor,
                          }}
                        >
                          {item.content ||
                            (item.role === "assistant" && isSending
                              ? "Thinking..."
                              : "")}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                <View
                  className="mt-3 rounded-[28px] border p-2"
                  style={{
                    borderColor: palette.colors.border,
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    minHeight: 72,
                  }}
                >
                  <View className="flex-row items-end">
                    <TextInput
                      value={message}
                      onChangeText={setMessage}
                      onSubmitEditing={handleSend}
                      editable={!isSending}
                      placeholder="Type your message here..."
                      placeholderTextColor={palette.textMutedColor}
                      multiline
                      className="flex-1 px-3 py-3 text-[15px]"
                      style={{
                        color: palette.textColor,
                        textAlignVertical: "top",
                        minHeight: 52,
                        maxHeight: 112,
                      }}
                    />

                    <Pressable
                      onPress={handleSend}
                      className="ml-2 h-12 w-12 items-center justify-center rounded-full"
                      disabled={isSending || !message.trim()}
                      style={{
                        backgroundColor:
                          isSending || !message.trim()
                            ? palette.colors.border
                            : palette.colors.tabBar,
                      }}
                    >
                      <Ionicons
                        name={isSending ? "hourglass-outline" : "send"}
                        size={20}
                        color="#ffffff"
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

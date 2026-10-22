import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StatusBar,
  Linking,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRbac } from "~/contexts/RbacContext";
import { clearSession } from "~/utils/authStorage";
import { useAppTheme } from "~/theme/AppTheme";

const { width, height } = Dimensions.get("window");

const DOT_COUNT = 22;
const DOTS = Array.from({ length: DOT_COUNT }, (_, i) => ({
  id: i,
  x: Math.random() * width,
  y: Math.random() * height * 0.6,
  size: Math.random() * 3 + 1.5,
  opacity: Math.random() * 0.35 + 0.08,
}));

// Build a theme token map for both modes
function buildTheme(isDark) {
  return isDark
    ? {
        // Background & surfaces
        bg: "#020617",
        surface: "#0f172a",
        surfaceAlt: "#1e293b",
        dot: "#334155",
        // Text
        title: "#f8fafc",
        subtitle: "#64748b",
        userName: "#5eead4",
        // Warning card
        cardBg: "#0f172a",
        cardBorder: "rgba(245,158,11,0.25)",
        cardDivider: "rgba(245,158,11,0.12)",
        warningIconBg: "rgba(245,158,11,0.12)",
        warningIconBorder: "rgba(245,158,11,0.2)",
        warningTitle: "#f59e0b",
        warningBody: "#94a3b8",
        // Steps
        stepBadgeBg: "rgba(99,102,241,0.18)",
        stepBadgeBorder: "rgba(99,102,241,0.3)",
        stepNum: "#818cf8",
        stepText: "#cbd5e1",
        // Shield
        shieldColor: "rgba(99,102,241,0.18)",
        shieldOutline: "rgba(255,255,255,0.12)",
        // Sign out
        signOutText: "#64748b",
        signOutIcon: "#64748b",
        // Status bar
        statusBar: "light-content",
        statusBarBg: "#020617",
      }
    : {
        // Background & surfaces
        bg: "#f8fafc",
        surface: "#ffffff",
        surfaceAlt: "#f1f5f9",
        dot: "#cbd5e1",
        // Text
        title: "#0f172a",
        subtitle: "#64748b",
        userName: "#0891b2",
        // Warning card
        cardBg: "#fffbeb",
        cardBorder: "rgba(245,158,11,0.35)",
        cardDivider: "rgba(245,158,11,0.18)",
        warningIconBg: "rgba(245,158,11,0.12)",
        warningIconBorder: "rgba(245,158,11,0.25)",
        warningTitle: "#b45309",
        warningBody: "#475569",
        // Steps
        stepBadgeBg: "rgba(99,102,241,0.1)",
        stepBadgeBorder: "rgba(99,102,241,0.25)",
        stepNum: "#6366f1",
        stepText: "#334155",
        // Shield
        shieldColor: "rgba(99,102,241,0.15)",
        shieldOutline: "rgba(0,0,0,0.06)",
        // Sign out
        signOutText: "#94a3b8",
        signOutIcon: "#94a3b8",
        // Status bar
        statusBar: "dark-content",
        statusBarBg: "#f8fafc",
      };
}

export default function NoAccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { user } = useRbac();
  const t = buildTheme(isDark);

  // Animations
  const shieldScale = useRef(new Animated.Value(0.7)).current;
  const shieldOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(30)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(shieldScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(shieldOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardAnim, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
      ]),
      Animated.timing(buttonAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSignOut = async () => {
    await clearSession();
    router.replace("/(auth)/login");
  };

  const handleContactSupport = () => {
    Linking.openURL("mailto:support@devlomatix.com?subject=Access%20Request");
  };

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [isDark ? 0.25 : 0.15, isDark ? 0.65 : 0.45] });
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  const userEmail = user?.email || user?.username || "your account";
  const userName = user?.name || user?.fullName || null;

  return (
    <View style={[styles.root, { backgroundColor: t.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor={t.statusBarBg} />

      {/* Background dots */}
      {DOTS.map((dot) => (
        <View
          key={dot.id}
          style={[
            styles.dot,
            { left: dot.x, top: dot.y, width: dot.size, height: dot.size, opacity: dot.opacity, backgroundColor: t.dot },
          ]}
        />
      ))}

      <View style={styles.content}>
        {/* Shield Icon */}
        <Animated.View style={[styles.shieldWrapper, { transform: [{ scale: shieldScale }], opacity: shieldOpacity }]}>
          {/* Outer glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              { opacity: glowOpacity, transform: [{ scale: glowScale }] },
            ]}
          />
          {/* Inner glow ring */}
          <Animated.View
            style={[
              styles.glowRingInner,
              { opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.35] }) },
            ]}
          />
          {/* Shield card */}
          <View style={styles.shieldCard}>
            <Ionicons name="shield-outline" size={64} color={t.shieldOutline} style={StyleSheet.absoluteFill} />
            <Ionicons name="shield" size={80} color={t.shieldColor} />
            <View style={styles.xIcon}>
              <Ionicons name="close" size={36} color="#f43f5e" />
            </View>
          </View>
        </Animated.View>

        {/* Title & Subtitle */}
        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: contentAnim,
              transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <Text style={[styles.title, { color: t.title }]}>Access Restricted</Text>

          {userName && (
            <Text style={[styles.userName, { color: t.userName }]}>Hello, {userName}</Text>
          )}

          <Text style={[styles.subtitle, { color: t.subtitle }]}>
            {userEmail} does not have any roles or permissions assigned to this workspace.
          </Text>
        </Animated.View>

        {/* Warning Card */}
        <Animated.View
          style={[
            styles.warningCard,
            {
              backgroundColor: t.cardBg,
              borderColor: t.cardBorder,
              transform: [{ translateY: cardAnim }],
              opacity: contentAnim,
            },
          ]}
        >
          <View style={styles.warningIconRow}>
            <View style={[styles.warningIconBg, { backgroundColor: t.warningIconBg, borderColor: t.warningIconBorder }]}>
              <Ionicons name="warning-outline" size={18} color="#f59e0b" />
            </View>
            <Text style={[styles.warningTitle, { color: t.warningTitle }]}>No Access Configured</Text>
          </View>

          <View style={[styles.warningDivider, { backgroundColor: t.cardDivider }]} />

          <Text style={[styles.warningBody, { color: t.warningBody }]}>
            Please connect with your organization administrator to get roles and permissions assigned. Without access, you cannot use any features of this app.
          </Text>

          {/* Steps */}
          {["Contact your workspace admin", "Ask them to assign a role", "Re-open the app"].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: t.stepBadgeBg, borderColor: t.stepBadgeBorder }]}>
                <Text style={[styles.stepNum, { color: t.stepNum }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: t.stepText }]}>{step}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom Buttons */}
      <Animated.View
        style={[styles.bottomActions, { opacity: buttonAnim, paddingBottom: Math.max(insets.bottom + 12, 24) }]}
      >
        <TouchableOpacity style={styles.primaryBtn} onPress={handleContactSupport} activeOpacity={0.85}>
          <Ionicons name="mail-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={15} color={t.signOutIcon} style={{ marginRight: 5 }} />
          <Text style={[styles.signOutText, { color: t.signOutText }]}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dot: {
    position: "absolute",
    borderRadius: 999,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 24,
  },
  // Shield
  shieldWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 160,
    height: 160,
    marginBottom: 4,
  },
  glowRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(244,63,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.25)",
  },
  glowRingInner: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(244,63,94,0.06)",
  },
  shieldCard: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  xIcon: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(244,63,94,0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(244,63,94,0.4)",
  },
  // Text
  textBlock: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  userName: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 2,
    maxWidth: 300,
  },
  // Warning card
  warningCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  warningIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  warningIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  warningDivider: {
    height: 1,
    marginVertical: 2,
  },
  warningBody: {
    fontSize: 12.5,
    lineHeight: 19,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontSize: 11,
    fontWeight: "700",
  },
  stepText: {
    fontSize: 12.5,
    flex: 1,
  },
  // Bottom actions
  bottomActions: {
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d9488",
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  signOutText: {
    fontSize: 13.5,
    fontWeight: "600",
  },
});
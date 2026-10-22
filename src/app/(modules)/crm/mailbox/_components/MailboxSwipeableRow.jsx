import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef } from 'react';
import { Animated, PanResponder, Pressable, Text, TouchableOpacity, View } from 'react-native';

let HapticsModule = null;
try {
    HapticsModule = require('expo-haptics');
} catch (_) { }

const BUTTON_WIDTH = 76;

/**
 * MailboxSwipeableRow - iOS-style left-swipe-to-reveal delete action row
 * Specifically styled for CRM Mailbox cards with rounded-[16px] and compact spacing.
 */
export default function MailboxSwipeableRow({
    children,
    onDelete,
    onPress,
    onLongPress,
    isDark = false,
}) {
    const swipeAnim = useRef(new Animated.Value(0)).current;
    const isOpenRef = useRef(false);
    const autoCloseTimer = useRef(null);

    const clearAutoClose = () => {
        if (autoCloseTimer.current) {
            clearTimeout(autoCloseTimer.current);
            autoCloseTimer.current = null;
        }
    };

    const startAutoClose = () => {
        clearAutoClose();
        autoCloseTimer.current = setTimeout(() => {
            handleClose();
        }, 5000);
    };

    useEffect(() => {
        return () => clearAutoClose();
    }, []);

    const handleClose = () => {
        clearAutoClose();
        isOpenRef.current = false;
        Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
        }).start();
    };

    const handleOpen = () => {
        isOpenRef.current = true;
        try {
            HapticsModule?.impactAsync?.(HapticsModule.ImpactFeedbackStyle?.Light);
        } catch (_) { }
        Animated.spring(swipeAnim, {
            toValue: -BUTTON_WIDTH,
            useNativeDriver: true,
            bounciness: 4,
        }).start();
        startAutoClose();
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            // Only capture horizontal swipes so vertical FlatList scrolling remains smooth
            onMoveShouldSetPanResponder: (_, gestureState) => {
                const isHorizontal = Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dy) < 10;
                return isHorizontal;
            },
            onPanResponderGrant: () => {
                clearAutoClose();
            },
            onPanResponderMove: (_, gestureState) => {
                clearAutoClose();
                if (isOpenRef.current) {
                    // Already open at -BUTTON_WIDTH
                    const newX = -BUTTON_WIDTH + gestureState.dx;
                    if (newX > 0) {
                        swipeAnim.setValue(0);
                    } else if (newX < -BUTTON_WIDTH) {
                        // Friction when pulling further
                        swipeAnim.setValue(-BUTTON_WIDTH + (newX + BUTTON_WIDTH) * 0.25);
                    } else {
                        swipeAnim.setValue(newX);
                    }
                } else {
                    // Closed, swiping left
                    if (gestureState.dx < 0) {
                        const newX =
                            gestureState.dx < -BUTTON_WIDTH
                                ? -BUTTON_WIDTH + (gestureState.dx + BUTTON_WIDTH) * 0.25
                                : gestureState.dx;
                        swipeAnim.setValue(newX);
                    } else {
                        // Damp swiping right
                        swipeAnim.setValue(Math.min(10, gestureState.dx * 0.1));
                    }
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (isOpenRef.current) {
                    // If moving back to the right past threshold, close it
                    if (gestureState.dx > BUTTON_WIDTH / 3) {
                        handleClose();
                    } else {
                        handleOpen();
                    }
                } else {
                    // If swiping left past half button width or with high left velocity
                    if (gestureState.dx < -BUTTON_WIDTH / 2 || gestureState.vx < -0.5) {
                        handleOpen();
                    } else {
                        handleClose();
                    }
                }
            },
            onPanResponderTerminate: () => {
                handleClose();
            },
        })
    ).current;

    const handleDeletePress = () => {
        handleClose();
        if (onDelete) {
            onDelete();
        }
    };

    return (
        <View className="mx-3 mb-2 relative overflow-hidden rounded-[16px]">
            {/* Background Action: Red Delete Button revealed on left swipe */}
            <View
                className="absolute inset-y-0 right-0 justify-center items-center"
                style={{
                    width: BUTTON_WIDTH,
                    backgroundColor: '#dc2626',
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleDeletePress}
                    className="w-full h-full justify-center items-center"
                    hitSlop={4}
                >
                    <Ionicons name="trash" size={20} color="#ffffff" />
                    <Text className="text-white text-[11px] font-bold mt-1">Delete</Text>
                </TouchableOpacity>
            </View>

            {/* Foreground Content Card */}
            <Animated.View
                style={{
                    transform: [{ translateX: swipeAnim }],
                }}
                {...panResponder.panHandlers}
            >
                <Pressable
                    onPress={() => {
                        if (isOpenRef.current) {
                            handleClose();
                        } else if (onPress) {
                            onPress();
                        }
                    }}
                    onLongPress={() => {
                        if (!isOpenRef.current && onLongPress) {
                            onLongPress();
                        }
                    }}
                    delayLongPress={300}
                    className="active:opacity-80"
                >
                    {children}
                </Pressable>
            </Animated.View>
        </View>
    );
}

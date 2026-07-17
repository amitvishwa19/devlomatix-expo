import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useRef, useEffect } from 'react';
import { Animated, PanResponder, Text, TouchableOpacity, View } from 'react-native';

export default function SwipeableRow({ children, onDelete, onPress, onLongPress, isOpen, onSwipeOpen, onSwipeClose }) {
    const swipeAnim = useRef(new Animated.Value(0)).current;
    const BUTTON_WIDTH = 80;
    const autoCloseTimer = useRef(null);

    const clearAutoCloseTimer = () => {
        if (autoCloseTimer.current) {
            clearTimeout(autoCloseTimer.current);
            autoCloseTimer.current = null;
        }
    };

    const startAutoCloseTimer = () => {
        clearAutoCloseTimer();
        autoCloseTimer.current = setTimeout(() => {
            handleClose();
        }, 5000);
    };

    useEffect(() => {
        return () => clearAutoCloseTimer();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            Animated.spring(swipeAnim, {
                toValue: 0,
                useNativeDriver: true
            }).start();
            clearAutoCloseTimer();
        }
    }, [isOpen]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Detect horizontal swipe left (checking dx < -10)
                return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
            },
            onPanResponderMove: (_, gestureState) => {
                clearAutoCloseTimer();
                if (gestureState.dx < 0) {
                    // Add friction if swiping past the button width
                    const newX = gestureState.dx < -BUTTON_WIDTH
                        ? -BUTTON_WIDTH + (gestureState.dx + BUTTON_WIDTH) * 0.3
                        : gestureState.dx;
                    swipeAnim.setValue(newX);
                } else {
                    swipeAnim.setValue(0);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < -BUTTON_WIDTH / 1.5) {
                    Animated.spring(swipeAnim, {
                        toValue: -BUTTON_WIDTH,
                        useNativeDriver: true,
                        bounciness: 4
                    }).start();
                    startAutoCloseTimer();
                    if (onSwipeOpen) onSwipeOpen();
                } else {
                    Animated.spring(swipeAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 4
                    }).start();
                    clearAutoCloseTimer();
                    if (onSwipeClose) onSwipeClose();
                }
            }
        })
    ).current;

    const handleClose = () => {
        clearAutoCloseTimer();
        Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true
        }).start();
        if (onSwipeClose) onSwipeClose();
    };

    return (
        <View className="relative mb-2">
            {/* Background Actions (Delete button) */}
            <View className="absolute inset-y-0 right-0 left-0 justify-center items-end rounded-[20px] overflow-hidden">
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                        handleClose();
                        onDelete();
                    }}
                    className="h-full justify-center items-center "
                    style={{ width: BUTTON_WIDTH }}
                >
                    <Ionicons name="trash" size={20} className='text-red-200' />
                    <Text className="text-white text-[10px] font-bold mt-0.5">Delete</Text>
                </TouchableOpacity>
            </View>

            {/* Foreground Row Content */}
            <Animated.View
                {...panResponder.panHandlers}
                style={{
                    transform: [{ translateX: swipeAnim }],
                }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                        // Check if swiped open, close it on tap
                        if (swipeAnim._value < -5) {
                            handleClose();
                        } else if (onPress) {
                            onPress();
                        }
                    }}
                    onLongPress={() => {
                        if (swipeAnim._value >= -5 && onLongPress) {
                            onLongPress();
                        }
                    }}
                >
                    {children}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

/**
 * Smooth Fade + Slide-Up entrance with optional stagger delay.
 * Lightweight (uses native driver when possible) so it stays smooth on low-end devices & web.
 */
export function FadeSlideIn({
  children,
  delay = 0,
  duration = 320,
  offsetY = 18,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  offsetY?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offsetY)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/**
 * Tactile Spring Pressable button/card wrapper
 */
export function ScalePressable({
  children,
  onPress,
  style,
  scaleTo = 0.96,
  disabled = false,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 35,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

/**
 * Smooth rolling number animation when balance changes (e.g. switching workspace)
 */
export function AnimatedBalanceText({
  value,
  formatter,
  style,
  duration = 420,
}: {
  value: number;
  formatter: (val: number) => string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}) {
  const animVal = useRef(new Animated.Value(value)).current;
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const listenerId = animVal.addListener(({ value: current }) => {
      setDisplayValue(current);
    });
    Animated.timing(animVal, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animVal.removeListener(listenerId);
    };
  }, [value, duration, animVal]);

  return <Text style={style}>{formatter(Math.round(displayValue))}</Text>;
}

/**
 * Smoothly animated horizontal progress bar fill
 */
export function AnimatedProgressBar({
  percent,
  color,
  trackColor,
  height = 7,
}: {
  percent: number;
  color: string;
  trackColor: string;
  height?: number;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, widthAnim]);

  const widthInterpolate = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          height: '100%',
          width: widthInterpolate,
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </Animated.View>
  );
}

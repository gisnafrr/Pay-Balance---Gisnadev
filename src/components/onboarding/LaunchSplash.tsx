import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '@/theme/typography';

/**
 * Smooth Cinematic Launch Splash Animation when opening the app
 */
export function LaunchSplash({ onFinish }: { onFinish: () => void }) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0.65)).current;
  const textTranslate = useRef(new Animated.Value(16)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          speed: 10,
          bounciness: 10,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1.55,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 480,
          delay: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          delay: 160,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(520),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 380,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, [
    containerOpacity,
    logoOpacity,
    logoScale,
    onFinish,
    ringOpacity,
    ringScale,
    textOpacity,
    textTranslate,
  ]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.root,
        { opacity: containerOpacity, pointerEvents: 'auto' },
      ]}
    >
      <LinearGradient
        colors={['#4C1D95', '#6D28D9', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.pulseRing,
            { opacity: ringOpacity, transform: [{ scale: ringScale }] },
          ]}
        />

        <Animated.View
          style={[
            styles.glassLogo,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Image
            source={require('../../../assets/logo.jpg')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </Animated.View>

        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslate }],
            alignItems: 'center',
          }}
        >
          <Text style={styles.brand}>Pay-Balace</Text>
          <Text style={styles.tagline}>Personal Finance & Double-Entry Accounting</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>by gisnadev · MIT License</Text>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  glassLogo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 18,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brand: {
    fontFamily: FONTS.extraBold,
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  tagline: {
    fontFamily: FONTS.medium,
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  pill: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
});

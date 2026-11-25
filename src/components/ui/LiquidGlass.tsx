import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeMode } from '@/types/domain';

/**
 * True Liquid Glass Card:
 * - Translucent frosted surface
 * - Real blur (expo-blur on native + CSS backdropFilter on web)
 * - Specular top-edge highlight rim (simulates light refracting through glass)
 */
export function GlassCard({
  children,
  themeMode = 'light',
  intensity = 38,
  style,
  contentStyle,
  borderRadius = 22,
  tintColor,
}: {
  children: React.ReactNode;
  themeMode?: ThemeMode;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  tintColor?: string;
}) {
  const isDark = themeMode === 'dark';
  const glassBg =
    tintColor ??
    (isDark ? 'rgba(24, 30, 52, 0.62)' : 'rgba(255, 255, 255, 0.72)');
  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.14)'
    : 'rgba(255, 255, 255, 0.85)';

  const webGlassStyle: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: `blur(${Math.round(intensity * 0.55)}px) saturate(185%)`,
          WebkitBackdropFilter: `blur(${Math.round(intensity * 0.55)}px) saturate(185%)`,
          boxShadow: isDark
            ? '0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.14)'
            : '0 10px 28px rgba(109, 40, 217, 0.08), inset 0 1px 0 rgba(255,255,255,0.92)',
        } as unknown as ViewStyle)
      : {};

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderRadius,
          backgroundColor: glassBg,
          borderColor,
        },
        webGlassStyle,
        style,
      ]}
    >
      {Platform.OS !== 'web' && (
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.01)']
            : ['rgba(255,255,255,0.58)', 'rgba(255,255,255,0.08)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
      />
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

/**
 * Soft Liquid Mesh Background with subtle ambient orbs behind glass cards
 */
export function LiquidMeshCanvas({
  children,
  themeMode = 'light',
}: {
  children: React.ReactNode;
  themeMode?: ThemeMode;
}) {
  const isDark = themeMode === 'dark';

  return (
    <View
      style={[
        styles.canvas,
        { backgroundColor: isDark ? '#080B14' : '#F3F4FB' },
      ]}
    >
      {/* Subtle Ambient Orbs for Liquid Glass Refraction */}
      <View
        style={[
          styles.orbTopRight,
          {
            pointerEvents: 'none',
            backgroundColor: isDark
              ? 'rgba(124, 58, 237, 0.24)'
              : 'rgba(139, 92, 246, 0.16)',
          },
        ]}
      />
      <View
        style={[
          styles.orbMidLeft,
          {
            pointerEvents: 'none',
            backgroundColor: isDark
              ? 'rgba(37, 99, 235, 0.20)'
              : 'rgba(59, 130, 246, 0.13)',
          },
        ]}
      />
      <View
        style={[
          styles.orbBottomRight,
          {
            pointerEvents: 'none',
            backgroundColor: isDark
              ? 'rgba(16, 185, 129, 0.14)'
              : 'rgba(236, 72, 153, 0.09)',
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  canvas: {
    flex: 1,
    overflow: 'hidden',
  },
  orbTopRight: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -80,
    right: -70,
  },
  orbMidLeft: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: 260,
    left: -90,
  },
  orbBottomRight: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: -60,
    right: -60,
  },
});

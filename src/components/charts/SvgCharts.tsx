import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  totalLabel,
  totalValueText,
  textColor,
  mutedColor,
  size = 200,
  strokeWidth = 26,
}: {
  segments: DonutSegment[];
  totalLabel: string;
  totalValueText: string;
  textColor: string;
  mutedColor: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, item) => s + Math.max(0, item.value), 0);

  const scaleAnim = useRef(new Animated.Value(0.86)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scaleAnim.setValue(0.88);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 6,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [totalValueText, scaleAnim, opacityAnim]);

  let cumulativeFraction = 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB33"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {total > 0 &&
            segments.map((seg, idx) => {
              const fraction = seg.value / total;
              const dashArray = `${fraction * circumference} ${circumference}`;
              const dashOffset = -cumulativeFraction * circumference;
              cumulativeFraction += fraction;
              return (
                <Circle
                  key={`${seg.label}-${idx}`}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  fill="transparent"
                />
              );
            })}
        </G>
      </Svg>
      <View style={styles.centerLabel}>
        <Text style={[styles.caption, { color: mutedColor }]}>{totalLabel}</Text>
        <Text style={[styles.value, { color: textColor }]} numberOfLines={1}>
          {totalValueText}
        </Text>
      </View>
    </Animated.View>
  );
}

export function CircularProgressRing({
  percent,
  color,
  textColor,
  size = 54,
  strokeWidth = 6,
}: {
  percent: number;
  color: string;
  textColor: string;
  size?: number;
  strokeWidth?: number;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <View style={[styles.ringBox, { width: size, height: size, backgroundColor: `${color}15`, borderRadius: size / 2 }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`${color}30`}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
      <View style={styles.centerLabel}>
        <Text style={[styles.ringText, { color: textColor }]}>{clamped}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  ringBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  ringText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

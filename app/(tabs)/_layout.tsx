import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, ListFilter, Plus, PieChart, Settings } from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors } from '@/theme/colors';
import { FONTS } from '@/theme/typography';
import { t } from '@/i18n/translations';
import { ScalePressable } from '@/components/ui/Motion';

function LiquidGlassTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const { themeMode, language } = useAppStore();
  const colors = getThemeColors(themeMode);
  const isDark = themeMode === 'dark';

  const floatingGlassBar: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(24px) saturate(185%)',
          WebkitBackdropFilter: 'blur(24px) saturate(185%)',
          boxShadow: isDark
            ? '0 14px 34px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.14)'
            : '0 14px 32px rgba(109,40,217,0.14), inset 0 1px 0 rgba(255,255,255,0.92)',
        } as unknown as ViewStyle)
      : {};

  const items = [
    { name: 'index', label: t(language, 'home'), icon: Home },
    { name: 'activity', label: t(language, 'activity'), icon: ListFilter },
    { name: 'add-placeholder', label: t(language, 'add'), icon: Plus, isFab: true },
    { name: 'reports', label: t(language, 'reports'), icon: PieChart },
    { name: 'settings', label: t(language, 'settings'), icon: Settings },
  ];

  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View style={styles.outerWrap} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          {
            backgroundColor: isDark
              ? 'rgba(20, 25, 44, 0.86)'
              : 'rgba(255, 255, 255, 0.88)',
            borderColor: isDark
              ? 'rgba(255,255,255,0.14)'
              : 'rgba(255,255,255,0.95)',
          },
          floatingGlassBar,
        ]}
      >
        {items.map((item) => {
          if (item.isFab) {
            return (
              <View key={item.name} style={styles.fabSlot}>
                <ScalePressable
                  scaleTo={0.86}
                  onPress={() => router.push('/modals/add-transaction' as never)}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#6D28D9', '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.fabButton}
                  >
                    <Plus size={25} color="#FFFFFF" strokeWidth={2.6} />
                  </LinearGradient>
                </ScalePressable>
                <Text
                  numberOfLines={1}
                  style={[styles.tabLabel, { color: colors.textMuted, marginTop: 4 }]}
                >
                  {item.label}
                </Text>
              </View>
            );
          }

          const isFocused = activeRouteName === item.name;
          const IconComp = item.icon;
          const tint = isFocused ? colors.primary : colors.textMuted;

          return (
            <TouchableOpacity
              key={item.name}
              activeOpacity={0.75}
              onPress={() => navigation.navigate(item.name)}
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.iconPill,
                  isFocused && { backgroundColor: colors.primarySoft },
                ]}
              >
                <IconComp size={20} color={tint} strokeWidth={isFocused ? 2.4 : 1.9} />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  {
                    color: tint,
                    fontFamily: isFocused ? FONTS.bold : FONTS.medium,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="add-placeholder" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 74,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingBottom: 10,
    paddingTop: 8,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    width: 38,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: 'center',
  },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -24,
  },
  fabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    elevation: 10,
  },
});

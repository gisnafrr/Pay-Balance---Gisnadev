import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Cpu,
  DownloadCloud,
  RefreshCw,
  Scale,
  ShieldCheck,
} from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { FONTS } from '@/theme/typography';
import { GlassCard, LiquidMeshCanvas } from '@/components/ui/LiquidGlass';
import { FadeSlideIn, ScalePressable } from '@/components/ui/Motion';

export default function AboutAndUpdatesScreen() {
  const router = useRouter();
  const { themeMode } = useAppStore();
  const colors = getThemeColors(themeMode);

  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);
  const [checking, setChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>(
    'Aplikasi Anda menggunakan versi terbaru.'
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const runtimeVersion =
    typeof Updates.runtimeVersion === 'string' && Updates.runtimeVersion
      ? Updates.runtimeVersion
      : appVersion;
  const updateChannel = Updates.channel || (__DEV__ ? 'development' : 'production');
  const updateId = Updates.updateId ? Updates.updateId.slice(0, 12) : 'Embedded Build';

  const handleCheckForUpdates = async () => {
    setChecking(true);
    setUpdateStatus('Memeriksa pembaruan ke server Expo OTA...');

    try {
      if (Platform.OS === 'web' || __DEV__ || !Updates.isEnabled) {
        await new Promise((r) => setTimeout(r, 700));
        setChecking(false);
        setUpdateAvailable(false);
        setUpdateStatus(
          `Versi v${appVersion} (Runtime ${runtimeVersion}) sudah paling baru. Expo Auto-Update aktif penuh pada EAS Preview/Production build.`
        );
        return;
      }

      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        setUpdateAvailable(true);
        setUpdateStatus('Pembaruan OTA baru ditemukan! Tekan tombol di bawah untuk mengunduh & menerapkan.');
      } else {
        setUpdateAvailable(false);
        setUpdateStatus(`Aplikasi Pay-Balace v${appVersion} sudah menggunakan versi terbaru.`);
      }
    } catch (e: unknown) {
      setUpdateStatus(
        e instanceof Error
          ? `Gagal memeriksa pembaruan: ${e.message}`
          : 'Tidak dapat terhubung ke server Expo Updates.'
      );
    } finally {
      setChecking(false);
    }
  };

  const handleDownloadAndApplyUpdate = async () => {
    try {
      setChecking(true);
      setUpdateStatus('Mengunduh paket pembaruan Expo OTA...');
      await Updates.fetchUpdateAsync();
      Alert.alert(
        'Pembaruan Siap Diterapkan',
        'Pay-Balace akan dimuat ulang untuk menerapkan versi terbaru.',
        [
          {
            text: 'Muat Ulang Sekarang',
            onPress: () => {
              Updates.reloadAsync();
            },
          },
        ]
      );
    } catch (e: unknown) {
      Alert.alert(
        'Gagal Mengunduh Update',
        e instanceof Error ? e.message : 'Terjadi kesalahan saat mengunduh update.'
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <LiquidMeshCanvas themeMode={themeMode}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <ScalePressable
            scaleTo={0.9}
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </ScalePressable>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Pembuatan, Versi & Update
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Pay-Balace · Expo Auto-Update & MIT License
            </Text>
          </View>
        </View>

        {/* Brand Identity Hero Card */}
        <FadeSlideIn delay={30}>
          <LinearGradient
            colors={['#5B21B6', '#6D28D9', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandHero}
          >
            <View style={styles.logoFrame}>
              <Image
                source={require('../../assets/logo.jpg')}
                style={styles.logoImg}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.brandTitle}>Pay-Balace</Text>
            <Text style={styles.brandSub}>
              Financial Management & Double-Entry Accounting App
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>v{appVersion}</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>MIT · gisnadev</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Local-First</Text>
              </View>
            </View>
          </LinearGradient>
        </FadeSlideIn>

        {/* Expo Auto-Update Panel */}
        <FadeSlideIn delay={80}>
          <GlassCard
            themeMode={themeMode}
            borderRadius={22}
            style={{ marginBottom: 14 }}
            contentStyle={{ padding: 16 }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                <DownloadCloud size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Expo Auto-Update (OTA)
                </Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                  Pembaruan otomatis tanpa instal ulang APK/IPA
                </Text>
              </View>
            </View>

            <View style={[styles.statusBox, { backgroundColor: colors.surfaceElevated }]}>
              {checking ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <CheckCircle2 size={17} color={colors.positive} />
              )}
              <Text style={[styles.statusText, { color: colors.textPrimary }]}>
                {updateStatus}
              </Text>
            </View>

            <View style={styles.metaGrid}>
              <InfoRow label="Versi Aplikasi" value={`v${appVersion}`} colors={colors} />
              <InfoRow label="Runtime Version" value={runtimeVersion} colors={colors} />
              <InfoRow label="OTA Channel" value={updateChannel} colors={colors} />
              <InfoRow label="Build / Update ID" value={updateId} colors={colors} />
            </View>

            <View style={[styles.switchRow, { borderTopColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>
                  Auto-Update Saat Aplikasi Dibuka
                </Text>
                <Text style={[styles.switchSub, { color: colors.textMuted }]}>
                  Policy: ON_LOAD (expo-updates)
                </Text>
              </View>
              <Switch value={autoCheckEnabled} onValueChange={setAutoCheckEnabled} />
            </View>

            <ScalePressable
              disabled={checking}
              onPress={handleCheckForUpdates}
              style={{ marginTop: 12 }}
            >
              <LinearGradient
                colors={['#7C3AED', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaBtn}
              >
                <RefreshCw size={16} color="#FFFFFF" />
                <Text style={styles.ctaText}>
                  {checking ? 'Memeriksa Pembaruan...' : 'Cek Pembaruan Sekarang'}
                </Text>
              </LinearGradient>
            </ScalePressable>

            {updateAvailable && (
              <ScalePressable
                onPress={handleDownloadAndApplyUpdate}
                style={{ marginTop: 10 }}
              >
                <LinearGradient
                  colors={['#059669', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaBtn}
                >
                  <DownloadCloud size={16} color="#FFFFFF" />
                  <Text style={styles.ctaText}>Unduh & Terapkan Update Sekarang</Text>
                </LinearGradient>
              </ScalePressable>
            )}
          </GlassCard>
        </FadeSlideIn>

        {/* Pembuat & Arsitektur Aplikasi */}
        <FadeSlideIn delay={130}>
          <GlassCard
            themeMode={themeMode}
            borderRadius={22}
            style={{ marginBottom: 14 }}
            contentStyle={{ padding: 16 }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.secondarySoft }]}>
                <Code2 size={20} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Pembuatan & Teknologi
                </Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                  Dibuat & dikelola oleh gisnadev
                </Text>
              </View>
            </View>

            <InfoRow label="Developer / Pembuat" value="gisnadev" colors={colors} />
            <InfoRow label="Framework" value="Expo + React Native (TypeScript)" colors={colors} />
            <InfoRow label="Database Engine" value="Expo SQLite (17 Tabel ACID)" colors={colors} />
            <InfoRow label="Sistem Akuntansi" value="Double-Entry Bookkeeping" colors={colors} />
            <InfoRow label="Desain & UI" value="Liquid Glass · Plus Jakarta Sans" colors={colors} />
          </GlassCard>
        </FadeSlideIn>

        {/* Lisensi MIT */}
        <FadeSlideIn delay={170}>
          <GlassCard
            themeMode={themeMode}
            borderRadius={22}
            contentStyle={{ padding: 16 }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.positiveSoft }]}>
                <Scale size={20} color={colors.positive} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Lisensi Perangkat Lunak (MIT)
                </Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                  Copyright (c) 2026 gisnadev
                </Text>
              </View>
            </View>

            <Text style={[styles.licenseText, { color: colors.textSecondary }]}>
              Permission is hereby granted, free of charge, to any person obtaining a copy of this software (Pay-Balace) and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the MIT License conditions.
            </Text>

            <View style={styles.footerBadges}>
              <View style={[styles.smallTag, { backgroundColor: colors.surfaceElevated }]}>
                <ShieldCheck size={13} color={colors.positive} />
                <Text style={[styles.smallTagText, { color: colors.textSecondary }]}>
                  100% Offline Privacy
                </Text>
              </View>
              <View style={[styles.smallTag, { backgroundColor: colors.surfaceElevated }]}>
                <Cpu size={13} color={colors.primary} />
                <Text style={[styles.smallTagText, { color: colors.textSecondary }]}>
                  EAS Update Ready
                </Text>
              </View>
            </View>
          </GlassCard>
        </FadeSlideIn>
      </ScrollView>
    </LiquidMeshCanvas>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, paddingTop: 50, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: FONTS.extraBold, fontSize: 20, letterSpacing: -0.4 },
  subtitle: { fontFamily: FONTS.medium, fontSize: 12, marginTop: 1 },
  brandHero: {
    borderRadius: 26,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
  },
  logoFrame: {
    width: 82,
    height: 82,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    marginBottom: 12,
  },
  logoImg: { width: '100%', height: '100%' },
  brandTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  brandSub: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.86)',
    textAlign: 'center',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  heroBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: FONTS.bold, fontSize: 15 },
  cardSub: { fontFamily: FONTS.medium, fontSize: 11.5, marginTop: 1 },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  statusText: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  metaGrid: { marginBottom: 4 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: { fontFamily: FONTS.medium, fontSize: 12.5 },
  infoValue: { fontFamily: FONTS.bold, fontSize: 12.5 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  switchLabel: { fontFamily: FONTS.bold, fontSize: 13 },
  switchSub: { fontFamily: FONTS.medium, fontSize: 11.5, marginTop: 1 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13.5,
    borderRadius: 15,
  },
  ctaText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 13.5 },
  licenseText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 19,
  },
  footerBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  smallTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  smallTagText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
  },
});

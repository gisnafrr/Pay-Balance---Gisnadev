import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Moon,
  Languages,
  Lock,
  Globe,
  Trash2,
  DatabaseBackup,
  Landmark,
  Wallet,
  Target,
  HandCoins,
  ChevronRight,
  HelpCircle,
  Info,
} from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { FONTS } from '@/theme/typography';
import { GlassCard, LiquidMeshCanvas } from '@/components/ui/LiquidGlass';
import { FadeSlideIn } from '@/components/ui/Motion';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    setShowTutorial,
    lockApp,
    deletedTransactions,
    backups,
  } = useAppStore();
  const colors = getThemeColors(themeMode);

  return (
    <LiquidMeshCanvas themeMode={themeMode}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Pengaturan & Modul Lengkap
        </Text>

        {/* Preferensi Tema, Bahasa & Tutorial */}
        <FadeSlideIn delay={40}>
          <GlassCard themeMode={themeMode} borderRadius={22} contentStyle={{ paddingHorizontal: 14 }}>
            <View style={styles.row}>
              <Moon size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                  Dark Mode (Tema Gelap)
                </Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  Liquid Glass Light & Dark Mode
                </Text>
              </View>
              <Switch
                value={themeMode === 'dark'}
                onValueChange={(v) => setThemeMode(v ? 'dark' : 'light')}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.row}>
              <Languages size={20} color={colors.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                  Bahasa Aplikasi (Language)
                </Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  Indonesia (ID) / English (EN)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setLanguage(language === 'id' ? 'en' : 'id')}
                style={[styles.langBtn, { backgroundColor: colors.primarySoft }]}
              >
                <Text style={{ fontFamily: FONTS.extraBold, color: colors.primary, fontSize: 12 }}>
                  {language.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity onPress={() => setShowTutorial(true)} style={styles.row}>
              <HelpCircle size={20} color={colors.positive} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                  Pengenalan & Tutorial Interaktif
                </Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  Panduan Personal, Double-Entry & Transfer
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity onPress={lockApp} style={styles.row}>
              <Lock size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                  Kunci Aplikasi Sekarang (PIN & Biometrik)
                </Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  Uji layar keamanan PIN & Biometrik
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </GlassCard>
        </FadeSlideIn>

        {/* Modul Keuangan & Akuntansi */}
        <Text style={[styles.secHeader, { color: colors.textMuted }]}>
          MODUL KEUANGAN & AKUNTANSI BISNIS
        </Text>
        <FadeSlideIn delay={100}>
          <GlassCard themeMode={themeMode} borderRadius={22} contentStyle={{ paddingHorizontal: 14 }}>
            <MenuLink
              icon={<Wallet size={19} color={colors.primary} />}
              title="Rekening & Dompet (Accounts)"
              sub="Kelola saldo Kas, Bank, E-Wallet multi-currency"
              onPress={() => router.push('/modules/accounts' as never)}
              colors={colors}
            />
            <MenuLink
              icon={<Landmark size={19} color={colors.secondary} />}
              title="Chart of Accounts (Daftar Akun COA)"
              sub="20 Akun Standar UMKM + Tambah Akun Baru"
              onPress={() => router.push('/modules/coa' as never)}
              colors={colors}
            />
            <MenuLink
              icon={<Target size={19} color={colors.warning} />}
              title="Budget & Goals (Anggaran)"
              sub="Pantau batas anggaran dengan Circular Progress"
              onPress={() => router.push('/modules/budgets' as never)}
              colors={colors}
            />
            <MenuLink
              icon={<HandCoins size={19} color={colors.positive} />}
              title="Debt & Receivables (Utang & Piutang)"
              sub="Catat cicilan & pelunasan utang/piutang"
              onPress={() => router.push('/modules/debts' as never)}
              colors={colors}
            />
            <MenuLink
              icon={<Globe size={19} color={colors.secondary} />}
              title="Multi-Currency & Kurs (Exchange Rates)"
              sub="Atur kurs manual & otomatis ke Base Currency"
              onPress={() => router.push('/modules/currencies' as never)}
              colors={colors}
            />
            <MenuLink
              icon={<Trash2 size={19} color={colors.negative} />}
              title={`Trash & Recovery (${deletedTransactions.length} item)`}
              sub="Soft Delete, Restore, & Permanent Delete"
              onPress={() => router.push('/modules/trash' as never)}
              colors={colors}
            />
            <MenuLink
              icon={<DatabaseBackup size={19} color={colors.primary} />}
              title={`Backup & Restore (${backups.length} arsip)`}
              sub="Backup Normal, Upload Restore & Export Excel (.xlsx)"
              onPress={() => router.push('/modules/backup' as never)}
              colors={colors}
            />
            <MenuLink
              icon={<Info size={19} color={colors.secondary} />}
              title="Pembuatan, Versi & Auto-Update"
              sub="Pay-Balace v1.0.0 · MIT (gisnadev) · Expo OTA"
              onPress={() => router.push('/modules/about' as never)}
              colors={colors}
              isLast
            />
          </GlassCard>
        </FadeSlideIn>
      </ScrollView>
    </LiquidMeshCanvas>
  );
}

function MenuLink({
  icon,
  title,
  sub,
  onPress,
  colors,
  isLast,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onPress: () => void;
  colors: ReturnType<typeof getThemeColors>;
  isLast?: boolean;
}) {
  return (
    <>
      <TouchableOpacity onPress={onPress} style={styles.row}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>{sub}</Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {!isLast && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingTop: 52,
    paddingBottom: 112,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 22,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  secHeader: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.7,
    marginTop: 20,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
  },
  rowSub: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
});

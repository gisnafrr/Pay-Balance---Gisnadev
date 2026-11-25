import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Menu,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Sparkles,
  BookOpen,
  Paperclip,
  ChevronRight,
  HelpCircle,
} from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { FONTS } from '@/theme/typography';
import { formatCurrency, formatDateShort } from '@/utils/format';
import { t } from '@/i18n/translations';
import { BUSINESS_WORKSPACE_ID, PERSONAL_WORKSPACE_ID } from '@/database/seeds';
import { ActiveWorkspaceMode } from '@/types/domain';
import { HybridSidebarDrawer } from '@/components/navigation/HybridSidebarDrawer';
import { GlassCard, LiquidMeshCanvas } from '@/components/ui/LiquidGlass';
import {
  AnimatedBalanceText,
  FadeSlideIn,
  ScalePressable,
} from '@/components/ui/Motion';

const HERO_GRADIENTS: Record<ActiveWorkspaceMode, [string, string, string]> = {
  PERSONAL: ['#5B21B6', '#7C3AED', '#4F46E5'],
  BUSINESS: ['#1E3A8A', '#2563EB', '#0D9488'],
  COMBINED: ['#312E81', '#4F46E5', '#7C3AED'],
};

export default function DashboardScreen() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    themeMode,
    language,
    activeWorkspace,
    setActiveWorkspace,
    setShowTutorial,
    profile,
    transactions,
    personalTotalBalance,
    businessTotalBalance,
    combinedTotalBalance,
  } = useAppStore();

  const colors = getThemeColors(themeMode);
  const heroColors = HERO_GRADIENTS[activeWorkspace];
  const baseCur = profile?.base_currency_code || 'IDR';

  const filteredTx = transactions.filter((tx) => {
    if (activeWorkspace === 'COMBINED') return true;
    const targetWs =
      activeWorkspace === 'BUSINESS' ? BUSINESS_WORKSPACE_ID : PERSONAL_WORKSPACE_ID;
    return tx.workspace_id === targetWs;
  });

  const totalIncome = filteredTx
    .filter((tx) => tx.type === 'INCOME')
    .reduce((s, tx) => s + tx.base_amount, 0);

  const totalExpense = filteredTx
    .filter((tx) => tx.type === 'EXPENSE')
    .reduce((s, tx) => s + tx.base_amount, 0);

  const heroBalance =
    activeWorkspace === 'COMBINED'
      ? combinedTotalBalance
      : activeWorkspace === 'BUSINESS'
      ? businessTotalBalance
      : personalTotalBalance;

  return (
    <LiquidMeshCanvas themeMode={themeMode}>
      <HybridSidebarDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 112 }}
      >
        {/* Liquid Gradient Hero Card */}
        <LinearGradient
          colors={heroColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroContainer}
        >
          {/* Decorative Soft Glass Glows inside Hero */}
          <View style={[styles.heroGlowTop, { pointerEvents: 'none' }]} />
          <View style={[styles.heroGlowBottom, { pointerEvents: 'none' }]} />

          {/* Top Bar: Drawer + Workspace Switcher + Tutorial Button */}
          <View style={styles.topHeader}>
            <ScalePressable
              scaleTo={0.9}
              onPress={() => setDrawerOpen(true)}
              style={styles.glassIconBtn}
            >
              <Menu size={20} color="#FFFFFF" />
            </ScalePressable>

            <View style={styles.switcherContainer}>
              {(
                [
                  { id: 'PERSONAL', label: 'Personal' },
                  { id: 'BUSINESS', label: 'Business' },
                  { id: 'COMBINED', label: 'Combined' },
                ] as const
              ).map((ws) => {
                const active = activeWorkspace === ws.id;
                return (
                  <TouchableOpacity
                    key={ws.id}
                    activeOpacity={0.85}
                    onPress={() => setActiveWorkspace(ws.id)}
                    style={[styles.switcherPill, active && styles.switcherPillActive]}
                  >
                    <Text
                      style={[
                        styles.switcherText,
                        { color: active ? heroColors[1] : 'rgba(255,255,255,0.88)' },
                      ]}
                    >
                      {ws.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScalePressable
              scaleTo={0.9}
              onPress={() => setShowTutorial(true)}
              style={styles.glassIconBtn}
            >
              <HelpCircle size={20} color="#FFFFFF" />
            </ScalePressable>
          </View>

          {/* Animated Hero Balance */}
          <FadeSlideIn
            key={activeWorkspace}
            offsetY={10}
            duration={280}
            style={styles.heroCenter}
          >
            <Text style={styles.heroCaption}>
              {activeWorkspace === 'COMBINED'
                ? t(language, 'combinedSubtitle')
                : activeWorkspace === 'BUSINESS'
                ? `${t(language, 'businessWorkspace')} · Double-Entry`
                : t(language, 'personalWorkspace')}
            </Text>

            <AnimatedBalanceText
              value={heroBalance}
              formatter={(v) => formatCurrency(v, baseCur, language)}
              style={styles.heroAmount}
            />

            <View style={styles.heroGlassPill}>
              <Text style={styles.heroTrendText}>
                {activeWorkspace === 'COMBINED'
                  ? `Personal ${formatCurrency(personalTotalBalance, baseCur, language)} · Business ${formatCurrency(
                      businessTotalBalance,
                      baseCur,
                      language
                    )}`
                  : `Arus Kas Bersih: ${formatCurrency(totalIncome - totalExpense, baseCur, language)}`}
              </Text>
            </View>
          </FadeSlideIn>
        </LinearGradient>

        {/* Main Liquid Glass Content Body */}
        <View style={styles.body}>
          {/* Combined Overview Split Card */}
          {activeWorkspace === 'COMBINED' && (
            <FadeSlideIn delay={40}>
              <GlassCard
                themeMode={themeMode}
                style={{ marginBottom: 16 }}
                contentStyle={{ padding: 16 }}
              >
                <Text style={[styles.combinedNote, { color: colors.textSecondary }]}>
                  {t(language, 'combinedReadOnlyNote')}
                </Text>
                <View style={styles.splitRow}>
                  <ScalePressable
                    onPress={() => setActiveWorkspace('PERSONAL')}
                    style={[styles.splitBox, { backgroundColor: colors.primarySoft }]}
                  >
                    <Text style={[styles.splitLabel, { color: colors.primary }]}>
                      Personal Finance
                    </Text>
                    <Text style={[styles.splitValue, { color: colors.textPrimary }]}>
                      {formatCurrency(personalTotalBalance, baseCur, language)}
                    </Text>
                  </ScalePressable>

                  <ScalePressable
                    onPress={() => setActiveWorkspace('BUSINESS')}
                    style={[styles.splitBox, { backgroundColor: colors.secondarySoft }]}
                  >
                    <Text style={[styles.splitLabel, { color: colors.secondary }]}>
                      Business Finance
                    </Text>
                    <Text style={[styles.splitValue, { color: colors.textPrimary }]}>
                      {formatCurrency(businessTotalBalance, baseCur, language)}
                    </Text>
                  </ScalePressable>
                </View>
              </GlassCard>
            </FadeSlideIn>
          )}

          {/* Ringkasan Uang Anda */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t(language, 'yourMoney')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/reports' as never)}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {t(language, 'viewAll')}
              </Text>
            </TouchableOpacity>
          </View>

          <FadeSlideIn delay={70} style={styles.moneyCardsRow}>
            <GlassCard
              themeMode={themeMode}
              style={{ flex: 1 }}
              contentStyle={styles.moneyCardContent}
            >
              <View style={[styles.iconSquircle, { backgroundColor: colors.secondarySoft }]}>
                <ArrowDownLeft size={18} color={colors.secondary} strokeWidth={2.4} />
              </View>
              <Text style={[styles.moneyLabel, { color: colors.textSecondary }]}>
                {t(language, 'income')}
              </Text>
              <AnimatedBalanceText
                value={totalIncome}
                formatter={(v) => formatCurrency(v, baseCur, language)}
                style={[styles.moneyValue, { color: colors.textPrimary }]}
              />
            </GlassCard>

            <GlassCard
              themeMode={themeMode}
              style={{ flex: 1 }}
              contentStyle={styles.moneyCardContent}
            >
              <View style={[styles.iconSquircle, { backgroundColor: colors.negativeSoft }]}>
                <ArrowUpRight size={18} color={colors.negative} strokeWidth={2.4} />
              </View>
              <Text style={[styles.moneyLabel, { color: colors.textSecondary }]}>
                {t(language, 'expense')}
              </Text>
              <AnimatedBalanceText
                value={totalExpense}
                formatter={(v) => formatCurrency(v, baseCur, language)}
                style={[styles.moneyValue, { color: colors.textPrimary }]}
              />
            </GlassCard>
          </FadeSlideIn>

          {/* Dark Liquid Glass Insight Strip */}
          <FadeSlideIn delay={120}>
            <ScalePressable
              onPress={() =>
                router.push(
                  (activeWorkspace === 'BUSINESS'
                    ? '/modules/journals'
                    : '/modals/workspace-transfer') as never
                )
              }
            >
              <LinearGradient
                colors={['#13182B', '#1F2647']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.insightBanner}
              >
                <View style={styles.insightIconCircle}>
                  <Sparkles size={16} color="#C4B5FD" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>
                    {activeWorkspace === 'BUSINESS'
                      ? 'Integritas Pembukuan Seimbang'
                      : 'Transfer Berpasangan Aktif'}
                  </Text>
                  <Text style={styles.insightSub}>
                    {activeWorkspace === 'BUSINESS'
                      ? 'Neraca Saldo Dr = Cr · Ketuk untuk lihat Jurnal Umum'
                      : 'Kirim dana Personal ↔ Business tanpa campur Laba Rugi'}
                  </Text>
                </View>
                <ChevronRight size={18} color="#A78BFA" />
              </LinearGradient>
            </ScalePressable>
          </FadeSlideIn>

          {/* Quick Actions (Clean 2-Column Glass Tiles, No Text Truncation) */}
          <FadeSlideIn delay={165} style={styles.quickActionRow}>
            <ScalePressable
              onPress={() => router.push('/modals/workspace-transfer' as never)}
              style={{ flex: 1 }}
            >
              <GlassCard
                themeMode={themeMode}
                borderRadius={18}
                contentStyle={styles.quickTile}
              >
                <View style={[styles.miniIcon, { backgroundColor: colors.primarySoft }]}>
                  <ArrowLeftRight size={17} color={colors.primary} />
                </View>
                <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>
                  Transfer Workspace
                </Text>
                <Text style={[styles.quickSub, { color: colors.textMuted }]}>
                  Personal ↔ Business
                </Text>
              </GlassCard>
            </ScalePressable>

            <ScalePressable
              onPress={() => router.push('/modals/add-journal' as never)}
              style={{ flex: 1 }}
            >
              <GlassCard
                themeMode={themeMode}
                borderRadius={18}
                contentStyle={styles.quickTile}
              >
                <View style={[styles.miniIcon, { backgroundColor: colors.secondarySoft }]}>
                  <BookOpen size={17} color={colors.secondary} />
                </View>
                <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>
                  Jurnal Debit/Kredit
                </Text>
                <Text style={[styles.quickSub, { color: colors.textMuted }]}>
                  Double-Entry Manual
                </Text>
              </GlassCard>
            </ScalePressable>
          </FadeSlideIn>

          {/* Transaksi Terbaru */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t(language, 'recentTransactions')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/activity' as never)}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {t(language, 'viewAll')}
              </Text>
            </TouchableOpacity>
          </View>

          {filteredTx.slice(0, 6).map((tx, idx) => {
            const isPositive = tx.type === 'INCOME';
            const isTransfer = tx.type === 'TRANSFER' || tx.type === 'WORKSPACE_TRANSFER';
            const amtColor = isTransfer
              ? colors.warning
              : isPositive
              ? colors.positive
              : colors.negative;
            const prefix = isTransfer ? '⇄ ' : isPositive ? '+ ' : '- ';

            return (
              <FadeSlideIn key={`${activeWorkspace}-${tx.id}`} delay={200 + idx * 45}>
                <GlassCard
                  themeMode={themeMode}
                  borderRadius={18}
                  style={{ marginBottom: 10 }}
                  contentStyle={styles.txRow}
                >
                  <View
                    style={[
                      styles.txAvatar,
                      { backgroundColor: `${tx.category_color || colors.primary}1A` },
                    ]}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.extraBold,
                        fontSize: 15,
                        color: tx.category_color || colors.primary,
                      }}
                    >
                      {(tx.title || 'T').slice(0, 1).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.txTitle, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {tx.title}
                    </Text>
                    <View style={styles.txMetaRow}>
                      <Text style={[styles.txSub, { color: colors.textMuted }]} numberOfLines={1}>
                        {tx.workspace_type === 'BUSINESS' ? 'Business' : 'Personal'} ·{' '}
                        {tx.account_name || 'Rekening'} ·{' '}
                        {formatDateShort(tx.transaction_date, language)}
                      </Text>
                      {tx.attachment_count ? (
                        <Paperclip size={12} color={colors.primary} />
                      ) : null}
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txAmount, { color: amtColor }]}>
                      {prefix}
                      {formatCurrency(tx.amount, tx.currency_code, language)}
                    </Text>
                    {tx.journal_entry_id ? (
                      <View style={[styles.jePill, { backgroundColor: colors.secondarySoft }]}>
                        <Text style={[styles.jePillText, { color: colors.secondary }]}>
                          Double-Entry
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </GlassCard>
              </FadeSlideIn>
            );
          })}
        </View>
      </ScrollView>
    </LiquidMeshCanvas>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },
  heroGlowTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -70,
    right: -50,
  },
  heroGlowBottom: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(167, 139, 250, 0.18)',
    bottom: -60,
    left: -40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  glassIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switcherContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: RADIUS.pill,
    padding: 4,
  },
  switcherPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  switcherPillActive: {
    backgroundColor: '#FFFFFF',
  },
  switcherText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  heroCenter: {
    alignItems: 'center',
    marginTop: 22,
  },
  heroCaption: {
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
  },
  heroAmount: {
    fontFamily: FONTS.extraBold,
    color: '#FFFFFF',
    fontSize: 36,
    letterSpacing: -1.1,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  heroGlassPill: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.17)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  heroTrendText: {
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
    fontSize: 12,
  },
  body: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 18,
  },
  combinedNote: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  splitBox: {
    flex: 1,
    padding: 13,
    borderRadius: 16,
  },
  splitLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
  },
  splitValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 15,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16.5,
    letterSpacing: -0.3,
  },
  linkText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12.5,
  },
  moneyCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  moneyCardContent: {
    padding: 15,
  },
  iconSquircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  moneyLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  moneyValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 17.5,
    letterSpacing: -0.4,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  insightIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  insightSub: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickTile: {
    padding: 14,
  },
  miniIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    letterSpacing: -0.2,
  },
  quickSub: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
    marginTop: 2,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
  },
  txAvatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  txSub: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
  },
  txAmount: {
    fontFamily: FONTS.extraBold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  jePill: {
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  jePillText: {
    fontFamily: FONTS.bold,
    fontSize: 9.5,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import {
  CHART_PALETTE,
  getThemeColors,
  RADIUS,
  SPACING,
} from '@/theme/colors';
import { DonutChart, DonutSegment } from '@/components/charts/SvgCharts';
import { AnimatedProgressBar, FadeSlideIn } from '@/components/ui/Motion';
import { formatCurrency, formatDateShort } from '@/utils/format';
import {
  getFinancialStatementsSummary,
  getGeneralLedgerByCoa,
  getTrialBalanceReport,
  LedgerEntryRow,
  TrialBalanceRow,
} from '@/services/accounting.service';
import { BUSINESS_WORKSPACE_ID, PERSONAL_WORKSPACE_ID } from '@/database/seeds';

type ReportTab =
  | 'ANALYTICS'
  | 'GENERAL_JOURNAL'
  | 'GENERAL_LEDGER'
  | 'TRIAL_BALANCE'
  | 'PROFIT_LOSS'
  | 'BALANCE_SHEET'
  | 'CASH_FLOW';

export default function ReportsScreen() {
  const {
    themeMode,
    language,
    activeWorkspace,
    transactions,
    journalEntries,
    coaList,
  } = useAppStore();
  const colors = getThemeColors(themeMode);

  const [reportTab, setReportTab] = useState<ReportTab>('ANALYTICS');
  const [analyticsType, setAnalyticsType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [selectedLedgerCoaId, setSelectedLedgerCoaId] = useState(
    coaList[0]?.id || 'coa_1102'
  );
  const [ledgerRows, setLedgerRows] = useState<LedgerEntryRow[]>([]);
  const [trialBalance, setTrialBalance] = useState<{
    rows: TrialBalanceRow[];
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  }>({ rows: [], totalDebit: 0, totalCredit: 0, isBalanced: true });
  const [statements, setStatements] = useState<
    Awaited<ReturnType<typeof getFinancialStatementsSummary>> | null
  >(null);

  useEffect(() => {
    (async () => {
      const tb = await getTrialBalanceReport();
      const st = await getFinancialStatementsSummary();
      const gl = await getGeneralLedgerByCoa(selectedLedgerCoaId);
      setTrialBalance(tb);
      setStatements(st);
      setLedgerRows(gl);
    })();
  }, [transactions, journalEntries, selectedLedgerCoaId]);

  const wsFilter =
    activeWorkspace === 'BUSINESS'
      ? BUSINESS_WORKSPACE_ID
      : activeWorkspace === 'PERSONAL'
      ? PERSONAL_WORKSPACE_ID
      : null;

  const filteredTx = transactions.filter(
    (tx) => (!wsFilter || tx.workspace_id === wsFilter) && tx.type === analyticsType
  );

  // Aggregate by category for Donut Chart
  const catMap = new Map<string, { label: string; value: number; color: string }>();
  filteredTx.forEach((tx, idx) => {
    const key = tx.category_name || tx.title || 'Lainnya';
    const current = catMap.get(key) || {
      label: key,
      value: 0,
      color: tx.category_color || CHART_PALETTE[idx % CHART_PALETTE.length],
    };
    current.value += tx.base_amount;
    catMap.set(key, current);
  });

  const segments: DonutSegment[] = Array.from(catMap.values()).sort((a, b) => b.value - a.value);
  const totalAnalytics = segments.reduce((s, item) => s + item.value, 0);

  const REPORT_TABS: Array<{ id: ReportTab; label: string }> = [
    { id: 'ANALYTICS', label: 'Grafik Donut' },
    { id: 'GENERAL_JOURNAL', label: '1. Jurnal Umum' },
    { id: 'GENERAL_LEDGER', label: '2. Buku Besar' },
    { id: 'TRIAL_BALANCE', label: '3. Neraca Saldo' },
    { id: 'PROFIT_LOSS', label: '4. Laba Rugi' },
    { id: 'BALANCE_SHEET', label: '5. Neraca' },
    { id: 'CASH_FLOW', label: '6. Arus Kas' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Laporan & 6 Laporan Akuntansi Bisnis
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabRow}>
            {REPORT_TABS.map((tab) => {
              const active = reportTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setReportTab(tab.id)}
                  style={[
                    styles.tabChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceElevated,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: active ? '#FFFFFF' : colors.textSecondary,
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {reportTab === 'ANALYTICS' && (
          <>
            <View style={[styles.segmentToggle, { backgroundColor: colors.surface }]}>
              {(['EXPENSE', 'INCOME'] as const).map((tKey) => {
                const active = analyticsType === tKey;
                return (
                  <TouchableOpacity
                    key={tKey}
                    onPress={() => setAnalyticsType(tKey)}
                    style={[
                      styles.segmentBtn,
                      active && { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Text
                      style={{
                        fontWeight: '700',
                        color: active ? colors.primary : colors.textSecondary,
                      }}
                    >
                      {tKey === 'EXPENSE' ? 'Pengeluaran (Expenses)' : 'Pemasukan (Income)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
              <DonutChart
                segments={
                  segments.length > 0
                    ? segments
                    : [{ label: 'Belum ada data', value: 1, color: colors.primary }]
                }
                totalLabel={analyticsType === 'EXPENSE' ? 'Total Pengeluaran' : 'Total Pemasukan'}
                totalValueText={formatCurrency(totalAnalytics, 'IDR', language)}
                textColor={colors.textPrimary}
                mutedColor={colors.textMuted}
              />
            </View>

            {segments.map((seg, idx) => {
              const pct = totalAnalytics > 0 ? Math.round((seg.value / totalAnalytics) * 100) : 0;
              return (
                <FadeSlideIn
                  key={seg.label}
                  delay={idx * 60}
                  style={[styles.catCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.catTop}>
                    <View style={styles.catNameRow}>
                      <View style={[styles.colorDot, { backgroundColor: seg.color }]} />
                      <Text style={[styles.catName, { color: colors.textPrimary }]}>
                        {seg.label}
                      </Text>
                    </View>
                    <Text style={[styles.catAmt, { color: colors.textPrimary }]}>
                      {formatCurrency(seg.value, 'IDR', language)}
                    </Text>
                  </View>
                  <View style={styles.catSubRow}>
                    <Text style={{ fontSize: 11.5, color: colors.textMuted }}>
                      {pct}% dari total
                    </Text>
                    <View style={[styles.pctBadge, { backgroundColor: colors.positiveSoft }]}>
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.positive }}>
                        {pct}%
                      </Text>
                    </View>
                  </View>
                  <AnimatedProgressBar
                    percent={pct}
                    color={seg.color}
                    trackColor={colors.surfaceElevated}
                  />
                </FadeSlideIn>
              );
            })}
          </>
        )}

        {reportTab === 'GENERAL_JOURNAL' && (
          <View style={[styles.reportCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>
              1. Jurnal Umum (General Journal)
            </Text>
            {journalEntries.map((je) => (
              <View key={je.id} style={[styles.blockRow, { borderBottomColor: colors.border }]}>
                <Text style={{ fontWeight: '800', color: colors.secondary, fontSize: 12.5 }}>
                  {je.entry_number} · {formatDateShort(je.entry_date, language)}
                </Text>
                <Text style={{ fontWeight: '700', color: colors.textPrimary, marginVertical: 3 }}>
                  {je.description}
                </Text>
                {(je.lines || []).map((l) => (
                  <View key={l.id} style={styles.kvRow}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1 }}>
                      {l.coa_code} {l.coa_name}
                    </Text>
                    <Text style={{ color: colors.positive, fontSize: 12, width: 100, textAlign: 'right' }}>
                      {l.debit_amount > 0 ? `Dr ${formatCurrency(l.debit_amount, 'IDR', language)}` : ''}
                    </Text>
                    <Text style={{ color: colors.secondary, fontSize: 12, width: 100, textAlign: 'right' }}>
                      {l.credit_amount > 0 ? `Cr ${formatCurrency(l.credit_amount, 'IDR', language)}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {reportTab === 'GENERAL_LEDGER' && (
          <View style={[styles.reportCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>
              2. Buku Besar (General Ledger + Running Balance)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {coaList.map((c) => {
                  const active = selectedLedgerCoaId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedLedgerCoaId(c.id)}
                      style={[
                        styles.tabChip,
                        { backgroundColor: active ? colors.secondary : colors.surfaceElevated },
                      ]}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: active ? '#FFF' : colors.textPrimary }}>
                        {c.code} · {c.name.split(' (')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {ledgerRows.map((row) => (
              <View key={row.line_id} style={[styles.blockRow, { borderBottomColor: colors.border }]}>
                <View style={styles.kvRow}>
                  <Text style={{ fontWeight: '700', color: colors.textPrimary, fontSize: 12.5 }}>
                    {row.entry_number} · {row.description}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>{row.entry_date}</Text>
                </View>
                <View style={[styles.kvRow, { marginTop: 4 }]}>
                  <Text style={{ fontSize: 12, color: colors.positive }}>
                    Dr: {formatCurrency(row.debit_amount, 'IDR', language)}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.secondary }}>
                    Cr: {formatCurrency(row.credit_amount, 'IDR', language)}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary }}>
                    Saldo: {formatCurrency(row.running_balance, 'IDR', language)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {reportTab === 'TRIAL_BALANCE' && (
          <View style={[styles.reportCard, { backgroundColor: colors.surface }]}>
            <View style={styles.kvRow}>
              <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>
                3. Neraca Saldo (Trial Balance)
              </Text>
              <View style={[styles.pctBadge, { backgroundColor: colors.positiveSoft }]}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.positive }}>
                  {trialBalance.isBalanced ? 'SEIMBANG ✓' : 'SELISIH'}
                </Text>
              </View>
            </View>

            {trialBalance.rows
              .filter((r) => r.net_debit > 0 || r.net_credit > 0)
              .map((r) => (
                <View key={r.coa_id} style={[styles.kvRow, styles.tableLine, { borderBottomColor: colors.border }]}>
                  <Text style={{ flex: 1.5, fontSize: 12.5, color: colors.textPrimary }}>
                    {r.code} · {r.name.split(' (')[0]}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 12.5, textAlign: 'right', color: colors.positive }}>
                    {r.net_debit > 0 ? formatCurrency(r.net_debit, 'IDR', language) : '-'}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 12.5, textAlign: 'right', color: colors.secondary }}>
                    {r.net_credit > 0 ? formatCurrency(r.net_credit, 'IDR', language) : '-'}
                  </Text>
                </View>
              ))}

            <View style={[styles.kvRow, { marginTop: 12, paddingTop: 10 }]}>
              <Text style={{ flex: 1.5, fontWeight: '800', color: colors.textPrimary }}>
                TOTAL NERACA SALDO
              </Text>
              <Text style={{ flex: 1, fontWeight: '800', textAlign: 'right', color: colors.positive }}>
                {formatCurrency(trialBalance.totalDebit, 'IDR', language)}
              </Text>
              <Text style={{ flex: 1, fontWeight: '800', textAlign: 'right', color: colors.secondary }}>
                {formatCurrency(trialBalance.totalCredit, 'IDR', language)}
              </Text>
            </View>
          </View>
        )}

        {reportTab === 'PROFIT_LOSS' && statements && (
          <View style={[styles.reportCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>
              4. Laporan Laba Rugi (Profit & Loss)
            </Text>
            <Text style={[styles.subHeading, { color: colors.positive }]}>PENDAPATAN (REVENUE)</Text>
            {statements.revenues.map((r) => (
              <View key={r.coa_id} style={styles.kvRow}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{r.code} · {r.name}</Text>
                <Text style={{ fontWeight: '700', color: colors.positive }}>
                  {formatCurrency(r.net_credit - r.net_debit, 'IDR', language)}
                </Text>
              </View>
            ))}

            <Text style={[styles.subHeading, { color: colors.negative, marginTop: 14 }]}>
              BEBAN & HPP (EXPENSES)
            </Text>
            {statements.expenses.map((r) => (
              <View key={r.coa_id} style={styles.kvRow}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{r.code} · {r.name}</Text>
                <Text style={{ fontWeight: '700', color: colors.negative }}>
                  {formatCurrency(r.net_debit - r.net_credit, 'IDR', language)}
                </Text>
              </View>
            ))}

            <View style={[styles.netBox, { backgroundColor: colors.primarySoft }]}>
              <Text style={{ fontWeight: '800', color: colors.primary }}>LABA / RUGI BERSIH</Text>
              <Text style={{ fontWeight: '900', fontSize: 17, color: colors.primary }}>
                {formatCurrency(statements.netIncome, 'IDR', language)}
              </Text>
            </View>
          </View>
        )}

        {reportTab === 'BALANCE_SHEET' && statements && (
          <View style={[styles.reportCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>
              5. Neraca (Balance Sheet: Aset = Liabilitas + Ekuitas)
            </Text>

            <Text style={[styles.subHeading, { color: colors.primary }]}>ASET (ASSETS)</Text>
            {statements.assets.map((r) => (
              <View key={r.coa_id} style={styles.kvRow}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{r.code} · {r.name}</Text>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                  {formatCurrency(r.net_debit - r.net_credit, 'IDR', language)}
                </Text>
              </View>
            ))}

            <Text style={[styles.subHeading, { color: colors.warning, marginTop: 12 }]}>
              LIABILITAS (LIABILITIES)
            </Text>
            {statements.liabilities.map((r) => (
              <View key={r.coa_id} style={styles.kvRow}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{r.code} · {r.name}</Text>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                  {formatCurrency(r.net_credit - r.net_debit, 'IDR', language)}
                </Text>
              </View>
            ))}

            <Text style={[styles.subHeading, { color: colors.secondary, marginTop: 12 }]}>
              EKUITAS + LABA PERIODE BERJALAN
            </Text>
            {statements.equities.map((r) => (
              <View key={r.coa_id} style={styles.kvRow}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{r.code} · {r.name}</Text>
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                  {formatCurrency(r.net_credit - r.net_debit, 'IDR', language)}
                </Text>
              </View>
            ))}
            <View style={styles.kvRow}>
              <Text style={{ color: colors.textPrimary, fontSize: 13 }}>Laba Bersih Periode Berjalan</Text>
              <Text style={{ fontWeight: '700', color: colors.positive }}>
                {formatCurrency(statements.netIncome, 'IDR', language)}
              </Text>
            </View>

            <View style={[styles.netBox, { backgroundColor: colors.positiveSoft }]}>
              <View>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.positive }}>
                  Total Aset: {formatCurrency(statements.totalAssets, 'IDR', language)}
                </Text>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.positive }}>
                  Liabilitas + Ekuitas:{' '}
                  {formatCurrency(
                    statements.totalLiabilities + statements.totalEquityWithNetIncome,
                    'IDR',
                    language
                  )}
                </Text>
              </View>
              <CheckCircle2 size={22} color={colors.positive} />
            </View>
          </View>
        )}

        {reportTab === 'CASH_FLOW' && statements && (
          <View style={[styles.reportCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>
              6. Laporan Arus Kas (Cash Flow Statement)
            </Text>
            <View style={styles.kvRow}>
              <Text style={{ color: colors.textSecondary }}>Arus Kas dari Aktivitas Operasional (Laba Bersih)</Text>
              <Text style={{ fontWeight: '700', color: colors.positive }}>
                {formatCurrency(statements.netIncome, 'IDR', language)}
              </Text>
            </View>
            <View style={[styles.kvRow, { marginTop: 8 }]}>
              <Text style={{ color: colors.textSecondary }}>Arus Kas dari Aktivitas Pendanaan (Modal & Prive)</Text>
              <Text style={{ fontWeight: '700', color: colors.secondary }}>
                {formatCurrency(
                  statements.totalEquityWithNetIncome - statements.netIncome,
                  'IDR',
                  language
                )}
              </Text>
            </View>
            <View style={[styles.netBox, { backgroundColor: colors.secondarySoft }]}>
              <Text style={{ fontWeight: '800', color: colors.secondary }}>
                SALDO AKHIR KAS & BANK BISNIS
              </Text>
              <Text style={{ fontWeight: '900', fontSize: 16, color: colors.secondary }}>
                {formatCurrency(statements.totalAssets, 'IDR', language)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 112,
  },
  segmentToggle: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: RADIUS.md,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  chartCard: {
    padding: 20,
    borderRadius: RADIUS.lg,
    marginBottom: 14,
    alignItems: 'center',
  },
  catCard: {
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  catTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
  },
  catAmt: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  catSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  reportCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginVertical: 6,
  },
  blockRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableLine: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  netBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

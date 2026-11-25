import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  Trash2,
  RotateCcw,
  BookOpen,
  Paperclip,
  Plus,
  Lock,
} from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { formatCurrency, formatDateShort } from '@/utils/format';
import {
  reversePostedJournalEntry,
  softDeleteTransaction,
} from '@/services/accounting.service';
import { BUSINESS_WORKSPACE_ID, PERSONAL_WORKSPACE_ID } from '@/database/seeds';

export default function ActivityScreen() {
  const router = useRouter();
  const {
    themeMode,
    language,
    activeWorkspace,
    transactions,
    journalEntries,
    refreshAllData,
  } = useAppStore();
  const colors = getThemeColors(themeMode);

  const [tabMode, setTabMode] = useState<'TRANSACTIONS' | 'JOURNALS'>('TRANSACTIONS');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'>('ALL');

  const filteredTx = transactions.filter((tx) => {
    if (activeWorkspace !== 'COMBINED') {
      const wsId =
        activeWorkspace === 'BUSINESS' ? BUSINESS_WORKSPACE_ID : PERSONAL_WORKSPACE_ID;
      if (tx.workspace_id !== wsId) return false;
    }
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'TRANSFER') {
        if (tx.type !== 'TRANSFER' && tx.type !== 'WORKSPACE_TRANSFER') return false;
      } else if (tx.type !== typeFilter) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.title.toLowerCase().includes(q) ||
        (tx.notes || '').toLowerCase().includes(q) ||
        (tx.account_name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSoftDelete = async (txId: string, title: string) => {
    await softDeleteTransaction(txId);
    await refreshAllData();
    Alert.alert('Dipindahkan ke Trash', `"${title}" telah di-Soft Delete dan dapat dipulihkan dari menu Trash.`);
  };

  const handleReverseJournal = async (jeId: string, entryNo: string) => {
    try {
      await reversePostedJournalEntry(jeId, 'Koreksi dari Jurnal Umum');
      await refreshAllData();
      Alert.alert('Jurnal Pembalik Dibuat', `Jurnal pembalik untuk ${entryNo} telah diposting.`);
    } catch (e: unknown) {
      Alert.alert('Tidak Dapat Dibalik', e instanceof Error ? e.message : 'Gagal membuat jurnal pembalik.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Aktivitas & Jurnal ({activeWorkspace})
        </Text>

        {/* Sub-tab Toggle: Transaksi vs Jurnal Double-Entry */}
        <View style={[styles.segmentBar, { backgroundColor: colors.surfaceElevated }]}>
          <TouchableOpacity
            onPress={() => setTabMode('TRANSACTIONS')}
            style={[
              styles.segmentBtn,
              tabMode === 'TRANSACTIONS' && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: tabMode === 'TRANSACTIONS' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Daftar Transaksi ({filteredTx.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTabMode('JOURNALS')}
            style={[
              styles.segmentBtn,
              tabMode === 'JOURNALS' && { backgroundColor: colors.secondary },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: tabMode === 'JOURNALS' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Jurnal Umum ({journalEntries.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Search size={17} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari transaksi, catatan, atau rekening..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        {tabMode === 'TRANSACTIONS' && (
          <View style={styles.filterRow}>
            {(['ALL', 'INCOME', 'EXPENSE', 'TRANSFER'] as const).map((f) => {
              const active = typeFilter === f;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setTypeFilter(f)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.primarySoft : colors.surfaceElevated,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '700',
                      color: active ? colors.primary : colors.textSecondary,
                    }}
                  >
                    {f === 'ALL'
                      ? 'Semua'
                      : f === 'INCOME'
                      ? 'Pemasukan'
                      : f === 'EXPENSE'
                      ? 'Pengeluaran'
                      : 'Transfer'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {tabMode === 'TRANSACTIONS' ? (
          filteredTx.map((tx) => {
            const isPositive = tx.type === 'INCOME';
            const isTransfer = tx.type === 'TRANSFER' || tx.type === 'WORKSPACE_TRANSFER';
            const amtColor = isTransfer
              ? colors.warning
              : isPositive
              ? colors.positive
              : colors.negative;

            return (
              <View key={tx.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                      {tx.title}
                    </Text>
                    <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                      {tx.workspace_type} · {tx.account_name} ·{' '}
                      {formatDateShort(tx.transaction_date, language)}
                    </Text>
                    {tx.notes ? (
                      <Text style={[styles.notes, { color: colors.textSecondary }]}>
                        {tx.notes}
                      </Text>
                    ) : null}
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.amount, { color: amtColor }]}>
                      {isTransfer ? '⇄ ' : isPositive ? '+ ' : '- '}
                      {formatCurrency(tx.amount, tx.currency_code, language)}
                    </Text>
                    <View style={styles.badgeRow}>
                      {tx.attachment_count ? (
                        <View style={[styles.smallBadge, { backgroundColor: colors.primarySoft }]}>
                          <Paperclip size={11} color={colors.primary} />
                          <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>
                            Bukti ({tx.attachment_count})
                          </Text>
                        </View>
                      ) : null}
                      <TouchableOpacity
                        onPress={() => handleSoftDelete(tx.id, tx.title)}
                        style={[styles.trashBtn, { backgroundColor: colors.negativeSoft }]}
                      >
                        <Trash2 size={13} color={colors.negative} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <>
            <TouchableOpacity
              onPress={() => router.push('/modals/add-journal' as never)}
              style={[styles.newJournalBtn, { backgroundColor: colors.secondary }]}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.newJournalText}>Buat Jurnal Umum Manual (Debit / Kredit)</Text>
            </TouchableOpacity>

            {journalEntries.map((je) => (
              <View key={je.id} style={[styles.journalCard, { backgroundColor: colors.surface }]}>
                <View style={styles.jeHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.jeNoRow}>
                      <BookOpen size={14} color={colors.secondary} />
                      <Text style={[styles.jeNo, { color: colors.secondary }]}>
                        {je.entry_number}
                      </Text>
                      <View style={[styles.lockBadge, { backgroundColor: colors.positiveSoft }]}>
                        <Lock size={10} color={colors.positive} />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.positive }}>
                          {je.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.jeDesc, { color: colors.textPrimary }]}>
                      {je.description}
                    </Text>
                    <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                      Tanggal: {formatDateShort(je.entry_date, language)} · Sumber: {je.source_type}
                    </Text>
                  </View>

                  {!je.reversed_by_id && (
                    <TouchableOpacity
                      onPress={() => handleReverseJournal(je.id, je.entry_number)}
                      style={[styles.reverseBtn, { borderColor: colors.warning }]}
                    >
                      <RotateCcw size={13} color={colors.warning} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.warning }}>
                        Pembalik
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Debit & Credit Table */}
                <View style={[styles.linesTable, { borderColor: colors.border }]}>
                  <View style={[styles.lineHeader, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.colAcc, { color: colors.textSecondary }]}>Akun COA</Text>
                    <Text style={[styles.colAmt, { color: colors.textSecondary }]}>Debit</Text>
                    <Text style={[styles.colAmt, { color: colors.textSecondary }]}>Kredit</Text>
                  </View>
                  {(je.lines || []).map((line) => (
                    <View key={line.id} style={[styles.lineRow, { borderTopColor: colors.border }]}>
                      <Text style={[styles.colAcc, { color: colors.textPrimary }]} numberOfLines={1}>
                        {line.coa_code} · {line.coa_name}
                      </Text>
                      <Text style={[styles.colAmt, { color: colors.positive }]}>
                        {line.debit_amount > 0
                          ? formatCurrency(line.debit_amount, je.currency_code, language)
                          : '-'}
                      </Text>
                      <Text style={[styles.colAmt, { color: colors.secondary }]}>
                        {line.credit_amount > 0
                          ? formatCurrency(line.credit_amount, je.currency_code, language)
                          : '-'}
                      </Text>
                    </View>
                  ))}
                  <View style={[styles.lineFooter, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.colAcc, { fontWeight: '700', color: colors.textPrimary }]}>
                      Total Seimbang
                    </Text>
                    <Text style={[styles.colAmt, { fontWeight: '800', color: colors.textPrimary }]}>
                      {formatCurrency(je.total_debit, je.currency_code, language)}
                    </Text>
                    <Text style={[styles.colAmt, { fontWeight: '800', color: colors.textPrimary }]}>
                      {formatCurrency(je.total_credit, je.currency_code, language)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
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
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 10,
  },
  segmentBar: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 112,
  },
  card: {
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    marginTop: 4,
  },
  amount: {
    fontSize: 14.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  smallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  trashBtn: {
    padding: 6,
    borderRadius: 8,
  },
  newJournalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    marginBottom: 14,
  },
  newJournalText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  journalCard: {
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 12,
  },
  jeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  jeNoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jeNo: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  jeDesc: {
    fontSize: 14.5,
    fontWeight: '700',
    marginTop: 3,
  },
  reverseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  linesTable: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  lineHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  lineRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  lineFooter: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  colAcc: {
    flex: 1.5,
    fontSize: 11.5,
  },
  colAmt: {
    flex: 1,
    fontSize: 11.5,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});

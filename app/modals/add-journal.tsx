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
import { X, Plus, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import {
  createJournalEntry,
  validateDoubleEntryLines,
} from '@/services/accounting.service';
import { formatCurrency, todayIsoDate } from '@/utils/format';

export default function AddJournalModal() {
  const router = useRouter();
  const { themeMode, language, coaList, refreshAllData } = useAppStore();
  const colors = getThemeColors(themeMode);

  const [entryDate, setEntryDate] = useState(todayIsoDate());
  const [description, setDescription] = useState('Penjualan Tunai Rp500.000');
  const [referenceNo, setReferenceNo] = useState('JV-001');

  const [lines, setLines] = useState<
    Array<{ coa_id: string; side: 'DEBIT' | 'CREDIT'; amount: string; memo: string }>
  >([
    { coa_id: coaList[0]?.id || 'coa_1101', side: 'DEBIT', amount: '500000', memo: 'Kas Masuk' },
    {
      coa_id: coaList.find((c) => c.code === '4-1001')?.id || 'coa_4101',
      side: 'CREDIT',
      amount: '500000',
      memo: 'Pendapatan Penjualan',
    },
  ]);

  const parsedLines = lines.map((l) => ({
    coa_id: l.coa_id,
    debit_amount: l.side === 'DEBIT' ? Number(l.amount || 0) : 0,
    credit_amount: l.side === 'CREDIT' ? Number(l.amount || 0) : 0,
    memo: l.memo,
  }));

  const validation = validateDoubleEntryLines(parsedLines);

  const updateLine = (
    idx: number,
    patch: Partial<{ coa_id: string; side: 'DEBIT' | 'CREDIT'; amount: string; memo: string }>
  ) => {
    setLines((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { coa_id: coaList[0]?.id || 'coa_1101', side: 'DEBIT', amount: '0', memo: '' },
    ]);
  };

  const handlePost = async () => {
    if (!validation.valid) {
      Alert.alert('Jurnal Belum Seimbang', validation.error || 'Debit dan Kredit harus sama.');
      return;
    }
    try {
      await createJournalEntry({
        entry_date: entryDate,
        description: description.trim() || 'Jurnal Umum Bisnis',
        reference_no: referenceNo.trim() || undefined,
        status: 'POSTED',
        lines: parsedLines,
      });
      await refreshAllData();
      router.back();
    } catch (e: unknown) {
      Alert.alert('Gagal Posting Jurnal', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Jurnal Double-Entry (Debit / Kredit)
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <X size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Keterangan Jurnal</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
          />

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Tanggal</Text>
              <TextInput
                value={entryDate}
                onChangeText={setEntryDate}
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>No. Referensi</Text>
              <TextInput
                value={referenceNo}
                onChangeText={setReferenceNo}
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              />
            </View>
          </View>
        </View>

        {/* Journal Lines */}
        {lines.map((line, idx) => (
          <View key={idx} style={[styles.lineCard, { backgroundColor: colors.surface }]}>
            <View style={styles.lineTop}>
              <Text style={[styles.lineBadge, { color: colors.primary }]}>
                Baris #{idx + 1}
              </Text>
              <View style={styles.sideToggle}>
                {(['DEBIT', 'CREDIT'] as const).map((s) => {
                  const active = line.side === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => updateLine(idx, { side: s })}
                      style={[
                        styles.sideBtn,
                        {
                          backgroundColor: active
                            ? s === 'DEBIT'
                              ? colors.positive
                              : colors.secondary
                            : colors.surfaceElevated,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontWeight: '700',
                          color: active ? '#FFF' : colors.textSecondary,
                        }}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Pilih Akun COA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {coaList.map((coa) => {
                  const active = line.coa_id === coa.id;
                  return (
                    <TouchableOpacity
                      key={coa.id}
                      onPress={() => updateLine(idx, { coa_id: coa.id })}
                      style={[
                        styles.coaChip,
                        {
                          backgroundColor: active ? colors.primary : colors.surfaceElevated,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontWeight: '600',
                          color: active ? '#FFF' : colors.textPrimary,
                        }}
                      >
                        {coa.code} · {coa.name.split(' (')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nominal ({line.side})</Text>
                <TextInput
                  value={line.amount}
                  onChangeText={(val) => updateLine(idx, { amount: val })}
                  keyboardType="numeric"
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Memo Baris</Text>
                <TextInput
                  value={line.memo}
                  onChangeText={(val) => updateLine(idx, { memo: val })}
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={addLine}
          style={[styles.addLineBtn, { borderColor: colors.primary }]}
        >
          <Plus size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Tambah Baris Jurnal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky Bottom Balance Footer */}
      <View style={[styles.stickyFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.balanceRow}>
          <View>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>Total Debit</Text>
            <Text style={[styles.balVal, { color: colors.positive }]}>
              {formatCurrency(validation.totalDebit, 'IDR', language)}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>Total Kredit</Text>
            <Text style={[styles.balVal, { color: colors.secondary }]}>
              {formatCurrency(validation.totalCredit, 'IDR', language)}
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: validation.valid ? colors.positiveSoft : colors.negativeSoft },
            ]}
          >
            {validation.valid ? (
              <CheckCircle2 size={14} color={colors.positive} />
            ) : (
              <AlertCircle size={14} color={colors.negative} />
            )}
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: validation.valid ? colors.positive : colors.negative,
              }}
            >
              {validation.valid ? 'BALANCE (Dr=Cr)' : 'UNBALANCED'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          disabled={!validation.valid}
          onPress={handlePost}
          style={[
            styles.postBtn,
            { backgroundColor: validation.valid ? colors.primary : colors.textMuted },
          ]}
        >
          <Text style={styles.postBtnText}>Posting Jurnal Double-Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingTop: 48,
    paddingBottom: 150,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  card: {
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 12,
  },
  lineCard: {
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  lineTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lineBadge: {
    fontSize: 13,
    fontWeight: '800',
  },
  sideToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  sideBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  coaChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13.5,
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  addLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balVal: {
    fontSize: 14.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  postBtn: {
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  postBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});

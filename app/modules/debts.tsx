import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, CheckCircle2 } from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { formatCurrency } from '@/utils/format';
import { BUSINESS_WORKSPACE_ID, PERSONAL_WORKSPACE_ID } from '@/database/seeds';

export default function DebtsModuleScreen() {
  const router = useRouter();
  const {
    themeMode,
    language,
    activeWorkspace,
    debts,
    accounts,
    createDebt,
    recordDebtPayment,
  } = useAppStore();
  const colors = getThemeColors(themeMode);

  const wsId =
    activeWorkspace === 'BUSINESS' ? BUSINESS_WORKSPACE_ID : PERSONAL_WORKSPACE_ID;

  const [type, setType] = useState<'PAYABLE' | 'RECEIVABLE'>('RECEIVABLE');
  const [counterparty, setCounterparty] = useState('');
  const [principal, setPrincipal] = useState('');
  const [dueDate, setDueDate] = useState('2026-12-30');

  const handleAdd = async () => {
    const amt = Number(principal);
    if (!counterparty.trim() || !amt) return;
    await createDebt({
      workspace_id: wsId,
      type,
      counterparty_name: counterparty.trim(),
      principal_amount: amt,
      due_date: dueDate,
    });
    setCounterparty('');
    setPrincipal('');
  };

  const handleQuickPay = async (debtId: string, remaining: number) => {
    const targetAcc = accounts[0]?.id;
    if (!targetAcc || remaining <= 0) return;
    await recordDebtPayment({
      debt_id: debtId,
      account_id: targetAcc,
      amount: Math.min(500000, remaining),
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Utang & Piutang (Debts & Receivables)
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
          {(['RECEIVABLE', 'PAYABLE'] as const).map((tKey) => (
            <TouchableOpacity
              key={tKey}
              onPress={() => setType(tKey)}
              style={[
                styles.chip,
                { backgroundColor: type === tKey ? colors.primary : colors.surfaceElevated },
              ]}
            >
              <Text style={{ color: type === tKey ? '#FFF' : colors.textPrimary, fontWeight: '700' }}>
                {tKey === 'RECEIVABLE' ? 'Piutang (Receivable)' : 'Utang (Payable)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={counterparty}
          onChangeText={setCounterparty}
          placeholder="Nama Klien / Pihak Terkait"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
        />
        <TextInput
          value={principal}
          onChangeText={setPrincipal}
          keyboardType="numeric"
          placeholder="Nominal Pokok"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
        />
        <TouchableOpacity onPress={handleAdd} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <Plus size={16} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: '700' }}>Catat Utang / Piutang</Text>
        </TouchableOpacity>
      </View>

      {debts.map((d) => (
        <View key={d.id} style={[styles.debtCard, { backgroundColor: colors.surface }]}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={{ fontWeight: '800', fontSize: 15, color: colors.textPrimary }}>
                {d.counterparty_name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {d.type === 'RECEIVABLE' ? 'Piutang Usaha' : 'Utang'} · Jatuh Tempo: {d.due_date}
              </Text>
            </View>
            <Text style={{ fontWeight: '800', color: colors.primary }}>
              Sisa: {formatCurrency(d.remaining_amount, d.currency_code, language)}
            </Text>
          </View>

          {d.remaining_amount > 0 ? (
            <TouchableOpacity
              onPress={() => handleQuickPay(d.id, d.remaining_amount)}
              style={[styles.payBtn, { backgroundColor: colors.positiveSoft }]}
            >
              <CheckCircle2 size={15} color={colors.positive} />
              <Text style={{ color: colors.positive, fontWeight: '700', fontSize: 12 }}>
                Catat Pembayaran Cicilan (Rp500.000 / Pelunasan)
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: colors.positive, fontWeight: '800', marginTop: 8 }}>
              ✓ LUNAS (PAID)
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, paddingTop: 50, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800' },
  card: { padding: 14, borderRadius: RADIUS.lg, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { flex: 1, paddingVertical: 9, borderRadius: RADIUS.sm, alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
  },
  debtCard: { padding: 14, borderRadius: RADIUS.md, marginBottom: 10 },
  payBtn: {
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});

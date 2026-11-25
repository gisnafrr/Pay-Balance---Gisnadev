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
import { ArrowLeft, Plus, Wallet } from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { formatCurrency } from '@/utils/format';
import { BUSINESS_WORKSPACE_ID, PERSONAL_WORKSPACE_ID } from '@/database/seeds';

export default function AccountsModuleScreen() {
  const router = useRouter();
  const { themeMode, language, accounts, currencies, createAccount } = useAppStore();
  const colors = getThemeColors(themeMode);

  const [wsId, setWsId] = useState(PERSONAL_WORKSPACE_ID);
  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('IDR');
  const [initialBalance, setInitialBalance] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createAccount({
      workspace_id: wsId,
      name: name.trim(),
      type: 'BANK',
      currency_code: currencyCode,
      initial_balance: Number(initialBalance || 0),
    });
    setName('');
    setInitialBalance('');
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
          Rekening & Dompet (Accounts)
        </Text>
      </View>

      {/* Form Tambah Rekening */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.secTitle, { color: colors.textPrimary }]}>
          Tambah Rekening Baru
        </Text>
        <View style={styles.row}>
          {[
            { id: PERSONAL_WORKSPACE_ID, label: 'Personal' },
            { id: BUSINESS_WORKSPACE_ID, label: 'Business' },
          ].map((w) => (
            <TouchableOpacity
              key={w.id}
              onPress={() => setWsId(w.id)}
              style={[
                styles.chip,
                { backgroundColor: wsId === w.id ? colors.primary : colors.surfaceElevated },
              ]}
            >
              <Text style={{ color: wsId === w.id ? '#FFF' : colors.textPrimary, fontWeight: '700' }}>
                {w.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nama Rekening (mis. Mandiri / Kas Valas)"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
        />

        <View style={styles.row}>
          {currencies.map((c) => (
            <TouchableOpacity
              key={c.code}
              onPress={() => setCurrencyCode(c.code)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    currencyCode === c.code ? colors.secondary : colors.surfaceElevated,
                },
              ]}
            >
              <Text style={{ color: currencyCode === c.code ? '#FFF' : colors.textPrimary, fontWeight: '700' }}>
                {c.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          value={initialBalance}
          onChangeText={setInitialBalance}
          keyboardType="numeric"
          placeholder="Saldo Awal"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
        />

        <TouchableOpacity onPress={handleAdd} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <Plus size={16} color="#FFF" />
          <Text style={styles.btnText}>Simpan Rekening</Text>
        </TouchableOpacity>
      </View>

      {/* Daftar Rekening */}
      {accounts.map((acc) => (
        <View key={acc.id} style={[styles.accCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
            <Wallet size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.accName, { color: colors.textPrimary }]}>{acc.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              {acc.workspace_id === BUSINESS_WORKSPACE_ID ? 'Business' : 'Personal'} · {acc.type} ·{' '}
              {acc.currency_code}
            </Text>
          </View>
          <Text style={[styles.accBal, { color: colors.textPrimary }]}>
            {formatCurrency(acc.current_balance, acc.currency_code, language)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, paddingTop: 50, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  title: { fontSize: 19, fontWeight: '800' },
  card: { padding: 16, borderRadius: RADIUS.lg, marginBottom: 16 },
  secTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  btnText: { color: '#FFF', fontWeight: '700' },
  accCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  accName: { fontSize: 14.5, fontWeight: '700' },
  accBal: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
});

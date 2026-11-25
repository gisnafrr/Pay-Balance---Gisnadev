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
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { CoaAccountType, NormalBalance } from '@/types/domain';

export default function CoaModuleScreen() {
  const router = useRouter();
  const { themeMode, coaList, createCoa } = useAppStore();
  const colors = getThemeColors(themeMode);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<CoaAccountType>('EXPENSE');
  const [normalBalance, setNormalBalance] = useState<NormalBalance>('DEBIT');

  const handleAdd = async () => {
    if (!code.trim() || !name.trim()) return;
    await createCoa({
      code: code.trim(),
      name: name.trim(),
      account_type: accountType,
      normal_balance: normalBalance,
    });
    setCode('');
    setName('');
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
          Chart of Accounts (Daftar Akun COA)
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={{ fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
          Tambah Akun COA Baru
        </Text>
        <View style={styles.row}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Kode (mis. 5-2009)"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { flex: 1, color: colors.textPrimary, borderColor: colors.border }]}
          />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nama Akun"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { flex: 2, color: colors.textPrimary, borderColor: colors.border }]}
          />
        </View>

        <View style={styles.row}>
          {(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                setAccountType(t);
                setNormalBalance(t === 'ASSET' || t === 'EXPENSE' ? 'DEBIT' : 'CREDIT');
              }}
              style={[
                styles.chip,
                { backgroundColor: accountType === t ? colors.primary : colors.surfaceElevated },
              ]}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: accountType === t ? '#FFF' : colors.textPrimary }}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={handleAdd} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <Plus size={16} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: '700' }}>Tambah ke COA ({normalBalance})</Text>
        </TouchableOpacity>
      </View>

      {coaList.map((c) => (
        <View key={c.id} style={[styles.coaRow, { backgroundColor: colors.surface }]}>
          <View style={[styles.codeBadge, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ fontWeight: '800', color: colors.primary, fontSize: 12 }}>{c.code}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{c.name}</Text>
            <Text style={{ fontSize: 11.5, color: colors.textMuted }}>
              Tipe: {c.account_type} · Saldo Normal: {c.normal_balance}
            </Text>
          </View>
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
  },
  coaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 8,
  },
  codeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm },
});

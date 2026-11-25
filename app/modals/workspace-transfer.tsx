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
import { X, ArrowLeftRight, ShieldCheck } from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { BUSINESS_WORKSPACE_ID, PERSONAL_WORKSPACE_ID } from '@/database/seeds';
import { createInterWorkspaceTransfer } from '@/services/accounting.service';
import { todayIsoDate } from '@/utils/format';

export default function WorkspaceTransferModal() {
  const router = useRouter();
  const { themeMode, accounts, refreshAllData } = useAppStore();
  const colors = getThemeColors(themeMode);

  const [direction, setDirection] = useState<'PERSONAL_TO_BUSINESS' | 'BUSINESS_TO_PERSONAL'>(
    'PERSONAL_TO_BUSINESS'
  );

  const personalAccs = accounts.filter((a) => a.workspace_id === PERSONAL_WORKSPACE_ID);
  const businessAccs = accounts.filter((a) => a.workspace_id === BUSINESS_WORKSPACE_ID);

  const [personalAccId, setPersonalAccId] = useState(personalAccs[0]?.id || '');
  const [businessAccId, setBusinessAccId] = useState(businessAccs[0]?.id || '');
  const [amount, setAmount] = useState('1000000');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [notes, setNotes] = useState('Setoran dana Personal ke Business');

  const handleTransfer = async () => {
    const numAmt = Number(amount.replace(/[^0-9.]/g, ''));
    const numRate = Number(exchangeRate) || 1;
    if (!numAmt || numAmt <= 0) {
      Alert.alert('Nominal Tidak Valid', 'Masukkan nominal transfer lebih dari 0.');
      return;
    }

    try {
      await createInterWorkspaceTransfer({
        direction,
        from_account_id:
          direction === 'PERSONAL_TO_BUSINESS' ? personalAccId : businessAccId,
        to_account_id:
          direction === 'PERSONAL_TO_BUSINESS' ? businessAccId : personalAccId,
        amount: numAmt,
        exchange_rate: numRate,
        transaction_date: todayIsoDate(),
        notes,
      });
      await refreshAllData();
      Alert.alert(
        'Transfer Antar-Workspace Berhasil',
        'Kedua transaksi telah saling terhubung dan dicatat sebagai perpindahan Aset/Ekuitas (bukan Pendapatan Bisnis).'
      );
      router.back();
    } catch (e: unknown) {
      Alert.alert('Gagal Transfer', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Transfer Antar-Workspace (Berpasangan)
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.primarySoft }]}>
        <ShieldCheck size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textPrimary }]}>
          Transfer Personal ↔ Business membuat 2 transaksi saling terhubung. Di sisi Business, otomatis dijurnal ke Ekuitas (Setoran Modal / Prive), BUKAN sebagai Pendapatan Bisnis.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Arah Transfer</Text>
        <View style={styles.dirRow}>
          <TouchableOpacity
            onPress={() => setDirection('PERSONAL_TO_BUSINESS')}
            style={[
              styles.dirBtn,
              {
                backgroundColor:
                  direction === 'PERSONAL_TO_BUSINESS' ? colors.primary : colors.surfaceElevated,
              },
            ]}
          >
            <Text
              style={{
                color: direction === 'PERSONAL_TO_BUSINESS' ? '#FFF' : colors.textPrimary,
                fontWeight: '700',
                fontSize: 12,
              }}
            >
              Personal → Business
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDirection('BUSINESS_TO_PERSONAL')}
            style={[
              styles.dirBtn,
              {
                backgroundColor:
                  direction === 'BUSINESS_TO_PERSONAL' ? colors.secondary : colors.surfaceElevated,
              },
            ]}
          >
            <Text
              style={{
                color: direction === 'BUSINESS_TO_PERSONAL' ? '#FFF' : colors.textPrimary,
                fontWeight: '700',
                fontSize: 12,
              }}
            >
              Business → Personal
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Rekening Personal</Text>
        <View style={styles.chipRow}>
          {personalAccs.map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => setPersonalAccId(a.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: personalAccId === a.id ? colors.primary : colors.surfaceElevated,
                },
              ]}
            >
              <Text style={{ color: personalAccId === a.id ? '#FFF' : colors.textPrimary, fontWeight: '600' }}>
                {a.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Rekening Business</Text>
        <View style={styles.chipRow}>
          {businessAccs.map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => setBusinessAccId(a.id)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    businessAccId === a.id ? colors.secondary : colors.surfaceElevated,
                },
              ]}
            >
              <Text style={{ color: businessAccId === a.id ? '#FFF' : colors.textPrimary, fontWeight: '600' }}>
                {a.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Nominal Transfer</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Kurs Transfer (1.0 jika mata uang sama)
        </Text>
        <TextInput
          value={exchangeRate}
          onChangeText={setExchangeRate}
          keyboardType="numeric"
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Catatan</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
        />

        <TouchableOpacity
          onPress={handleTransfer}
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
        >
          <ArrowLeftRight size={18} color="#FFFFFF" />
          <Text style={styles.submitText}>Proses Transfer Berpasangan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingTop: 48,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 14,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  card: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  dirRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dirBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  submitBtn: {
    marginTop: 22,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});

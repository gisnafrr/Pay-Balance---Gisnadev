import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, RotateCcw, Trash2, ShieldAlert } from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { formatCurrency } from '@/utils/format';
import {
  permanentDeleteTransaction,
  restoreSoftDeletedTransaction,
} from '@/services/accounting.service';

export default function TrashModuleScreen() {
  const router = useRouter();
  const { themeMode, language, deletedTransactions, refreshAllData } = useAppStore();
  const colors = getThemeColors(themeMode);

  const handleRestore = async (id: string) => {
    await restoreSoftDeletedTransaction(id);
    await refreshAllData();
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await permanentDeleteTransaction(id);
      await refreshAllData();
    } catch (e: unknown) {
      Alert.alert(
        'Proteksi Histori Pembukuan',
        e instanceof Error ? e.message : 'Data tidak dapat dihapus permanen.'
      );
    }
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
          Trash & Recovery (Soft Delete)
        </Text>
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.warningSoft }]}>
        <ShieldAlert size={18} color={colors.warning} />
        <Text style={{ flex: 1, fontSize: 12, color: colors.textPrimary }}>
          Data Soft Delete dapat dipulihkan. Khusus jurnal akuntansi bisnis yang sudah POSTED, Permanent Delete ditolak sistem agar histori pembukuan tidak rusak.
        </Text>
      </View>

      {deletedTransactions.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.textMuted }}>Trash kosong. Belum ada transaksi yang dihapus.</Text>
        </View>
      ) : (
        deletedTransactions.map((tx) => (
          <View key={tx.id} style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{tx.title}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {tx.workspace_type} · {formatCurrency(tx.amount, tx.currency_code, language)}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => handleRestore(tx.id)}
                style={[styles.actBtn, { backgroundColor: colors.positiveSoft }]}
              >
                <RotateCcw size={14} color={colors.positive} />
                <Text style={{ color: colors.positive, fontWeight: '700', fontSize: 11.5 }}>
                  Restore
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handlePermanentDelete(tx.id)}
                style={[styles.actBtn, { backgroundColor: colors.negativeSoft }]}
              >
                <Trash2 size={14} color={colors.negative} />
                <Text style={{ color: colors.negative, fontWeight: '700', fontSize: 11.5 }}>
                  Hapus Permanen
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, paddingTop: 50, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800' },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 14,
    alignItems: 'center',
  },
  emptyCard: { padding: 24, borderRadius: RADIUS.md, alignItems: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  actions: { flexDirection: 'row', gap: 8 },
  actBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
});

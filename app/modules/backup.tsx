import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  DatabaseBackup,
  Lock,
  CheckCircle2,
  UploadCloud,
  FileSpreadsheet,
  Download,
} from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, SPACING } from '@/theme/colors';
import { FONTS } from '@/theme/typography';
import { GlassCard, LiquidMeshCanvas } from '@/components/ui/LiquidGlass';
import { FadeSlideIn, ScalePressable } from '@/components/ui/Motion';
import {
  downloadBackupArchive,
  exportAllDataToExcel,
  uploadAndRestoreBackup,
} from '@/services/export-backup.service';

export default function BackupModuleScreen() {
  const router = useRouter();
  const {
    themeMode,
    backups,
    attachments,
    transactions,
    journalEntries,
    accounts,
    coaList,
    budgets,
    debts,
    exchangeRates,
    createLocalBackup,
    refreshAllData,
  } = useAppStore();
  const colors = getThemeColors(themeMode);
  const [encPassword, setEncPassword] = useState('');
  const [busyMessage, setBusyMessage] = useState('');

  const handleBackup = async (type: 'NORMAL' | 'ENCRYPTED') => {
    if (type === 'ENCRYPTED' && !encPassword.trim()) {
      Alert.alert(
        'Masukkan Password Enkripsi',
        'Backup terenkripsi membutuhkan password agar data tetap aman.'
      );
      return;
    }
    try {
      setBusyMessage('Menyiapkan file backup...');
      await createLocalBackup(type, encPassword.trim() || undefined);
      const fileName = await downloadBackupArchive(type, encPassword.trim() || undefined);
      setBusyMessage('');
      Alert.alert(
        'Backup Berhasil Diunduh',
        `File "${fileName}" telah disimpan dan siap diunggah ke Google Drive atau perangkat lain.`
      );
    } catch (e: unknown) {
      setBusyMessage('');
      Alert.alert('Gagal Backup', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  };

  const handleUploadRestore = async () => {
    try {
      setBusyMessage('Memulihkan data dari file backup...');
      const restoredName = await uploadAndRestoreBackup(encPassword.trim() || undefined);
      setBusyMessage('');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        Alert.alert(
          'Restore Backup Berhasil!',
          `Data dari "${restoredName}" telah dipulihkan. Halaman akan dimuat ulang untuk menerapkan data.`
        );
        window.location.reload();
      } else {
        await refreshAllData();
        Alert.alert('Restore Backup Berhasil!', `Data dari "${restoredName}" telah dipulihkan.`);
      }
    } catch (e: unknown) {
      setBusyMessage('');
      Alert.alert('Gagal Restore', e instanceof Error ? e.message : 'File backup tidak valid.');
    }
  };

  const handleExportExcel = async () => {
    try {
      setBusyMessage('Menyusun workbook Excel (6 Sheet)...');
      const fileName = await exportAllDataToExcel({
        transactions,
        journalEntries,
        accounts,
        coaList,
        budgets,
        debts,
        exchangeRates,
      });
      setBusyMessage('');
      Alert.alert(
        'Export Excel (.xlsx) Berhasil',
        `File "${fileName}" berisi 6 sheet (Transaksi, Jurnal Umum, Rekening, COA, Anggaran, Utang/Piutang) berhasil dibuat.`
      );
    } catch (e: unknown) {
      setBusyMessage('');
      Alert.alert('Gagal Export Excel', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <LiquidMeshCanvas themeMode={themeMode}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <ScalePressable
            scaleTo={0.9}
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </ScalePressable>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Backup, Upload & Excel
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Export Excel (.xlsx), Download & Restore Backup
            </Text>
          </View>
        </View>

        {busyMessage ? (
          <View style={[styles.busyBanner, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.busyText, { color: colors.primary }]}>{busyMessage}</Text>
          </View>
        ) : null}

        {/* Card 1: Export Semua Data ke Excel (.xlsx Multi-Sheet) */}
        <FadeSlideIn delay={30}>
          <GlassCard
            themeMode={themeMode}
            borderRadius={22}
            style={{ marginBottom: 14 }}
            contentStyle={{ padding: 16 }}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.positiveSoft }]}>
                <FileSpreadsheet size={20} color={colors.positive} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Export Semua Data ke Excel (.xlsx)
                </Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                  6 Worksheet: Transaksi, Jurnal Umum (Dr/Cr), Rekening, COA, Anggaran & Utang/Piutang
                </Text>
              </View>
            </View>

            <ScalePressable onPress={handleExportExcel} style={{ marginTop: 14 }}>
              <LinearGradient
                colors={['#059669', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fullBtn}
              >
                <Download size={17} color="#FFFFFF" strokeWidth={2.3} />
                <Text style={styles.fullBtnText}>Download Laporan Excel (.xlsx)</Text>
              </LinearGradient>
            </ScalePressable>
          </GlassCard>
        </FadeSlideIn>

        {/* Card 2: Download & Upload Backup (.qoubackup) */}
        <FadeSlideIn delay={80}>
          <GlassCard
            themeMode={themeMode}
            borderRadius={22}
            style={{ marginBottom: 16 }}
            contentStyle={{ padding: 16 }}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Backup & Upload Restore (.qoubackup)
            </Text>
            <Text style={[styles.cardDesc, { color: colors.textMuted, marginTop: 3 }]}>
              Bundel Database SQLite + Lampiran Foto/PDF ({attachments.length} file). Masukkan password jika ingin membuat atau memulihkan Backup Terenkripsi.
            </Text>

            <TextInput
              value={encPassword}
              onChangeText={setEncPassword}
              secureTextEntry
              placeholder="Password Backup Terenkripsi (opsional untuk Normal)"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceElevated,
                },
              ]}
            />

            <ScalePressable onPress={() => handleBackup('NORMAL')} style={{ marginTop: 4 }}>
              <LinearGradient
                colors={['#2563EB', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fullBtn}
              >
                <DatabaseBackup size={17} color="#FFFFFF" />
                <Text style={styles.fullBtnText}>Download Backup Normal (.qoubackup)</Text>
              </LinearGradient>
            </ScalePressable>

            <ScalePressable onPress={() => handleBackup('ENCRYPTED')} style={{ marginTop: 10 }}>
              <LinearGradient
                colors={['#7C3AED', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fullBtn}
              >
                <Lock size={17} color="#FFFFFF" />
                <Text style={styles.fullBtnText}>Download Backup Terenkripsi</Text>
              </LinearGradient>
            </ScalePressable>

            <ScalePressable onPress={handleUploadRestore} style={{ marginTop: 10 }}>
              <View
                style={[
                  styles.uploadBtn,
                  {
                    backgroundColor: colors.primarySoft,
                    borderColor: `${colors.primary}45`,
                  },
                ]}
              >
                <UploadCloud size={18} color={colors.primary} strokeWidth={2.3} />
                <Text style={[styles.uploadBtnText, { color: colors.primary }]}>
                  Upload & Restore File Backup (.qoubackup)
                </Text>
              </View>
            </ScalePressable>
          </GlassCard>
        </FadeSlideIn>

        {/* Riwayat Backup */}
        <Text style={[styles.secTitle, { color: colors.textPrimary }]}>
          Riwayat Backup Lokal ({backups.length})
        </Text>

        {backups.map((b, idx) => (
          <FadeSlideIn key={b.id} delay={120 + idx * 40}>
            <GlassCard
              themeMode={themeMode}
              borderRadius={18}
              style={{ marginBottom: 10 }}
              contentStyle={styles.bkpRow}
            >
              <CheckCircle2 size={20} color={colors.positive} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bkpName, { color: colors.textPrimary }]}>
                  {b.file_name}
                </Text>
                <Text style={[styles.bkpMeta, { color: colors.textMuted }]}>
                  Tipe: {b.backup_type} · Lampiran: {b.attachment_count} file ·{' '}
                  {Math.round(b.size_bytes / 1024)} KB
                </Text>
              </View>
            </GlassCard>
          </FadeSlideIn>
        ))}
      </ScrollView>
    </LiquidMeshCanvas>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, paddingTop: 50, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: FONTS.extraBold, fontSize: 20, letterSpacing: -0.4 },
  subtitle: { fontFamily: FONTS.medium, fontSize: 12, marginTop: 1 },
  busyBanner: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  busyText: { fontFamily: FONTS.bold, fontSize: 12.5 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: FONTS.bold, fontSize: 15 },
  cardDesc: { fontFamily: FONTS.medium, fontSize: 12, lineHeight: 17, marginTop: 2 },
  input: {
    fontFamily: FONTS.medium,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginVertical: 12,
    fontSize: 13.5,
  },
  fullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13.5,
    borderRadius: 15,
  },
  fullBtnText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 13.5 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  uploadBtnText: { fontFamily: FONTS.bold, fontSize: 13 },
  secTitle: { fontFamily: FONTS.bold, fontSize: 15, marginBottom: 10 },
  bkpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  bkpName: { fontFamily: FONTS.bold, fontSize: 13.5 },
  bkpMeta: { fontFamily: FONTS.medium, fontSize: 11.5, marginTop: 2 },
});

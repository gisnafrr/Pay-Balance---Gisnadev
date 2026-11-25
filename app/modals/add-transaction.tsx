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
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  X,
  Camera,
  FileText,
  BookOpen,
  ArrowLeftRight,
  CheckCircle2,
  Wallet,
} from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { FONTS } from '@/theme/typography';
import { BUSINESS_WORKSPACE_ID, PERSONAL_WORKSPACE_ID } from '@/database/seeds';
import { createTransaction } from '@/services/accounting.service';
import { todayIsoDate } from '@/utils/format';
import { GlassCard, LiquidMeshCanvas } from '@/components/ui/LiquidGlass';
import { FadeSlideIn, ScalePressable } from '@/components/ui/Motion';

const QUICK_AMOUNTS = [50000, 100000, 250000, 500000, 1000000];

export default function AddTransactionModal() {
  const router = useRouter();
  const {
    themeMode,
    activeWorkspace,
    accounts,
    categories,
    refreshAllData,
  } = useAppStore();
  const colors = getThemeColors(themeMode);

  const [wsId, setWsId] = useState(
    activeWorkspace === 'BUSINESS' ? BUSINESS_WORKSPACE_ID : PERSONAL_WORKSPACE_ID
  );
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');

  const wsAccounts = accounts.filter((a) => a.workspace_id === wsId);
  const wsCategories = categories.filter(
    (c) => c.workspace_id === wsId && (txType === 'TRANSFER' || c.type === txType)
  );

  const [accountId, setAccountId] = useState(wsAccounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(wsAccounts[1]?.id || '');
  const [categoryId, setCategoryId] = useState(wsCategories[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [attachment, setAttachment] = useState<{
    file_name: string;
    file_rel_path: string;
    mime_type: string;
    file_size_bytes: number;
  } | null>(null);

  const switchWorkspace = (newWsId: string) => {
    setWsId(newWsId);
    const nextAccs = accounts.filter((a) => a.workspace_id === newWsId);
    const nextCats = categories.filter(
      (c) => c.workspace_id === newWsId && (txType === 'TRANSFER' || c.type === txType)
    );
    setAccountId(nextAccs[0]?.id || '');
    setToAccountId(nextAccs[1]?.id || '');
    setCategoryId(nextCats[0]?.id || '');
  };

  const handlePickCamera = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      const asset = res.assets[0];
      setAttachment({
        file_name: asset.fileName || `bukti_${Date.now()}.jpg`,
        file_rel_path: asset.uri,
        mime_type: asset.mimeType || 'image/jpeg',
        file_size_bytes: asset.fileSize || 125000,
      });
    }
  };

  const handlePickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
    });
    if (!res.canceled && res.assets?.[0]) {
      const doc = res.assets[0];
      setAttachment({
        file_name: doc.name,
        file_rel_path: doc.uri,
        mime_type: doc.mimeType || 'application/pdf',
        file_size_bytes: doc.size || 180000,
      });
    }
  };

  const handleSubmit = async () => {
    const numericAmount = Number(amount.replace(/[^0-9.]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Nominal Tidak Valid', 'Masukkan nominal transaksi lebih dari 0.');
      return;
    }
    if (!accountId) {
      Alert.alert('Pilih Rekening', 'Pilih rekening sumber transaksi.');
      return;
    }

    try {
      await createTransaction({
        workspace_id: wsId,
        type: txType,
        account_id: accountId,
        to_account_id: txType === 'TRANSFER' ? toAccountId : null,
        category_id: txType === 'TRANSFER' ? null : categoryId,
        amount: numericAmount,
        transaction_date: date,
        title: title.trim() || (txType === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'),
        notes: notes.trim() || undefined,
        attachment,
      });
      await refreshAllData();
      router.back();
    } catch (e: unknown) {
      Alert.alert('Gagal Menyimpan', e instanceof Error ? e.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <LiquidMeshCanvas themeMode={themeMode}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean Header */}
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Catat Transaksi
            </Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              {wsId === BUSINESS_WORKSPACE_ID
                ? 'Business Workspace · Auto Double-Entry'
                : 'Personal Workspace · Pencatatan Cepat'}
            </Text>
          </View>
          <ScalePressable
            scaleTo={0.9}
            onPress={() => router.back()}
            style={[styles.closeCircle, { backgroundColor: colors.surface }]}
          >
            <X size={20} color={colors.textPrimary} />
          </ScalePressable>
        </View>

        {/* Workspace Pill Switcher (Single-Line, Never Wraps Awkwardly) */}
        <GlassCard themeMode={themeMode} borderRadius={18} style={{ marginBottom: 12 }}>
          <View style={styles.wsSwitchWrap}>
            <TouchableOpacity
              onPress={() => switchWorkspace(PERSONAL_WORKSPACE_ID)}
              style={[
                styles.wsTab,
                wsId === PERSONAL_WORKSPACE_ID && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.wsTabText,
                  { color: wsId === PERSONAL_WORKSPACE_ID ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Personal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => switchWorkspace(BUSINESS_WORKSPACE_ID)}
              style={[
                styles.wsTab,
                wsId === BUSINESS_WORKSPACE_ID && { backgroundColor: colors.secondary },
              ]}
            >
              <Text
                style={[
                  styles.wsTabText,
                  { color: wsId === BUSINESS_WORKSPACE_ID ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Business (Double-Entry)
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Hero Amount Liquid Glass Card */}
        <FadeSlideIn delay={40}>
          <GlassCard
            themeMode={themeMode}
            borderRadius={24}
            style={{ marginBottom: 14 }}
            contentStyle={styles.amountHero}
          >
            {/* Type Selector */}
            <View style={[styles.typeBar, { backgroundColor: colors.surfaceElevated }]}>
              {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((tKey) => {
                const active = txType === tKey;
                const activeBg =
                  tKey === 'INCOME'
                    ? colors.positive
                    : tKey === 'EXPENSE'
                    ? colors.negative
                    : colors.warning;
                return (
                  <TouchableOpacity
                    key={tKey}
                    onPress={() => setTxType(tKey)}
                    style={[styles.typeBtn, active && { backgroundColor: activeBg }]}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        { color: active ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {tKey === 'EXPENSE'
                        ? 'Pengeluaran'
                        : tKey === 'INCOME'
                        ? 'Pemasukan'
                        : 'Transfer'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Centered Big Amount Input */}
            <Text style={[styles.amountCaption, { color: colors.textMuted }]}>
              Nominal Transaksi
            </Text>
            <View style={styles.amountInputRow}>
              <Text style={[styles.currencyPrefix, { color: colors.primary }]}>Rp</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                style={[styles.bigAmountInput, { color: colors.textPrimary }]}
              />
            </View>

            {/* Quick Amount Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.quickAmtRow}>
                {QUICK_AMOUNTS.map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setAmount(String(val))}
                    style={[
                      styles.quickAmtChip,
                      {
                        backgroundColor: colors.primarySoft,
                      },
                    ]}
                  >
                    <Text style={[styles.quickAmtText, { color: colors.primary }]}>
                      +{val >= 1000000 ? `${val / 1000000}jt` : `${val / 1000}rb`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </GlassCard>
        </FadeSlideIn>

        {/* Details Liquid Glass Card */}
        <FadeSlideIn delay={90}>
          <GlassCard
            themeMode={themeMode}
            borderRadius={24}
            style={{ marginBottom: 14 }}
            contentStyle={{ padding: 16 }}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Judul / Keterangan
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Misal: Penjualan Produk / Kopi & Makan"
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

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Rekening / Dompet
            </Text>
            <View style={styles.chipWrap}>
              {wsAccounts.map((acc) => {
                const active = accountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setAccountId(acc.id)}
                    style={[
                      styles.selectChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surfaceElevated,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Wallet size={13} color={active ? '#FFFFFF' : colors.textSecondary} />
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {txType !== 'TRANSFER' && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Kategori
                </Text>
                <View style={styles.chipWrap}>
                  {wsCategories.map((cat) => {
                    const active = categoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setCategoryId(cat.id)}
                        style={[
                          styles.selectChip,
                          {
                            backgroundColor: active ? colors.secondary : colors.surfaceElevated,
                            borderColor: active ? colors.secondary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: active ? '#FFFFFF' : colors.textPrimary },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {wsId === BUSINESS_WORKSPACE_ID && (
              <View style={[styles.autoJournalPreview, { backgroundColor: colors.positiveSoft }]}>
                <CheckCircle2 size={16} color={colors.positive} />
                <Text style={[styles.autoJournalText, { color: colors.textPrimary }]}>
                  Auto Double-Entry: Jurnal Debit & Kredit otomatis diposting ke Buku Besar.
                </Text>
              </View>
            )}

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Tanggal</Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  style={[
                    styles.input,
                    {
                      color: colors.textPrimary,
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceElevated,
                    },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Catatan</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Opsional"
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
              </View>
            </View>

            {/* Lampiran Bukti */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Bukti Transaksi (Foto / PDF)
            </Text>
            <View style={styles.attachRow}>
              <TouchableOpacity
                onPress={handlePickCamera}
                style={[
                  styles.attachBtn,
                  { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Camera size={16} color={colors.primary} />
                <Text style={[styles.attachText, { color: colors.textPrimary }]}>
                  Foto / Galeri
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePickDocument}
                style={[
                  styles.attachBtn,
                  { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                ]}
              >
                <FileText size={16} color={colors.secondary} />
                <Text style={[styles.attachText, { color: colors.textPrimary }]}>
                  Pilih PDF
                </Text>
              </TouchableOpacity>
            </View>
            {attachment && (
              <Text style={[styles.attachedLabel, { color: colors.positive }]}>
                ✓ Terlampir: {attachment.file_name}
              </Text>
            )}
          </GlassCard>
        </FadeSlideIn>

        {/* Secondary Modes (Manual Journal & Inter-Workspace Transfer) */}
        <View style={styles.shortcutRow}>
          <ScalePressable
            onPress={() => {
              router.back();
              setTimeout(() => router.push('/modals/add-journal' as never), 150);
            }}
            style={{ flex: 1 }}
          >
            <GlassCard themeMode={themeMode} borderRadius={16} contentStyle={styles.shortcutTile}>
              <BookOpen size={16} color={colors.primary} />
              <Text style={[styles.shortcutText, { color: colors.textPrimary }]}>
                Jurnal Manual Dr/Cr
              </Text>
            </GlassCard>
          </ScalePressable>

          <ScalePressable
            onPress={() => {
              router.back();
              setTimeout(() => router.push('/modals/workspace-transfer' as never), 150);
            }}
            style={{ flex: 1 }}
          >
            <GlassCard themeMode={themeMode} borderRadius={16} contentStyle={styles.shortcutTile}>
              <ArrowLeftRight size={16} color={colors.secondary} />
              <Text style={[styles.shortcutText, { color: colors.textPrimary }]}>
                Transfer Workspace
              </Text>
            </GlassCard>
          </ScalePressable>
        </View>

        {/* Primary Liquid Gradient Submit CTA */}
        <ScalePressable onPress={handleSubmit} style={{ marginTop: 14 }}>
          <LinearGradient
            colors={
              wsId === BUSINESS_WORKSPACE_ID
                ? ['#2563EB', '#0D9488']
                : ['#7C3AED', '#4F46E5']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            <Text style={styles.submitText}>
              {wsId === BUSINESS_WORKSPACE_ID
                ? 'Simpan & Posting Jurnal Otomatis'
                : 'Simpan Transaksi'}
            </Text>
          </LinearGradient>
        </ScalePressable>
      </ScrollView>
    </LiquidMeshCanvas>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingTop: 48,
    paddingBottom: 42,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginTop: 2,
  },
  closeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wsSwitchWrap: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  wsTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  wsTabText: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
  },
  amountHero: {
    padding: 16,
  },
  typeBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 11,
    alignItems: 'center',
  },
  typeBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
  },
  amountCaption: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 6,
  },
  currencyPrefix: {
    fontFamily: FONTS.bold,
    fontSize: 22,
  },
  bigAmountInput: {
    fontFamily: FONTS.extraBold,
    fontSize: 36,
    letterSpacing: -1,
    minWidth: 90,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  quickAmtRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickAmtChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  quickAmtText: {
    fontFamily: FONTS.bold,
    fontSize: 11.5,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    fontFamily: FONTS.medium,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13.5,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
  autoJournalPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: 13,
    marginTop: 14,
  },
  autoJournalText: {
    fontFamily: FONTS.semiBold,
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  attachRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1,
  },
  attachText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
  attachedLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    marginTop: 6,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcutTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  shortcutText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  submitBtn: {
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
  },
  submitText: {
    fontFamily: FONTS.extraBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
});

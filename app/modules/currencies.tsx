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
import { ArrowLeft, RefreshCw, Plus, Globe } from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { FONTS } from '@/theme/typography';
import { formatCurrency } from '@/utils/format';
import { GlassCard, LiquidMeshCanvas } from '@/components/ui/LiquidGlass';
import { FadeSlideIn, ScalePressable } from '@/components/ui/Motion';

const CURRENCY_DEFAULTS: Record<string, string> = {
  USD: '15850',
  SGD: '11800',
  EUR: '16900',
  MYR: '3550',
};

export default function CurrenciesModuleScreen() {
  const router = useRouter();
  const { themeMode, language, exchangeRates, upsertExchangeRate } = useAppStore();
  const colors = getThemeColors(themeMode);

  const [fromCur, setFromCur] = useState('USD');
  const [rateVal, setRateVal] = useState('15850');

  const handleSelectCurrency = (code: string) => {
    setFromCur(code);
    const latest = exchangeRates.find((fx) => fx.from_currency === code);
    setRateVal(latest ? String(latest.rate) : CURRENCY_DEFAULTS[code] || '10000');
  };

  const handleManualSave = async () => {
    const r = Number(rateVal.replace(/[^0-9.]/g, ''));
    if (!r || r <= 0) {
      Alert.alert('Kurs Tidak Valid', 'Masukkan nilai kurs lebih dari 0.');
      return;
    }
    await upsertExchangeRate(fromCur, r, 'MANUAL');
    Alert.alert('Kurs Disimpan', `Kurs 1 ${fromCur} = Rp${r.toLocaleString('id-ID')} tersimpan.`);
  };

  const handleAutoSync = async () => {
    await upsertExchangeRate('USD', 15890, 'AUTO');
    await upsertExchangeRate('SGD', 11840, 'AUTO');
    await upsertExchangeRate('EUR', 16950, 'AUTO');
    await upsertExchangeRate('MYR', 3580, 'AUTO');
    Alert.alert(
      'Sinkronisasi Kurs Otomatis',
      'Kurs terbaru telah diperbarui dan disimpan lokal untuk mode offline.'
    );
  };

  return (
    <LiquidMeshCanvas themeMode={themeMode}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean Header */}
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
              Multi-Currency & Kurs
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Konversi otomatis ke mata uang utama (IDR)
            </Text>
          </View>
        </View>

        {/* Form Input Kurs (Liquid Glass) */}
        <FadeSlideIn delay={30}>
          <GlassCard
            themeMode={themeMode}
            borderRadius={24}
            style={{ marginBottom: 18 }}
            contentStyle={{ padding: 16 }}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Pilih Mata Uang Asing
            </Text>
            <View style={styles.currencyRow}>
              {(['USD', 'SGD', 'EUR', 'MYR'] as const).map((c) => {
                const active = fromCur === c;
                return (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={0.8}
                    onPress={() => handleSelectCurrency(c)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.surfaceElevated,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Nilai Tukar (1 {fromCur} dalam Rupiah)
            </Text>
            <View
              style={[
                styles.inputWrap,
                { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
              ]}
            >
              <Text style={[styles.prefix, { color: colors.primary }]}>Rp</Text>
              <TextInput
                value={rateVal}
                onChangeText={setRateVal}
                keyboardType="numeric"
                placeholder="15850"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.textPrimary }]}
              />
            </View>

            {/* Clean Full-Width Stacked / Balanced Action Buttons (No Cramped Wrapping) */}
            <ScalePressable onPress={handleManualSave} style={{ marginTop: 14 }}>
              <LinearGradient
                colors={['#7C3AED', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <Plus size={17} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.primaryBtnText}>Simpan Kurs Manual</Text>
              </LinearGradient>
            </ScalePressable>

            <ScalePressable onPress={handleAutoSync} style={{ marginTop: 10 }}>
              <View
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: colors.secondarySoft, borderColor: `${colors.secondary}35` },
                ]}
              >
                <RefreshCw size={16} color={colors.secondary} strokeWidth={2.3} />
                <Text style={[styles.secondaryBtnText, { color: colors.secondary }]}>
                  Sinkronkan Kurs Otomatis (Offline Cache)
                </Text>
              </View>
            </ScalePressable>
          </GlassCard>
        </FadeSlideIn>

        {/* Riwayat Kurs */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Riwayat Kurs Tersimpan
        </Text>

        {exchangeRates.map((fx, idx) => (
          <FadeSlideIn key={fx.id} delay={70 + idx * 45}>
            <GlassCard
              themeMode={themeMode}
              borderRadius={18}
              style={{ marginBottom: 10 }}
              contentStyle={styles.fxRow}
            >
              <View style={[styles.fxIcon, { backgroundColor: colors.primarySoft }]}>
                <Globe size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fxRate, { color: colors.textPrimary }]}>
                  1 {fx.from_currency} = {formatCurrency(fx.rate, fx.to_currency, language)}
                </Text>
                <Text style={[styles.fxMeta, { color: colors.textMuted }]}>
                  Efektif: {fx.effective_date}
                </Text>
              </View>
              <View
                style={[
                  styles.sourcePill,
                  {
                    backgroundColor:
                      fx.source === 'AUTO' ? colors.positiveSoft : colors.secondarySoft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sourceText,
                    { color: fx.source === 'AUTO' ? colors.positive : colors.secondary },
                  ]}
                >
                  {fx.source}
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
  label: { fontFamily: FONTS.semiBold, fontSize: 12, marginBottom: 8, marginTop: 4 },
  currencyRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: { fontFamily: FONTS.bold, fontSize: 13 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
  },
  prefix: { fontFamily: FONTS.bold, fontSize: 15 },
  input: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13.5,
    borderRadius: 15,
  },
  primaryBtnText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 14 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12.5,
    borderRadius: 15,
    borderWidth: 1,
  },
  secondaryBtnText: { fontFamily: FONTS.bold, fontSize: 13 },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15.5,
    marginBottom: 10,
  },
  fxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  fxIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fxRate: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  fxMeta: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
    marginTop: 2,
  },
  sourcePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  sourceText: {
    fontFamily: FONTS.extraBold,
    fontSize: 10.5,
  },
});

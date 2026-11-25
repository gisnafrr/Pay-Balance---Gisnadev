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
import { ArrowLeft, Plus, AlertTriangle } from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { CHART_PALETTE, getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { FONTS } from '@/theme/typography';
import { CircularProgressRing } from '@/components/charts/SvgCharts';
import { GlassCard, LiquidMeshCanvas } from '@/components/ui/LiquidGlass';
import { FadeSlideIn, ScalePressable } from '@/components/ui/Motion';
import { formatCurrency } from '@/utils/format';
import { BUSINESS_WORKSPACE_ID, PERSONAL_WORKSPACE_ID } from '@/database/seeds';

export default function BudgetsModuleScreen() {
  const router = useRouter();
  const {
    themeMode,
    language,
    activeWorkspace,
    budgets,
    categories,
    createBudget,
  } = useAppStore();
  const colors = getThemeColors(themeMode);

  const wsId =
    activeWorkspace === 'BUSINESS' ? BUSINESS_WORKSPACE_ID : PERSONAL_WORKSPACE_ID;
  const wsCats = categories.filter((c) => c.workspace_id === wsId && c.type === 'EXPENSE');

  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [catId, setCatId] = useState<string | null>(wsCats[0]?.id || null);

  const handleAdd = async () => {
    const cleanAmt = Number(limit.replace(/[^0-9]/g, ''));
    if (!name.trim() || !cleanAmt || cleanAmt <= 0) {
      Alert.alert(
        'Lengkapi Data Anggaran',
        'Masukkan nama anggaran dan nominal batas anggaran lebih dari 0.'
      );
      return;
    }
    await createBudget({
      workspace_id: wsId,
      name: name.trim(),
      category_id: catId,
      amount_limit: cleanAmt,
    });
    setName('');
    setLimit('');
  };

  return (
    <LiquidMeshCanvas themeMode={themeMode}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
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
              Budgets & Goals
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Pantau batas pengeluaran per kategori
            </Text>
          </View>
        </View>

        {/* Add Budget Form */}
        <FadeSlideIn delay={30}>
          <GlassCard
            themeMode={themeMode}
            borderRadius={22}
            style={{ marginBottom: 16 }}
            contentStyle={{ padding: 16 }}
          >
            <Text style={[styles.secTitle, { color: colors.textPrimary }]}>
              Buat Anggaran Baru
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nama Anggaran (mis. Dana Liburan / Belanja)"
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
            <TextInput
              value={limit}
              onChangeText={setLimit}
              keyboardType="numeric"
              placeholder="Batas Anggaran (mis. 1500000)"
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

            {wsCats.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {wsCats.map((cat) => {
                    const active = catId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setCatId(cat.id)}
                        style={[
                          styles.catChip,
                          {
                            backgroundColor: active ? colors.primary : colors.surfaceElevated,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontFamily: FONTS.semiBold,
                            fontSize: 12,
                            color: active ? '#FFFFFF' : colors.textPrimary,
                          }}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            <ScalePressable onPress={handleAdd}>
              <LinearGradient
                colors={['#7C3AED', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                <Plus size={16} color="#FFF" />
                <Text style={styles.btnText}>Simpan Anggaran</Text>
              </LinearGradient>
            </ScalePressable>
          </GlassCard>
        </FadeSlideIn>

        {/* Budget Cards with Circular Progress Ring */}
        {budgets.map((b, idx) => {
          const spent = Number(b.spent_amount || 0);
          const limitAmt = Number(b.amount_limit || 0);
          const pct = limitAmt > 0 ? Math.round((spent / limitAmt) * 100) : 0;
          const remaining = Math.max(0, limitAmt - spent);
          const ringColor =
            pct >= b.alert_threshold_percent
              ? colors.negative
              : CHART_PALETTE[idx % CHART_PALETTE.length];

          return (
            <FadeSlideIn key={b.id} delay={60 + idx * 60}>
              <GlassCard
                themeMode={themeMode}
                borderRadius={20}
                style={{ marginBottom: 12 }}
                contentStyle={{ padding: 16 }}
              >
                <View style={styles.budgetRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bName, { color: colors.textPrimary }]}>
                      {b.name || 'Anggaran'}
                    </Text>
                    {b.category_name ? (
                      <Text style={[styles.bCat, { color: colors.primary }]}>
                        Kategori: {b.category_name}
                      </Text>
                    ) : null}
                    <Text style={[styles.bMeta, { color: colors.textSecondary }]}>
                      Terpakai {formatCurrency(spent, b.currency_code || 'IDR', language)}{' '}
                      <Text style={{ color: colors.textMuted }}>
                        dari {formatCurrency(limitAmt, b.currency_code || 'IDR', language)}
                      </Text>
                    </Text>
                    <Text style={[styles.bRemain, { color: colors.positive }]}>
                      Sisa: {formatCurrency(remaining, b.currency_code || 'IDR', language)}
                    </Text>
                  </View>

                  <CircularProgressRing
                    percent={pct}
                    color={ringColor}
                    textColor={colors.textPrimary}
                  />
                </View>

                {pct >= b.alert_threshold_percent && (
                  <View style={[styles.alertBanner, { backgroundColor: colors.negative }]}>
                    <AlertTriangle size={14} color="#FFFFFF" />
                    <Text style={styles.alertText}>
                      Melebihi ambang peringatan ({b.alert_threshold_percent}%)
                    </Text>
                  </View>
                )}
              </GlassCard>
            </FadeSlideIn>
          );
        })}
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
  secTitle: { fontFamily: FONTS.bold, fontSize: 15, marginBottom: 10 },
  input: {
    fontFamily: FONTS.medium,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 13.5,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 15,
  },
  btnText: { fontFamily: FONTS.bold, color: '#FFF', fontSize: 14 },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bName: { fontFamily: FONTS.bold, fontSize: 15 },
  bCat: { fontFamily: FONTS.semiBold, fontSize: 11.5, marginTop: 2 },
  bMeta: { fontFamily: FONTS.medium, fontSize: 12.5, marginTop: 5 },
  bRemain: { fontFamily: FONTS.bold, fontSize: 12, marginTop: 3 },
  alertBanner: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 11.5 },
});

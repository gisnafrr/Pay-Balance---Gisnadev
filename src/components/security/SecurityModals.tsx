import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ShieldCheck, Sparkles, Lock, Fingerprint, CheckCircle2 } from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';

export function OnboardingModal({ visible }: { visible: boolean }) {
  const { themeMode, completeOnboarding } = useAppStore();
  const colors = getThemeColors(themeMode);

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('Alex Qoupay');
  const [businessName, setBusinessName] = useState('Qoupay Studio & Retail');
  const [baseCurrency, setBaseCurrency] = useState('IDR');
  const [pin, setPin] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  const handleFinish = async () => {
    await completeOnboarding({
      fullName: fullName.trim() || 'Pengguna Qoupay',
      businessName: businessName.trim() || 'Bisnis Saya',
      baseCurrency,
      pin: pin.trim(),
      biometricEnabled,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.container}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <Sparkles size={34} color="#FFFFFF" />
          <Text style={styles.heroTitle}>Qoupay Financial & Accounting</Text>
          <Text style={styles.heroSub}>
            Personal Finance Sederhana + Pembukuan Bisnis Double-Entry (Offline-First)
          </Text>
          <View style={styles.stepDots}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.dot,
                  { backgroundColor: step === s ? '#FFFFFF' : 'rgba(255,255,255,0.35)', width: step === s ? 26 : 10 },
                ]}
              />
            ))}
          </View>
        </View>

        {step === 1 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              1. Identitas & Workspace Anda
            </Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Kami menyiapkan 2 Workspace terpisah (Personal & Business) ditambah Combined Overview.
            </Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Lengkap (Personal)</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
              placeholder="Nama Anda"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Nama Usaha (Business Workspace)</Text>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
              placeholder="Nama Bisnis / UMKM"
            />

            <TouchableOpacity
              onPress={() => setStep(2)}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.primaryBtnText}>Lanjut ke Mata Uang & COA</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              2. Mata Uang Utama & Template COA UMKM
            </Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Pilih Base Currency untuk konversi otomatis di Combined Dashboard. Template 20 Akun COA Standar UMKM (Aset, Liabilitas, Ekuitas, Pendapatan, Beban) sudah diaktifkan.
            </Text>

            <View style={styles.currencyRow}>
              {['IDR', 'USD', 'SGD', 'EUR'].map((cur) => {
                const active = baseCurrency === cur;
                return (
                  <TouchableOpacity
                    key={cur}
                    onPress={() => setBaseCurrency(cur)}
                    style={[
                      styles.currencyChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surfaceElevated,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontWeight: '700' }}>
                      {cur}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.positiveSoft }]}>
              <CheckCircle2 size={18} color={colors.positive} />
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                Double-Entry Bookkeeping aktif untuk Business Finance (Jurnal Umum, Buku Besar, Neraca Saldo, Laba Rugi, Neraca, Arus Kas).
              </Text>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Kembali</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setStep(3)}
                style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.primary, marginTop: 0 }]}
              >
                <Text style={styles.primaryBtnText}>Lanjut ke Keamanan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              3. Keamanan PIN & Biometrik
            </Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Lindungi data keuangan lokal Anda dengan PIN (opsional, kosongkan jika tidak ingin kunci otomatis saat startup) dan Biometrik.
            </Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              PIN Keamanan (4-6 Digit, atau kosongkan untuk akses cepat)
            </Text>
            <TextInput
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
              placeholder="Contoh: 1234"
            />

            <View style={styles.switchRow}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', flex: 1 }}>
                Aktifkan Fingerprint / Face Unlock
              </Text>
              <Switch value={biometricEnabled} onValueChange={setBiometricEnabled} />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                onPress={() => setStep(2)}
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Kembali</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFinish}
                style={[styles.primaryBtn, { flex: 1, backgroundColor: colors.primary, marginTop: 0 }]}
              >
                <Text style={styles.primaryBtnText}>Mulai Gunakan Aplikasi</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </Modal>
  );
}

export function PinLockModal({ visible }: { visible: boolean }) {
  const { themeMode, unlockApp, profile } = useAppStore();
  const colors = getThemeColors(themeMode);
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (unlockApp(enteredPin)) {
      setEnteredPin('');
      setError('');
    } else {
      setError('PIN tidak sesuai. Silakan coba lagi.');
    }
  };

  const handleBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        unlockApp(profile?.pin_hash || '');
        return;
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Buka Kunci Qoupay Finance',
      });
      if (res.success) {
        unlockApp(profile?.pin_hash || '');
      }
    } catch {
      setError('Gunakan PIN untuk membuka aplikasi.');
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={[styles.lockContainer, { backgroundColor: colors.heroPersonal }]}>
        <View style={styles.lockCard}>
          <View style={styles.lockIconCircle}>
            <Lock size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.lockTitle}>Aplikasi Terkunci</Text>
          <Text style={styles.lockSub}>Masukkan PIN Keamanan Qoupay Anda</Text>

          <TextInput
            value={enteredPin}
            onChangeText={setEnteredPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            placeholder="••••"
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={styles.pinInput}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity onPress={handleVerify} style={styles.unlockBtn}>
            <ShieldCheck size={18} color="#7C3AED" />
            <Text style={styles.unlockBtnText}>Buka Kunci</Text>
          </TouchableOpacity>

          {profile?.biometric_enabled ? (
            <TouchableOpacity onPress={handleBiometric} style={styles.bioBtn}>
              <Fingerprint size={20} color="#FFFFFF" />
              <Text style={styles.bioText}>Gunakan Biometrik</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingTop: 52,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  primaryBtn: {
    marginTop: 22,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  currencyChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.sm,
    marginTop: 10,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  lockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  lockIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  lockSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  pinInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    letterSpacing: 8,
  },
  errorText: {
    color: '#FECACA',
    fontSize: 12.5,
    marginTop: 8,
  },
  unlockBtn: {
    marginTop: 18,
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  unlockBtnText: {
    color: '#7C3AED',
    fontSize: 15,
    fontWeight: '700',
  },
  bioBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  bioText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
});

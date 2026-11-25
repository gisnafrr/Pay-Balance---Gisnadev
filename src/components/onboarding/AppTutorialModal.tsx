import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Layers,
  BookOpen,
  ArrowLeftRight,
  ShieldCheck,
  ChevronRight,
  X,
  Check,
} from 'lucide-react-native';
import { FONTS } from '@/theme/typography';
import { GlassCard } from '@/components/ui/LiquidGlass';
import { ScalePressable } from '@/components/ui/Motion';

const TUTORIAL_SLIDES = [
  {
    id: 'workspaces',
    badge: 'Langkah 1 dari 4 · Pengenalan',
    title: 'Pisahkan Keuangan Pribadi & Bisnis dalam 1 Tap',
    desc: 'Gunakan Workspace Switcher di bagian atas untuk berpindah antara Personal Finance (simpel), Business Finance (akuntansi), dan Combined Overview (ringkasan total aset gabungan).',
    gradient: ['#6D28D9', '#4F46E5'] as [string, string],
    icon: Layers,
    previewItems: [
      { label: 'Personal Finance', value: 'Rp8.250.000', tag: 'Simpel' },
      { label: 'Business Finance', value: 'Rp17.500.000', tag: 'Double-Entry' },
    ],
  },
  {
    id: 'double-entry',
    badge: 'Langkah 2 dari 4 · Akuntansi Bisnis',
    title: 'Pembukuan Double-Entry Otomatis & Manual',
    desc: 'Catat penjualan atau beban bisnis secara cepat — sistem otomatis membuat pasangan Debit & Kredit yang seimbang, lengkap dengan Jurnal Umum, Buku Besar, Neraca Saldo, Laba Rugi, Neraca, dan Arus Kas.',
    gradient: ['#1D4ED8', '#0D9488'] as [string, string],
    icon: BookOpen,
    previewItems: [
      { label: 'DEBIT · 1-1001 Kas', value: 'Rp500.000', tag: 'Aset +' },
      { label: 'KREDIT · 4-1001 Penjualan', value: 'Rp500.000', tag: 'Seimbang ✓' },
    ],
  },
  {
    id: 'paired-transfer',
    badge: 'Langkah 3 dari 4 · Transfer Berpasangan',
    title: 'Transfer Personal ↔ Business Tidak Merusak Laba Rugi',
    desc: 'Saat mengirim dana dari Personal ke Business, kedua workspace otomatis terhubung. Di sisi Business, dana dicatat sebagai Setoran Modal / Prive (Ekuitas), bukan pendapatan.',
    gradient: ['#7C3AED', '#2563EB'] as [string, string],
    icon: ArrowLeftRight,
    previewItems: [
      { label: 'Personal → Transfer Keluar', value: '- Rp1.000.000', tag: 'Paired' },
      { label: 'Business → Setoran Modal', value: '+ Rp1.000.000', tag: 'Ekuitas' },
    ],
  },
  {
    id: 'offline-safe',
    badge: 'Langkah 4 dari 4 · Privasi & Backup',
    title: '100% Local-First, Bukti Foto/PDF & Trash Recovery',
    desc: 'Semua data tersimpan aman di perangkat Anda tanpa server. Dilengkapi lampiran struk/PDF, Soft Delete (Trash) yang bisa dipulihkan, serta Backup Terenkripsi AES-256.',
    gradient: ['#0F766E', '#4338CA'] as [string, string],
    icon: ShieldCheck,
    previewItems: [
      { label: 'SQLite ACID + Bukti PDF/Foto', value: 'Offline Ready', tag: 'Aman' },
      { label: 'Jurnal Posted Terkunci', value: 'Jurnal Pembalik', tag: 'Audit' },
    ],
  },
];

export function AppTutorialModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const slide = TUTORIAL_SLIDES[index];
  const IconComp = slide.icon;

  const animateStep = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -16,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIndex(nextIndex);
      slideAnim.setValue(18);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (index < TUTORIAL_SLIDES.length - 1) {
      animateStep(index + 1);
    } else {
      setIndex(0);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <LinearGradient
          colors={slide.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sheet}
        >
          {/* Top Bar */}
          <View style={styles.topRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{slide.badge}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Animated Slide Content */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <View style={styles.iconGlass}>
              <IconComp size={34} color="#FFFFFF" strokeWidth={2} />
            </View>

            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.desc}>{slide.desc}</Text>

            {/* Mini Interactive Liquid Glass Preview */}
            <GlassCard
              themeMode="dark"
              tintColor="rgba(255,255,255,0.14)"
              borderRadius={20}
              contentStyle={styles.previewBox}
            >
              {slide.previewItems.map((item, i) => (
                <View
                  key={item.label}
                  style={[
                    styles.previewRow,
                    i > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)', paddingTop: 10, marginTop: 10 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewLabel}>{item.label}</Text>
                    <Text style={styles.previewVal}>{item.value}</Text>
                  </View>
                  <View style={styles.previewTag}>
                    <Text style={styles.previewTagText}>{item.tag}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </Animated.View>

          {/* Bottom Progress Dots & Next Button */}
          <View style={styles.footer}>
            <View style={styles.dotsRow}>
              {TUTORIAL_SLIDES.map((s, i) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => animateStep(i)}
                  style={[
                    styles.dot,
                    {
                      width: i === index ? 26 : 8,
                      backgroundColor: i === index ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                    },
                  ]}
                />
              ))}
            </View>

            <ScalePressable onPress={handleNext} style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>
                {index === TUTORIAL_SLIDES.length - 1 ? 'Mulai Sekarang' : 'Lanjut'}
              </Text>
              {index === TUTORIAL_SLIDES.length - 1 ? (
                <Check size={18} color="#4C1D95" strokeWidth={2.5} />
              ) : (
                <ChevronRight size={18} color="#4C1D95" strokeWidth={2.5} />
              )}
            </ScalePressable>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 11, 20, 0.72)',
    justifyContent: 'center',
    padding: 18,
  },
  sheet: {
    borderRadius: 30,
    padding: 22,
    minHeight: 540,
    maxHeight: 640,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  stepBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  skipBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlass: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 23,
    color: '#FFFFFF',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  desc: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 18,
  },
  previewBox: {
    padding: 14,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  previewVal: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  previewTag: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  previewTagText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    color: '#4C1D95',
  },
});

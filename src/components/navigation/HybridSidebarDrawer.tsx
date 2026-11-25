import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Wallet,
  BookOpen,
  FileSpreadsheet,
  Scale,
  TrendingUp,
  Landmark,
  Target,
  HandCoins,
  Globe,
  Trash2,
  DatabaseBackup,
  X,
  Briefcase,
  User,
  Layers,
  ShieldCheck,
} from 'lucide-react-native';
import { useAppStore } from '@/stores/useAppStore';
import { getThemeColors, RADIUS, SPACING } from '@/theme/colors';
import { ActiveWorkspaceMode } from '@/types/domain';

export function HybridSidebarDrawer({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const {
    themeMode,
    activeWorkspace,
    setActiveWorkspace,
    profile,
    deletedTransactions,
  } = useAppStore();
  const colors = getThemeColors(themeMode);

  const slideAnim = useRef(new Animated.Value(-340)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(-340);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropOpacity]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -340,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const navigateTo = (path: string) => {
    handleClose();
    router.push(path as never);
  };

  const switchWs = (mode: ActiveWorkspaceMode) => {
    setActiveWorkspace(mode);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
        <Animated.View
          style={[
            styles.drawer,
            { backgroundColor: colors.surface, transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Header Profile & Offline Status */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <View style={styles.headerTopRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(profile?.full_name || 'Q').slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{profile?.full_name || 'Alex Qoupay'}</Text>
                <Text style={styles.bizName}>{profile?.business_name || 'Qoupay Studio'}</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.statusBadge}>
              <ShieldCheck size={14} color="#A7F3D0" />
              <Text style={styles.statusText}>Offline-First · SQLite ACID Aktif</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Workspace Quick Switcher */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              WORKSPACE AKTIF
            </Text>
            <View style={styles.wsRow}>
              {(
                [
                  { id: 'PERSONAL', label: 'Personal', icon: User },
                  { id: 'BUSINESS', label: 'Business', icon: Briefcase },
                  { id: 'COMBINED', label: 'Combined', icon: Layers },
                ] as const
              ).map((item) => {
                const IconComp = item.icon;
                const active = activeWorkspace === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => switchWs(item.id)}
                    style={[
                      styles.wsChip,
                      {
                        backgroundColor: active ? colors.primarySoft : colors.surfaceElevated,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <IconComp size={15} color={active ? colors.primary : colors.textSecondary} />
                    <Text
                      style={[
                        styles.wsChipText,
                        { color: active ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modul Keuangan */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              MANAJEMEN KEUANGAN
            </Text>
            <DrawerItem
              icon={<Wallet size={19} color={colors.primary} />}
              label="Rekening & Dompet (Accounts)"
              sub="Kas, Bank, E-Wallet & Multi-Currency"
              onPress={() => navigateTo('/modules/accounts')}
              colors={colors}
            />
            <DrawerItem
              icon={<Target size={19} color={colors.warning} />}
              label="Anggaran & Target (Budgets)"
              sub="Batas pengeluaran & Circular Progress"
              onPress={() => navigateTo('/modules/budgets')}
              colors={colors}
            />
            <DrawerItem
              icon={<HandCoins size={19} color={colors.secondary} />}
              label="Utang & Piutang (Debts & AR/AP)"
              sub="Jadwal jatuh tempo & cicilan"
              onPress={() => navigateTo('/modules/debts')}
              colors={colors}
            />

            {/* Modul Akuntansi Bisnis Double-Entry */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              AKUNTANSI BISNIS (DOUBLE-ENTRY)
            </Text>
            <DrawerItem
              icon={<Landmark size={19} color={colors.secondary} />}
              label="Chart of Accounts (Daftar Akun COA)"
              sub="Aset, Liabilitas, Ekuitas, Pendapatan, Beban"
              onPress={() => navigateTo('/modules/coa')}
              colors={colors}
            />
            <DrawerItem
              icon={<BookOpen size={19} color={colors.primary} />}
              label="Jurnal Umum (General Journal)"
              sub="Debit = Kredit, Posting & Jurnal Pembalik"
              onPress={() => navigateTo('/modules/journals')}
              colors={colors}
            />
            <DrawerItem
              icon={<FileSpreadsheet size={19} color={colors.positive} />}
              label="Buku Besar & Neraca Saldo"
              sub="General Ledger & Trial Balance"
              onPress={() => navigateTo('/(tabs)/reports')}
              colors={colors}
            />
            <DrawerItem
              icon={<TrendingUp size={19} color={colors.warning} />}
              label="Laba Rugi, Neraca & Arus Kas"
              sub="6 Laporan Keuangan Akuntansi Bisnis"
              onPress={() => navigateTo('/(tabs)/reports')}
              colors={colors}
            />

            {/* Utilitas & Sistem */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              SISTEM, KURS & PEMULIHAN
            </Text>
            <DrawerItem
              icon={<Globe size={19} color={colors.secondary} />}
              label="Multi-Currency & Riwayat Kurs"
              sub="Kurs manual & otomatis ke Base Currency"
              onPress={() => navigateTo('/modules/currencies')}
              colors={colors}
            />
            <DrawerItem
              icon={<Trash2 size={19} color={colors.negative} />}
              label={`Trash & Recovery (${deletedTransactions.length})`}
              sub="Pulihkan Soft Delete / Permanent Delete"
              onPress={() => navigateTo('/modules/trash')}
              colors={colors}
            />
            <DrawerItem
              icon={<DatabaseBackup size={19} color={colors.positive} />}
              label="Backup & Restore (Normal + AES-256)"
              sub="Database SQLite + Bukti Foto/PDF"
              onPress={() => navigateTo('/modules/backup')}
              colors={colors}
            />
          </ScrollView>
        </Animated.View>
        <Pressable style={styles.backdropTap} onPress={handleClose} />
      </Animated.View>
    </Modal>
  );
}

function DrawerItem({
  icon,
  label,
  sub,
  onPress,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onPress: () => void;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.itemRow, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.surfaceElevated }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.itemSub, { color: colors.textMuted }]} numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(11, 13, 23, 0.55)',
  },
  drawer: {
    width: '84%',
    maxWidth: 340,
    height: '100%',
  },
  backdropTap: {
    flex: 1,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 18,
    paddingHorizontal: SPACING.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bizName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#ECFDF5',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginTop: 14,
    marginBottom: 8,
  },
  wsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  wsChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  wsChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  itemSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
});

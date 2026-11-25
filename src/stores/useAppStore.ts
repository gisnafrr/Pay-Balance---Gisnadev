import { create } from 'zustand';
import { getDb } from '@/database/client';
import { BUSINESS_WORKSPACE_ID, DEFAULT_PROFILE_ID, PERSONAL_WORKSPACE_ID } from '@/database/seeds';
import {
  AccountRecord,
  ActiveWorkspaceMode,
  AttachmentRecord,
  BackupRecord,
  BudgetRecord,
  CategoryRecord,
  CoaRecord,
  CurrencyRecord,
  DebtRecord,
  ExchangeRateRecord,
  JournalEntryRecord,
  JournalLineRecord,
  LanguageCode,
  ProfileRecord,
  ThemeMode,
  TransactionRecord,
} from '@/types/domain';
import { generateId, nowIsoTimestamp, todayIsoDate } from '@/utils/format';
import { getExchangeRateToBase } from '@/services/accounting.service';

interface AppState {
  initialized: boolean;
  isLocked: boolean;
  showTutorial: boolean;
  themeMode: ThemeMode;
  language: LanguageCode;
  activeWorkspace: ActiveWorkspaceMode;

  profile: ProfileRecord | null;
  accounts: AccountRecord[];
  categories: CategoryRecord[];
  coaList: CoaRecord[];
  transactions: TransactionRecord[];
  deletedTransactions: TransactionRecord[];
  journalEntries: JournalEntryRecord[];
  budgets: BudgetRecord[];
  debts: DebtRecord[];
  currencies: CurrencyRecord[];
  exchangeRates: ExchangeRateRecord[];
  attachments: AttachmentRecord[];
  backups: BackupRecord[];

  // Computed metrics (converted to base currency IDR)
  personalTotalBalance: number;
  businessTotalBalance: number;
  combinedTotalBalance: number;

  // Actions
  initializeApp: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  setActiveWorkspace: (mode: ActiveWorkspaceMode) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: LanguageCode) => void;
  setShowTutorial: (visible: boolean) => void;
  unlockApp: (pin?: string) => boolean;
  lockApp: () => void;
  completeOnboarding: (params: {
    fullName: string;
    businessName: string;
    baseCurrency: string;
    pin: string;
    biometricEnabled: boolean;
  }) => Promise<void>;
  createAccount: (params: {
    workspace_id: string;
    name: string;
    type: AccountRecord['type'];
    currency_code: string;
    initial_balance: number;
    linked_coa_id?: string | null;
    color?: string;
  }) => Promise<void>;
  createCoa: (params: {
    code: string;
    name: string;
    account_type: CoaRecord['account_type'];
    normal_balance: CoaRecord['normal_balance'];
  }) => Promise<void>;
  createBudget: (params: {
    workspace_id: string;
    name: string;
    category_id: string | null;
    amount_limit: number;
  }) => Promise<void>;
  createDebt: (params: {
    workspace_id: string;
    type: DebtRecord['type'];
    counterparty_name: string;
    principal_amount: number;
    due_date: string;
    notes?: string;
  }) => Promise<void>;
  recordDebtPayment: (params: {
    debt_id: string;
    account_id: string;
    amount: number;
  }) => Promise<void>;
  upsertExchangeRate: (fromCurrency: string, rateToIdr: number, source?: 'MANUAL' | 'AUTO') => Promise<void>;
  createLocalBackup: (backupType: 'NORMAL' | 'ENCRYPTED', passwordHint?: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  isLocked: false,
  showTutorial: false,
  themeMode: 'light',
  language: 'id',
  activeWorkspace: 'PERSONAL',

  profile: null,
  accounts: [],
  categories: [],
  coaList: [],
  transactions: [],
  deletedTransactions: [],
  journalEntries: [],
  budgets: [],
  debts: [],
  currencies: [],
  exchangeRates: [],
  attachments: [],
  backups: [],

  personalTotalBalance: 0,
  businessTotalBalance: 0,
  combinedTotalBalance: 0,

  initializeApp: async () => {
    await getDb();
    await get().refreshAllData();
    const profile = get().profile;
    set({
      initialized: true,
      isLocked: Boolean(profile?.pin_hash),
    });
  },

  refreshAllData: async () => {
    const db = await getDb();

    const profile = await db.getFirstAsync<ProfileRecord>(
      'SELECT * FROM profiles WHERE id = ? LIMIT 1',
      [DEFAULT_PROFILE_ID]
    );
    const accounts = await db.getAllAsync<AccountRecord>(
      'SELECT * FROM accounts WHERE deleted_at IS NULL ORDER BY workspace_id, name ASC'
    );
    const categories = await db.getAllAsync<CategoryRecord>(
      'SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY workspace_id, type, name ASC'
    );
    const coaList = await db.getAllAsync<CoaRecord>(
      'SELECT * FROM chart_of_accounts WHERE deleted_at IS NULL ORDER BY code ASC'
    );
    const transactions = await db.getAllAsync<TransactionRecord>(
      `SELECT t.*,
              a.name as account_name,
              ta.name as to_account_name,
              c.name as category_name,
              c.color as category_color,
              c.icon as category_icon,
              w.type as workspace_type,
              (SELECT COUNT(*) FROM attachments att WHERE att.owner_id = t.id AND att.deleted_at IS NULL) as attachment_count
       FROM transactions t
       LEFT JOIN accounts a ON a.id = t.account_id
       LEFT JOIN accounts ta ON ta.id = t.to_account_id
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN workspaces w ON w.id = t.workspace_id
       WHERE t.deleted_at IS NULL
       ORDER BY t.transaction_date DESC, t.created_at DESC`
    );

    const deletedTransactions = await db.getAllAsync<TransactionRecord>(
      `SELECT t.*, a.name as account_name, w.type as workspace_type
       FROM transactions t
       LEFT JOIN accounts a ON a.id = t.account_id
       LEFT JOIN workspaces w ON w.id = t.workspace_id
       WHERE t.deleted_at IS NOT NULL
       ORDER BY t.deleted_at DESC`
    );

    const rawJournals = await db.getAllAsync<JournalEntryRecord>(
      `SELECT * FROM journal_entries WHERE deleted_at IS NULL ORDER BY entry_date DESC, entry_number DESC`
    );
    const allLines = await db.getAllAsync<JournalLineRecord>(
      `SELECT jl.*, c.code as coa_code, c.name as coa_name, c.account_type as coa_type
       FROM journal_lines jl
       LEFT JOIN chart_of_accounts c ON c.id = jl.coa_id
       ORDER BY jl.line_order ASC`
    );

    const journalEntries: JournalEntryRecord[] = rawJournals.map((je) => ({
      ...je,
      lines: allLines.filter((l) => l.journal_entry_id === je.id),
    }));

    const budgets = await db.getAllAsync<BudgetRecord>(
      `SELECT b.*,
              c.name as category_name,
              c.color as category_color,
              COALESCE((
                SELECT SUM(t.base_amount)
                FROM transactions t
                WHERE t.category_id = b.category_id
                  AND t.type = 'EXPENSE'
                  AND t.deleted_at IS NULL
              ), 0) as spent_amount
       FROM budgets b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.deleted_at IS NULL`
    );

    const debts = await db.getAllAsync<DebtRecord>(
      `SELECT * FROM debts WHERE deleted_at IS NULL ORDER BY due_date ASC`
    );
    const currencies = await db.getAllAsync<CurrencyRecord>('SELECT * FROM currencies ORDER BY is_base DESC, code ASC');
    const exchangeRates = await db.getAllAsync<ExchangeRateRecord>(
      'SELECT * FROM exchange_rates ORDER BY effective_date DESC'
    );
    const attachments = await db.getAllAsync<AttachmentRecord>(
      'SELECT * FROM attachments WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    const backups = await db.getAllAsync<BackupRecord>('SELECT * FROM backups ORDER BY created_at DESC');

    // Calculate multi-currency converted balances to Base Currency (IDR)
    let personalTotal = 0;
    let businessTotal = 0;
    for (const acc of accounts) {
      const rate = await getExchangeRateToBase(acc.currency_code, profile?.base_currency_code || 'IDR');
      const converted = acc.current_balance * rate;
      if (acc.workspace_id === PERSONAL_WORKSPACE_ID) {
        personalTotal += converted;
      } else if (acc.workspace_id === BUSINESS_WORKSPACE_ID) {
        businessTotal += converted;
      }
    }

    set({
      profile,
      accounts,
      categories,
      coaList,
      transactions,
      deletedTransactions,
      journalEntries,
      budgets,
      debts,
      currencies,
      exchangeRates,
      attachments,
      backups,
      personalTotalBalance: personalTotal,
      businessTotalBalance: businessTotal,
      combinedTotalBalance: personalTotal + businessTotal,
    });
  },

  setActiveWorkspace: (mode) => set({ activeWorkspace: mode }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  setLanguage: (lang) => set({ language: lang }),
  setShowTutorial: (visible) => set({ showTutorial: visible }),

  unlockApp: (pin) => {
    const savedPin = get().profile?.pin_hash;
    if (!savedPin || pin === savedPin) {
      set({ isLocked: false });
      return true;
    }
    return false;
  },

  lockApp: () => set({ isLocked: true }),

  completeOnboarding: async ({ fullName, businessName, baseCurrency, pin, biometricEnabled }) => {
    const db = await getDb();
    const now = nowIsoTimestamp();
    await db.runAsync(
      `UPDATE profiles
       SET full_name = ?, business_name = ?, base_currency_code = ?, pin_hash = ?, biometric_enabled = ?, onboarding_completed = 1, updated_at = ?
       WHERE id = ?`,
      [fullName, businessName, baseCurrency, pin || null, biometricEnabled ? 1 : 0, now, DEFAULT_PROFILE_ID]
    );
    await get().refreshAllData();
    set({ isLocked: false });
  },

  createAccount: async ({ workspace_id, name, type, currency_code, initial_balance, linked_coa_id, color }) => {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO accounts (id, workspace_id, name, type, currency_code, initial_balance, current_balance, linked_coa_id, icon, color, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Wallet', ?, NULL)`,
      [
        generateId('acc'),
        workspace_id,
        name,
        type,
        currency_code,
        initial_balance,
        initial_balance,
        linked_coa_id ?? (workspace_id === BUSINESS_WORKSPACE_ID ? 'coa_1102' : null),
        color ?? '#7C3AED',
      ]
    );
    await get().refreshAllData();
  },

  createCoa: async ({ code, name, account_type, normal_balance }) => {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO chart_of_accounts (id, workspace_id, code, name, account_type, normal_balance, parent_id, is_system, is_active, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, 0, 1, NULL)`,
      [generateId('coa'), BUSINESS_WORKSPACE_ID, code, name, account_type, normal_balance]
    );
    await get().refreshAllData();
  },

  createBudget: async ({ workspace_id, name, category_id, amount_limit }) => {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO budgets (id, workspace_id, name, category_id, amount_limit, currency_code, period_type, start_date, end_date, alert_threshold_percent, deleted_at)
       VALUES (?, ?, ?, ?, ?, 'IDR', 'MONTHLY', '2026-11-01', '2026-11-30', 80, NULL)`,
      [generateId('bdg'), workspace_id, name, category_id, amount_limit]
    );
    await get().refreshAllData();
  },

  createDebt: async ({ workspace_id, type, counterparty_name, principal_amount, due_date, notes }) => {
    const db = await getDb();
    const today = todayIsoDate();
    await db.runAsync(
      `INSERT INTO debts (id, workspace_id, type, counterparty_name, counterparty_contact, principal_amount, remaining_amount, currency_code, exchange_rate, issue_date, due_date, status, linked_coa_id, notes, deleted_at)
       VALUES (?, ?, ?, ?, '-', ?, ?, 'IDR', 1, ?, ?, 'UNPAID', ?, ?, NULL)`,
      [
        generateId('debt'),
        workspace_id,
        type,
        counterparty_name,
        principal_amount,
        principal_amount,
        today,
        due_date,
        type === 'RECEIVABLE' ? 'coa_1201' : 'coa_2101',
        notes ?? null,
      ]
    );
    await get().refreshAllData();
  },

  recordDebtPayment: async ({ debt_id, account_id, amount }) => {
    const db = await getDb();
    const debt = await db.getFirstAsync<DebtRecord>('SELECT * FROM debts WHERE id = ?', [debt_id]);
    if (!debt) return;
    const payAmount = Math.min(amount, debt.remaining_amount);
    const newRemaining = Math.max(0, debt.remaining_amount - payAmount);
    const newStatus = newRemaining === 0 ? 'PAID' : 'PARTIAL';
    const today = todayIsoDate();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'UPDATE debts SET remaining_amount = ?, status = ? WHERE id = ?',
        [newRemaining, newStatus, debt.id]
      );
      const balanceDelta = debt.type === 'RECEIVABLE' ? payAmount : -payAmount;
      await db.runAsync(
        'UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?',
        [balanceDelta, account_id]
      );
      await db.runAsync(
        `INSERT INTO debt_payments (id, debt_id, transaction_id, journal_entry_id, amount_paid, payment_date, notes, deleted_at)
         VALUES (?, ?, NULL, NULL, ?, ?, 'Cicilan / Pelunasan', NULL)`,
        [generateId('dpay'), debt.id, payAmount, today]
      );
    });
    await get().refreshAllData();
  },

  upsertExchangeRate: async (fromCurrency, rateToIdr, source = 'MANUAL') => {
    const db = await getDb();
    const now = nowIsoTimestamp();
    const today = todayIsoDate();
    await db.runAsync(
      `INSERT INTO exchange_rates (id, from_currency, to_currency, rate, source, effective_date, created_at)
       VALUES (?, ?, 'IDR', ?, ?, ?, ?)`,
      [generateId('fx'), fromCurrency, rateToIdr, source, today, now]
    );
    await get().refreshAllData();
  },

  createLocalBackup: async (backupType, passwordHint) => {
    const db = await getDb();
    const now = nowIsoTimestamp();
    const attCount = get().attachments.length;
    const txCount = get().transactions.length;
    const fileName = `qoupay_backup_${todayIsoDate()}_${backupType.toLowerCase()}.qoubackup`;
    const checksum = `sha256_${backupType}_${txCount}_${Date.now()}`;

    await db.runAsync(
      `INSERT INTO backups (id, file_name, file_path, backup_type, size_bytes, attachment_count, db_schema_version, checksum_sha256, created_at, restored_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
      [
        generateId('bkp'),
        fileName,
        `documentDirectory/backups/${fileName}${passwordHint ? ' [AES-256]' : ''}`,
        backupType,
        142000 + txCount * 512 + attCount * 65000,
        attCount,
        checksum,
        now,
      ]
    );
    await get().refreshAllData();
  },
}));

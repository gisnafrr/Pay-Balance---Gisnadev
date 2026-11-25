import { Platform } from 'react-native';
import { INITIAL_SCHEMA_SQL } from './schema';
import {
  BUSINESS_WORKSPACE_ID,
  DEFAULT_BUSINESS_COA,
  DEFAULT_CURRENCIES,
  DEFAULT_EXCHANGE_RATES,
  DEFAULT_PROFILE_ID,
  PERSONAL_WORKSPACE_ID,
} from './seeds';
import { nowIsoTimestamp, todayIsoDate } from '@/utils/format';

export interface AppDatabase {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, params?: unknown[]) => Promise<{ changes: number }>;
  getFirstAsync: <T>(sql: string, params?: unknown[]) => Promise<T | null>;
  getAllAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  withTransactionAsync: (task: () => Promise<void>) => Promise<void>;
}

let dbInstance: AppDatabase | null = null;

/**
 * Web In-Memory + LocalStorage SQLite Adapter
 * Prevents WASM / SharedArrayBuffer lockup when previewing on Web via `expo start --web`
 * while using real native `expo-sqlite` on Android & iOS.
 */
function createWebFallbackDb(): AppDatabase {
  const STORAGE_KEY = 'qoupay_web_sqlite_v1';
  const now = nowIsoTimestamp();
  const today = todayIsoDate();

  type StoreShape = {
    profiles: Array<Record<string, unknown>>;
    workspaces: Array<Record<string, unknown>>;
    currencies: Array<Record<string, unknown>>;
    exchange_rates: Array<Record<string, unknown>>;
    chart_of_accounts: Array<Record<string, unknown>>;
    accounts: Array<Record<string, unknown>>;
    categories: Array<Record<string, unknown>>;
    journal_entries: Array<Record<string, unknown>>;
    journal_lines: Array<Record<string, unknown>>;
    transactions: Array<Record<string, unknown>>;
    budgets: Array<Record<string, unknown>>;
    debts: Array<Record<string, unknown>>;
    debt_payments: Array<Record<string, unknown>>;
    attachments: Array<Record<string, unknown>>;
    audit_logs: Array<Record<string, unknown>>;
    backups: Array<Record<string, unknown>>;
  };

  const defaultStore: StoreShape = {
    profiles: [
      {
        id: DEFAULT_PROFILE_ID,
        full_name: 'Alex Qoupay',
        business_name: 'Qoupay Studio & Retail',
        avatar_uri: null,
        base_currency_code: 'IDR',
        pin_hash: null,
        biometric_enabled: 0,
        onboarding_completed: 1,
        created_at: now,
        updated_at: now,
      },
    ],
    workspaces: [
      {
        id: PERSONAL_WORKSPACE_ID,
        type: 'PERSONAL',
        name: 'Personal Finance',
        default_currency_code: 'IDR',
        color_theme: '#7C3AED',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: BUSINESS_WORKSPACE_ID,
        type: 'BUSINESS',
        name: 'Business Finance',
        default_currency_code: 'IDR',
        color_theme: '#2563EB',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
    ],
    currencies: [...DEFAULT_CURRENCIES],
    exchange_rates: DEFAULT_EXCHANGE_RATES.map((fx) => ({
      ...fx,
      effective_date: today,
      created_at: now,
    })),
    chart_of_accounts: DEFAULT_BUSINESS_COA.map((c) => ({
      ...c,
      workspace_id: BUSINESS_WORKSPACE_ID,
      parent_id: null,
      is_active: 1,
      deleted_at: null,
    })),
    accounts: [
      {
        id: 'acc_p_bca',
        workspace_id: PERSONAL_WORKSPACE_ID,
        name: 'BCA Personal',
        type: 'BANK',
        currency_code: 'IDR',
        initial_balance: 6500000,
        current_balance: 8250000,
        linked_coa_id: null,
        icon: 'Landmark',
        color: '#7C3AED',
        deleted_at: null,
      },
      {
        id: 'acc_p_cash',
        workspace_id: PERSONAL_WORKSPACE_ID,
        name: 'Dompet Tunai',
        type: 'CASH',
        currency_code: 'IDR',
        initial_balance: 1900000,
        current_balance: 0,
        linked_coa_id: null,
        icon: 'Wallet',
        color: '#10B981',
        deleted_at: null,
      },
      {
        id: 'acc_b_bank',
        workspace_id: BUSINESS_WORKSPACE_ID,
        name: 'Bank Operasional Bisnis',
        type: 'BANK',
        currency_code: 'IDR',
        initial_balance: 15000000,
        current_balance: 15500000,
        linked_coa_id: 'coa_1102',
        icon: 'Building2',
        color: '#2563EB',
        deleted_at: null,
      },
      {
        id: 'acc_b_cash',
        workspace_id: BUSINESS_WORKSPACE_ID,
        name: 'Kas Kecil Bisnis',
        type: 'CASH',
        currency_code: 'IDR',
        initial_balance: 2000000,
        current_balance: 2000000,
        linked_coa_id: 'coa_1101',
        icon: 'Banknote',
        color: '#0D9488',
        deleted_at: null,
      },
    ],
    categories: [
      { id: 'cat_p_salary', workspace_id: PERSONAL_WORKSPACE_ID, name: 'Gaji & Pendapatan Pribadi', type: 'INCOME', parent_id: null, linked_coa_id: null, icon: 'Briefcase', color: '#10B981', is_system: 1, deleted_at: null },
      { id: 'cat_p_food', workspace_id: PERSONAL_WORKSPACE_ID, name: 'Belanja & Kebutuhan Harian', type: 'EXPENSE', parent_id: null, linked_coa_id: null, icon: 'ShoppingBag', color: '#7C3AED', is_system: 1, deleted_at: null },
      { id: 'cat_p_cafe', workspace_id: PERSONAL_WORKSPACE_ID, name: 'Makan & Kafe', type: 'EXPENSE', parent_id: null, linked_coa_id: null, icon: 'Coffee', color: '#F59E0B', is_system: 1, deleted_at: null },
      { id: 'cat_p_transport', workspace_id: PERSONAL_WORKSPACE_ID, name: 'Transportasi & BBM', type: 'EXPENSE', parent_id: null, linked_coa_id: null, icon: 'Car', color: '#2563EB', is_system: 1, deleted_at: null },
      { id: 'cat_b_sales', workspace_id: BUSINESS_WORKSPACE_ID, name: 'Penjualan Produk', type: 'INCOME', parent_id: null, linked_coa_id: 'coa_4101', icon: 'ShoppingCart', color: '#10B981', is_system: 1, deleted_at: null },
      { id: 'cat_b_service', workspace_id: BUSINESS_WORKSPACE_ID, name: 'Pendapatan Jasa', type: 'INCOME', parent_id: null, linked_coa_id: 'coa_4102', icon: 'Sparkles', color: '#2563EB', is_system: 1, deleted_at: null },
      { id: 'cat_b_cogs', workspace_id: BUSINESS_WORKSPACE_ID, name: 'Pembelian Stok / HPP', type: 'EXPENSE', parent_id: null, linked_coa_id: 'coa_5101', icon: 'Package', color: '#EF4444', is_system: 1, deleted_at: null },
      { id: 'cat_b_ops', workspace_id: BUSINESS_WORKSPACE_ID, name: 'Biaya Operasional & Listrik', type: 'EXPENSE', parent_id: null, linked_coa_id: 'coa_5202', icon: 'Zap', color: '#F59E0B', is_system: 1, deleted_at: null },
      { id: 'cat_b_mkt', workspace_id: BUSINESS_WORKSPACE_ID, name: 'Iklan & Pemasaran', type: 'EXPENSE', parent_id: null, linked_coa_id: 'coa_5203', icon: 'Megaphone', color: '#7C3AED', is_system: 1, deleted_at: null },
    ],
    journal_entries: [
      { id: 'je_init_001', workspace_id: BUSINESS_WORKSPACE_ID, entry_number: 'JE-202611-0001', entry_date: today, description: 'Saldo Modal Awal Bisnis (Bank & Kas Kecil)', reference_no: 'OPEN-01', source_type: 'MANUAL', status: 'POSTED', total_debit: 17000000, total_credit: 17000000, currency_code: 'IDR', exchange_rate: 1, reversal_of_id: null, reversed_by_id: null, posted_at: now, deleted_at: null },
      { id: 'je_sale_002', workspace_id: BUSINESS_WORKSPACE_ID, entry_number: 'JE-202611-0002', entry_date: today, description: 'Penjualan Tunai Produk', reference_no: 'INV-001', source_type: 'AUTO_TRANSACTION', status: 'POSTED', total_debit: 500000, total_credit: 500000, currency_code: 'IDR', exchange_rate: 1, reversal_of_id: null, reversed_by_id: null, posted_at: now, deleted_at: null },
    ],
    journal_lines: [
      { id: 'jl_001_1', journal_entry_id: 'je_init_001', line_order: 1, coa_id: 'coa_1102', account_id: 'acc_b_bank', debit_amount: 15000000, credit_amount: 0, memo: 'Setoran Modal Bank Operasional' },
      { id: 'jl_001_2', journal_entry_id: 'je_init_001', line_order: 2, coa_id: 'coa_1101', account_id: 'acc_b_cash', debit_amount: 2000000, credit_amount: 0, memo: 'Setoran Modal Kas Kecil' },
      { id: 'jl_001_3', journal_entry_id: 'je_init_001', line_order: 3, coa_id: 'coa_3101', account_id: null, debit_amount: 0, credit_amount: 17000000, memo: 'Modal Awal Pemilik' },
      { id: 'jl_002_1', journal_entry_id: 'je_sale_002', line_order: 1, coa_id: 'coa_1102', account_id: 'acc_b_bank', debit_amount: 500000, credit_amount: 0, memo: 'Penerimaan Penjualan Produk' },
      { id: 'jl_002_2', journal_entry_id: 'je_sale_002', line_order: 2, coa_id: 'coa_4101', account_id: null, debit_amount: 0, credit_amount: 500000, memo: 'Pendapatan Penjualan Produk' },
    ],
    transactions: [
      { id: 'tx_b_001', workspace_id: BUSINESS_WORKSPACE_ID, type: 'INCOME', account_id: 'acc_b_bank', to_account_id: null, category_id: 'cat_b_sales', amount: 500000, currency_code: 'IDR', exchange_rate_to_base: 1, base_amount: 500000, transaction_date: today, title: 'Penjualan Tunai Produk', notes: 'Contoh jurnal otomatis Rp500.000', paired_transaction_id: null, journal_entry_id: 'je_sale_002', deleted_at: null, created_at: now, updated_at: now },
      { id: 'tx_p_001', workspace_id: PERSONAL_WORKSPACE_ID, type: 'INCOME', account_id: 'acc_p_bca', to_account_id: null, category_id: 'cat_p_salary', amount: 1900000, currency_code: 'IDR', exchange_rate_to_base: 1, base_amount: 1900000, transaction_date: today, title: 'Penerimaan Gaji & Bonus', notes: 'Gaji bulan berjalan', paired_transaction_id: null, journal_entry_id: null, deleted_at: null, created_at: now, updated_at: now },
      { id: 'tx_p_002', workspace_id: PERSONAL_WORKSPACE_ID, type: 'EXPENSE', account_id: 'acc_p_bca', to_account_id: null, category_id: 'cat_p_food', amount: 150000, currency_code: 'IDR', exchange_rate_to_base: 1, base_amount: 150000, transaction_date: today, title: 'Belanja Kebutuhan Harian', notes: 'Supermarket & rumah tangga', paired_transaction_id: null, journal_entry_id: null, deleted_at: null, created_at: now, updated_at: now },
    ],
    budgets: [
      { id: 'bdg_p_1', workspace_id: PERSONAL_WORKSPACE_ID, name: 'Anggaran Belanja Kebutuhan', category_id: 'cat_p_food', amount_limit: 2500000, currency_code: 'IDR', period_type: 'MONTHLY', start_date: '2026-11-01', end_date: '2026-11-30', alert_threshold_percent: 80, deleted_at: null },
      { id: 'bdg_p_2', workspace_id: PERSONAL_WORKSPACE_ID, name: 'Makan & Kafe Bulanan', category_id: 'cat_p_cafe', amount_limit: 1000000, currency_code: 'IDR', period_type: 'MONTHLY', start_date: '2026-11-01', end_date: '2026-11-30', alert_threshold_percent: 80, deleted_at: null },
      { id: 'bdg_b_1', workspace_id: BUSINESS_WORKSPACE_ID, name: 'Anggaran Iklan & Marketing', category_id: 'cat_b_mkt', amount_limit: 3000000, currency_code: 'IDR', period_type: 'MONTHLY', start_date: '2026-11-01', end_date: '2026-11-30', alert_threshold_percent: 80, deleted_at: null },
    ],
    debts: [
      { id: 'debt_b_ar1', workspace_id: BUSINESS_WORKSPACE_ID, type: 'RECEIVABLE', counterparty_name: 'PT Nusantara Retail', counterparty_contact: '0812-3456-7890', principal_amount: 2500000, remaining_amount: 1500000, currency_code: 'IDR', exchange_rate: 1, issue_date: today, due_date: '2026-12-15', status: 'PARTIAL', linked_coa_id: 'coa_1201', notes: 'Invoice #INV-2026-08', deleted_at: null },
      { id: 'debt_p_ap1', workspace_id: PERSONAL_WORKSPACE_ID, type: 'PAYABLE', counterparty_name: 'Cicilan Gadget Kerja', counterparty_contact: '-', principal_amount: 3000000, remaining_amount: 1200000, currency_code: 'IDR', exchange_rate: 1, issue_date: today, due_date: '2026-12-10', status: 'PARTIAL', linked_coa_id: null, notes: 'Sisa 2x cicilan', deleted_at: null },
    ],
    debt_payments: [],
    attachments: [],
    audit_logs: [],
    backups: [],
  };

  let state: StoreShape = defaultStore;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        state = JSON.parse(saved);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStore));
      }
    }
  } catch {
    state = defaultStore;
  }

  const persist = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch {
      // ignore
    }
  };

  const enrichTransactions = (isDeleted: boolean) => {
    return state.transactions
      .filter((t) => (isDeleted ? Boolean(t.deleted_at) : !t.deleted_at))
      .map((t) => {
        const acc = state.accounts.find((a) => a.id === t.account_id);
        const toAcc = state.accounts.find((a) => a.id === t.to_account_id);
        const cat = state.categories.find((c) => c.id === t.category_id);
        const ws = state.workspaces.find((w) => w.id === t.workspace_id);
        const attCount = state.attachments.filter((a) => a.owner_id === t.id && !a.deleted_at).length;
        return {
          ...t,
          account_name: acc?.name || 'Rekening',
          to_account_name: toAcc?.name || null,
          category_name: cat?.name || null,
          category_color: cat?.color || '#7C3AED',
          category_icon: cat?.icon || 'Tag',
          workspace_type: ws?.type || (t.workspace_id === BUSINESS_WORKSPACE_ID ? 'BUSINESS' : 'PERSONAL'),
          attachment_count: attCount,
        };
      });
  };

  return {
    execAsync: async () => {},
    withTransactionAsync: async (task) => {
      await task();
      persist();
    },
    getFirstAsync: async <T>(sql: string, params: unknown[] = []): Promise<T | null> => {
      const q = sql.toLowerCase();
      if (q.includes('from profiles')) {
        return (state.profiles[0] as T) ?? null;
      }
      if (q.includes('count(*) as cnt from journal_entries')) {
        return ({ cnt: state.journal_entries.length } as unknown) as T;
      }
      if (q.includes('from exchange_rates')) {
        const [fromCur, toCur] = params;
        const found = state.exchange_rates.find(
          (r) => r.from_currency === fromCur && r.to_currency === toCur
        );
        return (found as T) ?? null;
      }
      if (q.includes('from accounts where id')) {
        return (state.accounts.find((a) => a.id === params[0]) as T) ?? null;
      }
      if (q.includes('from categories where id')) {
        return (state.categories.find((c) => c.id === params[0]) as T) ?? null;
      }
      if (q.includes('from chart_of_accounts where id')) {
        return (state.chart_of_accounts.find((c) => c.id === params[0]) as T) ?? null;
      }
      if (q.includes('from journal_entries where id')) {
        return (state.journal_entries.find((j) => j.id === params[0]) as T) ?? null;
      }
      if (q.includes('from transactions where id')) {
        return (state.transactions.find((t) => t.id === params[0]) as T) ?? null;
      }
      if (q.includes('from debts where id')) {
        return (state.debts.find((d) => d.id === params[0]) as T) ?? null;
      }
      return null;
    },
    getAllAsync: async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
      const q = sql.toLowerCase();
      if (q.includes('from accounts where deleted_at is null')) {
        return state.accounts.filter((a) => !a.deleted_at) as T[];
      }
      if (q.includes('from categories where deleted_at is null')) {
        return state.categories.filter((c) => !c.deleted_at) as T[];
      }
      if (q.includes('sum_debit') && q.includes('from chart_of_accounts')) {
        return state.chart_of_accounts.map((c) => {
          const lines = state.journal_lines.filter((l) => l.coa_id === c.id);
          let sum_debit = 0;
          let sum_credit = 0;
          for (const l of lines) {
            const je = state.journal_entries.find((j) => j.id === l.journal_entry_id);
            if (je && je.status === 'POSTED' && !je.deleted_at) {
              sum_debit += Number(l.debit_amount || 0);
              sum_credit += Number(l.credit_amount || 0);
            }
          }
          return {
            coa_id: c.id,
            code: c.code,
            name: c.name,
            account_type: c.account_type,
            normal_balance: c.normal_balance,
            sum_debit,
            sum_credit,
          };
        }) as T[];
      }
      if (q.includes('from chart_of_accounts where deleted_at is null')) {
        return state.chart_of_accounts.filter((c) => !c.deleted_at) as T[];
      }
      if (q.includes('from budgets b')) {
        return state.budgets
          .filter((b) => !b.deleted_at)
          .map((b) => {
            const cat = state.categories.find((c) => c.id === b.category_id);
            const spent = state.transactions
              .filter(
                (t) => !t.deleted_at && t.type === 'EXPENSE' && t.category_id === b.category_id
              )
              .reduce((s, t) => s + Number(t.base_amount || 0), 0);
            return {
              ...b,
              category_name: cat?.name,
              category_color: cat?.color,
              spent_amount: spent,
            };
          }) as T[];
      }
      if (q.includes('from transactions t') && q.includes('t.deleted_at is null')) {
        return enrichTransactions(false) as T[];
      }
      if (q.includes('from transactions t') && q.includes('t.deleted_at is not null')) {
        return enrichTransactions(true) as T[];
      }
      if (q.includes('from journal_entries where deleted_at is null')) {
        return state.journal_entries.filter((j) => !j.deleted_at) as T[];
      }
      if (q.includes('from journal_lines jl') && q.includes('inner join journal_entries je')) {
        const coaId = params[0];
        return state.journal_lines
          .filter((l) => l.coa_id === coaId)
          .map((l) => {
            const je = state.journal_entries.find((j) => j.id === l.journal_entry_id);
            return {
              line_id: l.id,
              entry_id: je?.id,
              entry_number: je?.entry_number,
              entry_date: je?.entry_date,
              description: l.memo || je?.description,
              debit_amount: l.debit_amount,
              credit_amount: l.credit_amount,
            };
          }) as T[];
      }
      if (q.includes('from journal_lines jl')) {
        return state.journal_lines.map((l) => {
          const coa = state.chart_of_accounts.find((c) => c.id === l.coa_id);
          return {
            ...l,
            coa_code: coa?.code,
            coa_name: coa?.name,
            coa_type: coa?.account_type,
          };
        }) as T[];
      }
      if (q.includes('from journal_lines where journal_entry_id')) {
        return state.journal_lines.filter((l) => l.journal_entry_id === params[0]) as T[];
      }
      if (q.includes('from debts where deleted_at is null')) {
        return state.debts.filter((d) => !d.deleted_at) as T[];
      }
      if (q.includes('from currencies')) {
        return state.currencies as T[];
      }
      if (q.includes('from exchange_rates')) {
        return state.exchange_rates as T[];
      }
      if (q.includes('from attachments')) {
        return state.attachments.filter((a) => !a.deleted_at) as T[];
      }
      if (q.includes('from backups')) {
        return state.backups as T[];
      }
      return [];
    },
    runAsync: async (sql: string, params: unknown[] = []) => {
      const q = sql.toLowerCase();
      if (q.includes('update profiles')) {
        const [full_name, business_name, base_currency_code, pin_hash, biometric_enabled, updated_at] = params;
        state.profiles[0] = {
          ...state.profiles[0],
          full_name,
          business_name,
          base_currency_code,
          pin_hash,
          biometric_enabled,
          onboarding_completed: 1,
          updated_at,
        };
      } else if (q.includes('update accounts set current_balance = current_balance +')) {
        const [delta, id] = params;
        state.accounts = state.accounts.map((a) =>
          a.id === id ? { ...a, current_balance: Number(a.current_balance || 0) + Number(delta) } : a
        );
      } else if (q.includes('update accounts set current_balance = current_balance -')) {
        const [delta, id] = params;
        state.accounts = state.accounts.map((a) =>
          a.id === id ? { ...a, current_balance: Number(a.current_balance || 0) - Number(delta) } : a
        );
      } else if (q.includes('insert into accounts')) {
        const [id, workspace_id, name, type, currency_code, initial_balance, current_balance, linked_coa_id, color] = params;
        state.accounts.push({
          id,
          workspace_id,
          name,
          type,
          currency_code,
          initial_balance: Number(initial_balance),
          current_balance: Number(current_balance),
          linked_coa_id,
          icon: 'Wallet',
          color,
          deleted_at: null,
        });
      } else if (q.includes('insert into chart_of_accounts')) {
        const [id, workspace_id, code, name, account_type, normal_balance] = params;
        state.chart_of_accounts.push({
          id,
          workspace_id,
          code,
          name,
          account_type,
          normal_balance,
          parent_id: null,
          is_system: 0,
          is_active: 1,
          deleted_at: null,
        });
      } else if (q.includes('insert into journal_entries')) {
        const isManual = q.includes("'manual'");
        const isAuto = q.includes("'auto_transaction'");
        const isWsTransfer = q.includes("'workspace_transfer'");
        const isReversal = q.includes("'reversal'");
        if (isManual) {
          const [id, workspace_id, entry_number, entry_date, description, reference_no, status, total_debit, total_credit, currency_code, exchange_rate, posted_at] = params;
          state.journal_entries.unshift({
            id, workspace_id, entry_number, entry_date, description, reference_no,
            source_type: 'MANUAL', status, total_debit: Number(total_debit), total_credit: Number(total_credit),
            currency_code, exchange_rate: Number(exchange_rate), reversal_of_id: null, reversed_by_id: null, posted_at, deleted_at: null,
          });
        } else if (isAuto || isWsTransfer) {
          const [id, workspace_id, entry_number, entry_date, description, total_debit, total_credit, currency_code, exchange_rate, posted_at] = params;
          state.journal_entries.unshift({
            id, workspace_id, entry_number, entry_date, description, reference_no: isWsTransfer ? 'WS-TRANSFER' : null,
            source_type: isWsTransfer ? 'WORKSPACE_TRANSFER' : 'AUTO_TRANSACTION', status: 'POSTED',
            total_debit: Number(total_debit), total_credit: Number(total_credit), currency_code, exchange_rate: Number(exchange_rate),
            reversal_of_id: null, reversed_by_id: null, posted_at, deleted_at: null,
          });
        } else if (isReversal) {
          const [id, workspace_id, entry_number, entry_date, description, reference_no, total_debit, total_credit, currency_code, exchange_rate, reversal_of_id, posted_at] = params;
          state.journal_entries.unshift({
            id, workspace_id, entry_number, entry_date, description, reference_no,
            source_type: 'REVERSAL', status: 'POSTED', total_debit: Number(total_debit), total_credit: Number(total_credit),
            currency_code, exchange_rate: Number(exchange_rate), reversal_of_id, reversed_by_id: null, posted_at, deleted_at: null,
          });
        }
      } else if (q.includes('insert into journal_lines')) {
        if (params.length === 12) {
          // 2 lines batch insert
          state.journal_lines.push(
            {
              id: params[0],
              journal_entry_id: params[1],
              line_order: 1,
              coa_id: params[2],
              account_id: params[3],
              debit_amount: Number(params[4]),
              credit_amount: 0,
              memo: params[5],
            },
            {
              id: params[6],
              journal_entry_id: params[7],
              line_order: 2,
              coa_id: params[8],
              account_id: params[9],
              debit_amount: 0,
              credit_amount: Number(params[10]),
              memo: params[11],
            }
          );
        } else {
          const [id, journal_entry_id, line_order, coa_id, account_id, debit_amount, credit_amount, memo] = params;
          state.journal_lines.push({
            id, journal_entry_id, line_order: Number(line_order), coa_id, account_id,
            debit_amount: Number(debit_amount), credit_amount: Number(credit_amount), memo,
          });
        }
      } else if (q.includes('insert into transactions')) {
        if (params.length >= 28) {
          // Paired inter-workspace transfer
          state.transactions.unshift(
            {
              id: params[0], workspace_id: params[1], type: 'WORKSPACE_TRANSFER',
              account_id: params[2], to_account_id: params[3], category_id: null,
              amount: Number(params[4]), currency_code: params[5], exchange_rate_to_base: Number(params[6]),
              base_amount: Number(params[7]), transaction_date: params[8], title: params[9],
              notes: params[10], paired_transaction_id: params[11], journal_entry_id: null,
              deleted_at: null, created_at: params[12], updated_at: params[13],
            },
            {
              id: params[14], workspace_id: params[15], type: 'WORKSPACE_TRANSFER',
              account_id: params[16], to_account_id: params[17], category_id: null,
              amount: Number(params[18]), currency_code: params[19], exchange_rate_to_base: Number(params[20]),
              base_amount: Number(params[21]), transaction_date: params[22], title: params[23],
              notes: params[24], paired_transaction_id: params[25], journal_entry_id: params[26],
              deleted_at: null, created_at: params[27], updated_at: params[28],
            }
          );
        } else {
          const [id, workspace_id, type, account_id, to_account_id, category_id, amount, currency_code, exchange_rate_to_base, base_amount, transaction_date, title, notes, journal_entry_id, created_at, updated_at] = params;
          state.transactions.unshift({
            id, workspace_id, type, account_id, to_account_id, category_id,
            amount: Number(amount), currency_code, exchange_rate_to_base: Number(exchange_rate_to_base),
            base_amount: Number(base_amount), transaction_date, title, notes,
            paired_transaction_id: null, journal_entry_id, deleted_at: null, created_at, updated_at,
          });
        }
      } else if (q.includes('update transactions set deleted_at = null')) {
        const [updated_at, id] = params;
        state.transactions = state.transactions.map((t) =>
          t.id === id ? { ...t, deleted_at: null, updated_at } : t
        );
      } else if (q.includes('update transactions set deleted_at =')) {
        const [deleted_at, updated_at, id] = params;
        state.transactions = state.transactions.map((t) =>
          t.id === id ? { ...t, deleted_at, updated_at } : t
        );
      } else if (q.includes('delete from transactions where id')) {
        state.transactions = state.transactions.filter((t) => t.id !== params[0]);
      } else if (q.includes('update journal_entries set reversed_by_id')) {
        const [revId, id] = params;
        state.journal_entries = state.journal_entries.map((j) =>
          j.id === id ? { ...j, reversed_by_id: revId } : j
        );
      } else if (q.includes('insert into budgets')) {
        const [id, workspace_id, name, category_id, amount_limit] = params;
        state.budgets.push({
          id, workspace_id, name, category_id, amount_limit: Number(amount_limit),
          currency_code: 'IDR', period_type: 'MONTHLY', start_date: '2026-11-01', end_date: '2026-11-30',
          alert_threshold_percent: 80, deleted_at: null,
        });
      } else if (q.includes('insert into debts')) {
        const [id, workspace_id, type, counterparty_name, principal_amount, remaining_amount, issue_date, due_date, linked_coa_id, notes] = params;
        state.debts.push({
          id, workspace_id, type, counterparty_name, counterparty_contact: '-',
          principal_amount: Number(principal_amount), remaining_amount: Number(remaining_amount),
          currency_code: 'IDR', exchange_rate: 1, issue_date, due_date, status: 'UNPAID', linked_coa_id, notes, deleted_at: null,
        });
      } else if (q.includes('update debts set remaining_amount')) {
        const [remaining_amount, status, id] = params;
        state.debts = state.debts.map((d) =>
          d.id === id ? { ...d, remaining_amount: Number(remaining_amount), status } : d
        );
      } else if (q.includes('insert into exchange_rates')) {
        const [id, from_currency, rate, source, effective_date, created_at] = params;
        state.exchange_rates.unshift({
          id, from_currency, to_currency: 'IDR', rate: Number(rate), source, effective_date, created_at,
        });
      } else if (q.includes('insert into attachments')) {
        const [id, workspace_id, owner_id, file_name, file_rel_path, mime_type, file_size_bytes, checksum_sha256, created_at] = params;
        state.attachments.unshift({
          id, workspace_id, owner_type: 'TRANSACTION', owner_id, file_name, file_rel_path, mime_type, file_size_bytes: Number(file_size_bytes), checksum_sha256, deleted_at: null, created_at,
        });
      } else if (q.includes('insert into backups')) {
        const [id, file_name, file_path, backup_type, size_bytes, attachment_count, checksum_sha256, created_at] = params;
        state.backups.unshift({
          id, file_name, file_path, backup_type, size_bytes: Number(size_bytes), attachment_count: Number(attachment_count), db_schema_version: 1, checksum_sha256, created_at, restored_at: null,
        });
      }
      persist();
      return { changes: 1 };
    },
  };
}

export async function getDb(): Promise<AppDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (Platform.OS === 'web') {
    dbInstance = createWebFallbackDb();
    return dbInstance;
  }

  // Dynamic require on Native Android / iOS
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SQLite = require('expo-sqlite') as typeof import('expo-sqlite');
  const db = await SQLite.openDatabaseAsync('qoupay_finance_v1.db');
  await db.execAsync(INITIAL_SCHEMA_SQL);
  await seedInitialDataIfEmpty(db as unknown as AppDatabase);
  dbInstance = db as unknown as AppDatabase;
  return dbInstance;
}

async function seedInitialDataIfEmpty(db: AppDatabase): Promise<void> {
  const existingProfile = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM profiles WHERE id = ? LIMIT 1',
    [DEFAULT_PROFILE_ID]
  );

  if (existingProfile) {
    return;
  }

  const now = nowIsoTimestamp();
  const today = todayIsoDate();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO profiles (id, full_name, business_name, avatar_uri, base_currency_code, pin_hash, biometric_enabled, onboarding_completed, created_at, updated_at)
       VALUES (?, ?, ?, NULL, 'IDR', NULL, 0, 0, ?, ?)`,
      [DEFAULT_PROFILE_ID, 'Alex Qoupay', 'Qoupay Studio & Retail', now, now]
    );

    await db.runAsync(
      `INSERT INTO workspaces (id, type, name, default_currency_code, color_theme, is_active, created_at, updated_at)
       VALUES (?, 'PERSONAL', 'Personal Finance', 'IDR', '#7C3AED', 1, ?, ?),
              (?, 'BUSINESS', 'Business Finance', 'IDR', '#2563EB', 1, ?, ?)`,
      [PERSONAL_WORKSPACE_ID, now, now, BUSINESS_WORKSPACE_ID, now, now]
    );

    for (const cur of DEFAULT_CURRENCIES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO currencies (code, name, symbol, decimal_digits, is_base, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cur.code, cur.name, cur.symbol, cur.decimal_digits, cur.is_base, cur.is_active]
      );
    }

    for (const fx of DEFAULT_EXCHANGE_RATES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO exchange_rates (id, from_currency, to_currency, rate, source, effective_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [fx.id, fx.from_currency, fx.to_currency, fx.rate, fx.source, today, now]
      );
    }

    for (const coa of DEFAULT_BUSINESS_COA) {
      await db.runAsync(
        `INSERT INTO chart_of_accounts (id, workspace_id, code, name, account_type, normal_balance, parent_id, is_system, is_active, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 1, NULL)`,
        [coa.id, BUSINESS_WORKSPACE_ID, coa.code, coa.name, coa.account_type, coa.normal_balance, coa.is_system]
      );
    }

    await db.runAsync(
      `INSERT INTO accounts (id, workspace_id, name, type, currency_code, initial_balance, current_balance, linked_coa_id, icon, color, deleted_at)
       VALUES
        ('acc_p_bca', ?, 'BCA Personal', 'BANK', 'IDR', 6500000, 8250000, NULL, 'Landmark', '#7C3AED', NULL),
        ('acc_p_cash', ?, 'Dompet Tunai', 'CASH', 'IDR', 1900000, 0, NULL, 'Wallet', '#10B981', NULL),
        ('acc_b_bank', ?, 'Bank Operasional Bisnis', 'BANK', 'IDR', 15000000, 15500000, 'coa_1102', 'Building2', '#2563EB', NULL),
        ('acc_b_cash', ?, 'Kas Kecil Bisnis', 'CASH', 'IDR', 2000000, 2000000, 'coa_1101', 'Banknote', '#0D9488', NULL)`,
      [PERSONAL_WORKSPACE_ID, PERSONAL_WORKSPACE_ID, BUSINESS_WORKSPACE_ID, BUSINESS_WORKSPACE_ID]
    );

    await db.runAsync(
      `INSERT INTO categories (id, workspace_id, name, type, parent_id, linked_coa_id, icon, color, is_system, deleted_at)
       VALUES
        ('cat_p_salary', ?, 'Gaji & Pendapatan Pribadi', 'INCOME', NULL, NULL, 'Briefcase', '#10B981', 1, NULL),
        ('cat_p_food', ?, 'Belanja & Kebutuhan Harian', 'EXPENSE', NULL, NULL, 'ShoppingBag', '#7C3AED', 1, NULL),
        ('cat_p_cafe', ?, 'Makan & Kafe', 'EXPENSE', NULL, NULL, 'Coffee', '#F59E0B', 1, NULL),
        ('cat_p_transport', ?, 'Transportasi & BBM', 'EXPENSE', NULL, NULL, 'Car', '#2563EB', 1, NULL),
        ('cat_b_sales', ?, 'Penjualan Produk', 'INCOME', NULL, 'coa_4101', 'ShoppingCart', '#10B981', 1, NULL),
        ('cat_b_service', ?, 'Pendapatan Jasa', 'INCOME', NULL, 'coa_4102', 'Sparkles', '#2563EB', 1, NULL),
        ('cat_b_cogs', ?, 'Pembelian Stok / HPP', 'EXPENSE', NULL, 'coa_5101', 'Package', '#EF4444', 1, NULL),
        ('cat_b_ops', ?, 'Biaya Operasional & Listrik', 'EXPENSE', NULL, 'coa_5202', 'Zap', '#F59E0B', 1, NULL),
        ('cat_b_mkt', ?, 'Iklan & Pemasaran', 'EXPENSE', NULL, 'coa_5203', 'Megaphone', '#7C3AED', 1, NULL)`,
      [
        PERSONAL_WORKSPACE_ID,
        PERSONAL_WORKSPACE_ID,
        PERSONAL_WORKSPACE_ID,
        PERSONAL_WORKSPACE_ID,
        BUSINESS_WORKSPACE_ID,
        BUSINESS_WORKSPACE_ID,
        BUSINESS_WORKSPACE_ID,
        BUSINESS_WORKSPACE_ID,
        BUSINESS_WORKSPACE_ID,
      ]
    );

    await db.runAsync(
      `INSERT INTO journal_entries (id, workspace_id, entry_number, entry_date, description, reference_no, source_type, status, total_debit, total_credit, currency_code, exchange_rate, reversal_of_id, reversed_by_id, posted_at, deleted_at)
       VALUES
        ('je_init_001', ?, 'JE-202611-0001', ?, 'Saldo Modal Awal Bisnis (Bank & Kas Kecil)', 'OPEN-01', 'MANUAL', 'POSTED', 17000000, 17000000, 'IDR', 1, NULL, NULL, ?, NULL),
        ('je_sale_002', ?, 'JE-202611-0002', ?, 'Penjualan Tunai Produk', 'INV-001', 'AUTO_TRANSACTION', 'POSTED', 500000, 500000, 'IDR', 1, NULL, NULL, ?, NULL)`,
      [BUSINESS_WORKSPACE_ID, today, now, BUSINESS_WORKSPACE_ID, today, now]
    );

    await db.runAsync(
      `INSERT INTO journal_lines (id, journal_entry_id, line_order, coa_id, account_id, debit_amount, credit_amount, memo)
       VALUES
        ('jl_001_1', 'je_init_001', 1, 'coa_1102', 'acc_b_bank', 15000000, 0, 'Setoran Modal Bank Operasional'),
        ('jl_001_2', 'je_init_001', 2, 'coa_1101', 'acc_b_cash', 2000000, 0, 'Setoran Modal Kas Kecil'),
        ('jl_001_3', 'je_init_001', 3, 'coa_3101', NULL, 0, 17000000, 'Modal Awal Pemilik'),
        ('jl_002_1', 'je_sale_002', 1, 'coa_1102', 'acc_b_bank', 500000, 0, 'Penerimaan Penjualan Produk'),
        ('jl_002_2', 'je_sale_002', 2, 'coa_4101', NULL, 0, 500000, 'Pendapatan Penjualan Produk')`
    );

    await db.runAsync(
      `INSERT INTO transactions (id, workspace_id, type, account_id, to_account_id, category_id, amount, currency_code, exchange_rate_to_base, base_amount, transaction_date, title, notes, paired_transaction_id, journal_entry_id, deleted_at, created_at, updated_at)
       VALUES
        ('tx_b_001', ?, 'INCOME', 'acc_b_bank', NULL, 'cat_b_sales', 500000, 'IDR', 1, 500000, ?, 'Penjualan Tunai Produk', 'Contoh jurnal otomatis Rp500.000', NULL, 'je_sale_002', NULL, ?, ?),
        ('tx_p_001', ?, 'INCOME', 'acc_p_bca', NULL, 'cat_p_salary', 1900000, 'IDR', 1, 1900000, ?, 'Penerimaan Gaji & Bonus', 'Gaji bulan berjalan', NULL, NULL, NULL, ?, ?),
        ('tx_p_002', ?, 'EXPENSE', 'acc_p_bca', NULL, 'cat_p_food', 150000, 'IDR', 1, 150000, ?, 'Belanja Kebutuhan Harian', 'Supermarket & rumah tangga', NULL, NULL, NULL, ?, ?)`,
      [
        BUSINESS_WORKSPACE_ID, today, now, now,
        PERSONAL_WORKSPACE_ID, today, now, now,
        PERSONAL_WORKSPACE_ID, today, now, now,
      ]
    );

    await db.runAsync(
      `INSERT INTO budgets (id, workspace_id, name, category_id, amount_limit, currency_code, period_type, start_date, end_date, alert_threshold_percent, deleted_at)
       VALUES
        ('bdg_p_1', ?, 'Anggaran Belanja Kebutuhan', 'cat_p_food', 2500000, 'IDR', 'MONTHLY', '2026-11-01', '2026-11-30', 80, NULL),
        ('bdg_p_2', ?, 'Makan & Kafe Bulanan', 'cat_p_cafe', 1000000, 'IDR', 'MONTHLY', '2026-11-01', '2026-11-30', 80, NULL),
        ('bdg_b_1', ?, 'Anggaran Iklan & Marketing', 'cat_b_mkt', 3000000, 'IDR', 'MONTHLY', '2026-11-01', '2026-11-30', 80, NULL)`,
      [PERSONAL_WORKSPACE_ID, PERSONAL_WORKSPACE_ID, BUSINESS_WORKSPACE_ID]
    );

    await db.runAsync(
      `INSERT INTO debts (id, workspace_id, type, counterparty_name, counterparty_contact, principal_amount, remaining_amount, currency_code, exchange_rate, issue_date, due_date, status, linked_coa_id, notes, deleted_at)
       VALUES
        ('debt_b_ar1', ?, 'RECEIVABLE', 'PT Nusantara Retail', '0812-3456-7890', 2500000, 1500000, 'IDR', 1, ?, '2026-12-15', 'PARTIAL', 'coa_1201', 'Invoice #INV-2026-08', NULL),
        ('debt_p_ap1', ?, 'PAYABLE', 'Cicilan Gadget Kerja', '-', 3000000, 1200000, 'IDR', 1, ?, '2026-12-10', 'PARTIAL', NULL, 'Sisa 2x cicilan', NULL)`,
      [BUSINESS_WORKSPACE_ID, today, PERSONAL_WORKSPACE_ID, today]
    );
  });
}

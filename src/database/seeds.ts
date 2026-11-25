import { CoaAccountType, NormalBalance } from '@/types/domain';

export const PERSONAL_WORKSPACE_ID = 'ws_personal';
export const BUSINESS_WORKSPACE_ID = 'ws_business';
export const DEFAULT_PROFILE_ID = 'profile_main';

export interface SeedCoaItem {
  id: string;
  code: string;
  name: string;
  account_type: CoaAccountType;
  normal_balance: NormalBalance;
  is_system: number;
}

export const DEFAULT_BUSINESS_COA: SeedCoaItem[] = [
  // 1 - ASSETS (DEBIT)
  { id: 'coa_1101', code: '1-1001', name: 'Kas Operasional Bisnis (Cash on Hand)', account_type: 'ASSET', normal_balance: 'DEBIT', is_system: 1 },
  { id: 'coa_1102', code: '1-1002', name: 'Rekening Bank Bisnis (Business Bank)', account_type: 'ASSET', normal_balance: 'DEBIT', is_system: 1 },
  { id: 'coa_1201', code: '1-2001', name: 'Piutang Usaha (Accounts Receivable)', account_type: 'ASSET', normal_balance: 'DEBIT', is_system: 1 },
  { id: 'coa_1301', code: '1-3001', name: 'Persediaan Barang Dagang (Inventory)', account_type: 'ASSET', normal_balance: 'DEBIT', is_system: 1 },
  { id: 'coa_1401', code: '1-4001', name: 'Peralatan & Inventaris Kantor (Equipment)', account_type: 'ASSET', normal_balance: 'DEBIT', is_system: 1 },

  // 2 - LIABILITIES (CREDIT)
  { id: 'coa_2101', code: '2-1001', name: 'Utang Usaha (Accounts Payable)', account_type: 'LIABILITY', normal_balance: 'CREDIT', is_system: 1 },
  { id: 'coa_2102', code: '2-1002', name: 'Utang Pajak & Biaya Masih Harus Dibayar', account_type: 'LIABILITY', normal_balance: 'CREDIT', is_system: 1 },
  { id: 'coa_2201', code: '2-2001', name: 'Pinjaman Bank Jangka Panjang', account_type: 'LIABILITY', normal_balance: 'CREDIT', is_system: 1 },

  // 3 - EQUITY (CREDIT / DEBIT for Draw)
  { id: 'coa_3101', code: '3-1001', name: 'Modal Awal Pemilik (Owner Equity)', account_type: 'EQUITY', normal_balance: 'CREDIT', is_system: 1 },
  { id: 'coa_3102', code: '3-1002', name: 'Setoran Modal dari Personal (Owner Contribution)', account_type: 'EQUITY', normal_balance: 'CREDIT', is_system: 1 },
  { id: 'coa_3103', code: '3-1003', name: 'Prive / Penarikan ke Personal (Owner Draw)', account_type: 'EQUITY', normal_balance: 'DEBIT', is_system: 1 },
  { id: 'coa_3201', code: '3-2001', name: 'Laba Ditahan (Retained Earnings)', account_type: 'EQUITY', normal_balance: 'CREDIT', is_system: 1 },

  // 4 - REVENUE (CREDIT)
  { id: 'coa_4101', code: '4-1001', name: 'Pendapatan Penjualan Produk (Sales Revenue)', account_type: 'REVENUE', normal_balance: 'CREDIT', is_system: 1 },
  { id: 'coa_4102', code: '4-1002', name: 'Pendapatan Jasa & Konsultasi (Service Revenue)', account_type: 'REVENUE', normal_balance: 'CREDIT', is_system: 1 },
  { id: 'coa_4201', code: '4-2001', name: 'Pendapatan Lain-Lain (Other Income)', account_type: 'REVENUE', normal_balance: 'CREDIT', is_system: 1 },

  // 5 - EXPENSE (DEBIT)
  { id: 'coa_5101', code: '5-1001', name: 'Harga Pokok Penjualan / HPP (COGS)', account_type: 'EXPENSE', normal_balance: 'DEBIT', is_system: 1 },
  { id: 'coa_5201', code: '5-2001', name: 'Beban Gaji & Upah Tim (Payroll Expense)', account_type: 'EXPENSE', normal_balance: 'DEBIT', is_system: 1 },
  { id: 'coa_5202', code: '5-2002', name: 'Beban Sewa & Utilitas Listrik/Internet', account_type: 'EXPENSE', normal_balance: 'DEBIT', is_system: 1 },
  { id: 'coa_5203', code: '5-2003', name: 'Beban Pemasaran & Iklan (Marketing)', account_type: 'EXPENSE', normal_balance: 'DEBIT', is_system: 1 },
  { id: 'coa_5204', code: '5-2004', name: 'Beban Operasional & Transportasi', account_type: 'EXPENSE', normal_balance: 'DEBIT', is_system: 1 },
];

export const DEFAULT_CURRENCIES = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimal_digits: 0, is_base: 1, is_active: 1 },
  { code: 'USD', name: 'US Dollar', symbol: '$', decimal_digits: 2, is_base: 0, is_active: 1 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimal_digits: 2, is_base: 0, is_active: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimal_digits: 2, is_base: 0, is_active: 1 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimal_digits: 2, is_base: 0, is_active: 1 },
];

export const DEFAULT_EXCHANGE_RATES = [
  { id: 'fx_usd_idr', from_currency: 'USD', to_currency: 'IDR', rate: 15850, source: 'MANUAL' as const },
  { id: 'fx_sgd_idr', from_currency: 'SGD', to_currency: 'IDR', rate: 11800, source: 'MANUAL' as const },
  { id: 'fx_eur_idr', from_currency: 'EUR', to_currency: 'IDR', rate: 16900, source: 'MANUAL' as const },
  { id: 'fx_myr_idr', from_currency: 'MYR', to_currency: 'IDR', rate: 3550, source: 'MANUAL' as const },
];

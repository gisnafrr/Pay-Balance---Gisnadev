export const DB_SCHEMA_VERSION = 1;

export const INITIAL_SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'Pengguna Qoupay',
  business_name TEXT NOT NULL DEFAULT 'Bisnis Saya',
  avatar_uri TEXT,
  base_currency_code TEXT NOT NULL DEFAULT 'IDR',
  pin_hash TEXT,
  biometric_enabled INTEGER NOT NULL DEFAULT 0,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PERSONAL', 'BUSINESS')),
  name TEXT NOT NULL,
  default_currency_code TEXT NOT NULL DEFAULT 'IDR',
  color_theme TEXT NOT NULL DEFAULT '#7C3AED',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. currencies
CREATE TABLE IF NOT EXISTS currencies (
  code TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_digits INTEGER NOT NULL DEFAULT 0,
  is_base INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

-- 4. exchange_rates
CREATE TABLE IF NOT EXISTS exchange_rates (
  id TEXT PRIMARY KEY NOT NULL,
  from_currency TEXT NOT NULL REFERENCES currencies(code),
  to_currency TEXT NOT NULL REFERENCES currencies(code),
  rate REAL NOT NULL CHECK (rate > 0),
  source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'AUTO')),
  effective_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 5. chart_of_accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
  normal_balance TEXT NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
  parent_id TEXT REFERENCES chart_of_accounts(id),
  is_system INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT
);

-- 6. accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CASH', 'BANK', 'EWALLET', 'CREDIT_CARD', 'INVESTMENT')),
  currency_code TEXT NOT NULL REFERENCES currencies(code),
  initial_balance REAL NOT NULL DEFAULT 0,
  current_balance REAL NOT NULL DEFAULT 0,
  linked_coa_id TEXT REFERENCES chart_of_accounts(id),
  icon TEXT NOT NULL DEFAULT 'Wallet',
  color TEXT NOT NULL DEFAULT '#7C3AED',
  deleted_at TEXT
);

-- 7. categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  parent_id TEXT REFERENCES categories(id),
  linked_coa_id TEXT REFERENCES chart_of_accounts(id),
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#7C3AED',
  is_system INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

-- 9. journal_entries (created before transactions so FK is valid)
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  entry_number TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_no TEXT,
  source_type TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source_type IN ('MANUAL', 'AUTO_TRANSACTION', 'WORKSPACE_TRANSFER', 'DEBT', 'REVERSAL')),
  status TEXT NOT NULL DEFAULT 'POSTED' CHECK (status IN ('DRAFT', 'POSTED', 'VOIDED')),
  total_debit REAL NOT NULL DEFAULT 0,
  total_credit REAL NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'IDR',
  exchange_rate REAL NOT NULL DEFAULT 1,
  reversal_of_id TEXT REFERENCES journal_entries(id),
  reversed_by_id TEXT REFERENCES journal_entries(id),
  posted_at TEXT,
  deleted_at TEXT
);

-- 10. journal_lines
CREATE TABLE IF NOT EXISTS journal_lines (
  id TEXT PRIMARY KEY NOT NULL,
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  line_order INTEGER NOT NULL DEFAULT 1,
  coa_id TEXT NOT NULL REFERENCES chart_of_accounts(id),
  account_id TEXT REFERENCES accounts(id),
  debit_amount REAL NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
  credit_amount REAL NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
  memo TEXT
);

-- 8. transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER', 'WORKSPACE_TRANSFER')),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  to_account_id TEXT REFERENCES accounts(id),
  category_id TEXT REFERENCES categories(id),
  amount REAL NOT NULL CHECK (amount > 0),
  currency_code TEXT NOT NULL REFERENCES currencies(code),
  exchange_rate_to_base REAL NOT NULL DEFAULT 1,
  base_amount REAL NOT NULL,
  transaction_date TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  paired_transaction_id TEXT,
  journal_entry_id TEXT REFERENCES journal_entries(id),
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 11. budgets
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  name TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id),
  amount_limit REAL NOT NULL CHECK (amount_limit > 0),
  currency_code TEXT NOT NULL DEFAULT 'IDR',
  period_type TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (period_type IN ('MONTHLY', 'YEARLY', 'CUSTOM')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  alert_threshold_percent INTEGER NOT NULL DEFAULT 80,
  deleted_at TEXT
);

-- 12. debts
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  type TEXT NOT NULL CHECK (type IN ('PAYABLE', 'RECEIVABLE')),
  counterparty_name TEXT NOT NULL,
  counterparty_contact TEXT,
  principal_amount REAL NOT NULL CHECK (principal_amount > 0),
  remaining_amount REAL NOT NULL CHECK (remaining_amount >= 0),
  currency_code TEXT NOT NULL DEFAULT 'IDR',
  exchange_rate REAL NOT NULL DEFAULT 1,
  issue_date TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PARTIAL', 'PAID')),
  linked_coa_id TEXT REFERENCES chart_of_accounts(id),
  notes TEXT,
  deleted_at TEXT
);

-- 13. debt_payments
CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY NOT NULL,
  debt_id TEXT NOT NULL REFERENCES debts(id),
  transaction_id TEXT REFERENCES transactions(id),
  journal_entry_id TEXT REFERENCES journal_entries(id),
  amount_paid REAL NOT NULL CHECK (amount_paid > 0),
  payment_date TEXT NOT NULL,
  notes TEXT,
  deleted_at TEXT
);

-- 14. attachments
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('TRANSACTION', 'JOURNAL', 'DEBT')),
  owner_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_rel_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  checksum_sha256 TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT NOT NULL
);

-- 15. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_payload_json TEXT,
  new_payload_json TEXT,
  created_at TEXT NOT NULL
);

-- 16. settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 17. backups
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('NORMAL', 'ENCRYPTED')),
  size_bytes INTEGER NOT NULL DEFAULT 0,
  attachment_count INTEGER NOT NULL DEFAULT 0,
  db_schema_version INTEGER NOT NULL DEFAULT 1,
  checksum_sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  restored_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tx_workspace_date ON transactions(workspace_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_je_workspace_date ON journal_entries(workspace_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_jl_entry ON journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_jl_coa ON journal_lines(coa_id);
`;

export type WorkspaceType = 'PERSONAL' | 'BUSINESS';
export type ActiveWorkspaceMode = 'PERSONAL' | 'BUSINESS' | 'COMBINED';
export type ThemeMode = 'light' | 'dark';
export type LanguageCode = 'id' | 'en';

export type AccountType = 'CASH' | 'BANK' | 'EWALLET' | 'CREDIT_CARD' | 'INVESTMENT';
export type CategoryType = 'INCOME' | 'EXPENSE';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'WORKSPACE_TRANSFER';

export type CoaAccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';
export type JournalStatus = 'DRAFT' | 'POSTED' | 'VOIDED';
export type JournalSourceType = 'MANUAL' | 'AUTO_TRANSACTION' | 'WORKSPACE_TRANSFER' | 'DEBT' | 'REVERSAL';

export type DebtType = 'PAYABLE' | 'RECEIVABLE';
export type DebtStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type BudgetPeriodType = 'MONTHLY' | 'YEARLY' | 'CUSTOM';
export type AttachmentOwnerType = 'TRANSACTION' | 'JOURNAL' | 'DEBT';
export type BackupType = 'NORMAL' | 'ENCRYPTED';

export interface ProfileRecord {
  id: string;
  full_name: string;
  business_name: string;
  avatar_uri: string | null;
  base_currency_code: string;
  pin_hash: string | null;
  biometric_enabled: number;
  onboarding_completed: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceRecord {
  id: string;
  type: WorkspaceType;
  name: string;
  default_currency_code: string;
  color_theme: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CurrencyRecord {
  code: string;
  name: string;
  symbol: string;
  decimal_digits: number;
  is_base: number;
  is_active: number;
}

export interface ExchangeRateRecord {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  source: 'MANUAL' | 'AUTO';
  effective_date: string;
  created_at: string;
}

export interface CoaRecord {
  id: string;
  workspace_id: string;
  code: string;
  name: string;
  account_type: CoaAccountType;
  normal_balance: NormalBalance;
  parent_id: string | null;
  is_system: number;
  is_active: number;
  deleted_at: string | null;
}

export interface AccountRecord {
  id: string;
  workspace_id: string;
  name: string;
  type: AccountType;
  currency_code: string;
  initial_balance: number;
  current_balance: number;
  linked_coa_id: string | null;
  icon: string;
  color: string;
  deleted_at: string | null;
}

export interface CategoryRecord {
  id: string;
  workspace_id: string;
  name: string;
  type: CategoryType;
  parent_id: string | null;
  linked_coa_id: string | null;
  icon: string;
  color: string;
  is_system: number;
  deleted_at: string | null;
}

export interface TransactionRecord {
  id: string;
  workspace_id: string;
  type: TransactionType;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  amount: number;
  currency_code: string;
  exchange_rate_to_base: number;
  base_amount: number;
  transaction_date: string;
  title: string;
  notes: string | null;
  paired_transaction_id: string | null;
  journal_entry_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined view helpers
  account_name?: string;
  to_account_name?: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  workspace_type?: WorkspaceType;
  attachment_count?: number;
}

export interface JournalEntryRecord {
  id: string;
  workspace_id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference_no: string | null;
  source_type: JournalSourceType;
  status: JournalStatus;
  total_debit: number;
  total_credit: number;
  currency_code: string;
  exchange_rate: number;
  reversal_of_id: string | null;
  reversed_by_id: string | null;
  posted_at: string | null;
  deleted_at: string | null;
  lines?: JournalLineRecord[];
}

export interface JournalLineRecord {
  id: string;
  journal_entry_id: string;
  line_order: number;
  coa_id: string;
  account_id: string | null;
  debit_amount: number;
  credit_amount: number;
  memo: string | null;
  coa_code?: string;
  coa_name?: string;
  coa_type?: CoaAccountType;
}

export interface BudgetRecord {
  id: string;
  workspace_id: string;
  name: string;
  category_id: string | null;
  amount_limit: number;
  currency_code: string;
  period_type: BudgetPeriodType;
  start_date: string;
  end_date: string;
  alert_threshold_percent: number;
  deleted_at: string | null;
  spent_amount?: number;
  category_name?: string;
  category_color?: string;
}

export interface DebtRecord {
  id: string;
  workspace_id: string;
  type: DebtType;
  counterparty_name: string;
  counterparty_contact: string | null;
  principal_amount: number;
  remaining_amount: number;
  currency_code: string;
  exchange_rate: number;
  issue_date: string;
  due_date: string | null;
  status: DebtStatus;
  linked_coa_id: string | null;
  notes: string | null;
  deleted_at: string | null;
}

export interface DebtPaymentRecord {
  id: string;
  debt_id: string;
  transaction_id: string | null;
  journal_entry_id: string | null;
  amount_paid: number;
  payment_date: string;
  notes: string | null;
  deleted_at: string | null;
}

export interface AttachmentRecord {
  id: string;
  workspace_id: string;
  owner_type: AttachmentOwnerType;
  owner_id: string;
  file_name: string;
  file_rel_path: string;
  mime_type: string;
  file_size_bytes: number;
  checksum_sha256: string;
  deleted_at: string | null;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  workspace_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  old_payload_json: string | null;
  new_payload_json: string | null;
  created_at: string;
}

export interface BackupRecord {
  id: string;
  file_name: string;
  file_path: string;
  backup_type: BackupType;
  size_bytes: number;
  attachment_count: number;
  db_schema_version: number;
  checksum_sha256: string;
  created_at: string;
  restored_at: string | null;
}

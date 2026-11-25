import { getDb } from '@/database/client';
import { BUSINESS_WORKSPACE_ID, PERSONAL_WORKSPACE_ID } from '@/database/seeds';
import {
  AccountRecord,
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
  JournalStatus,
  TransactionRecord,
} from '@/types/domain';
import { generateId, nowIsoTimestamp, todayIsoDate } from '@/utils/format';

export interface JournalLineInput {
  coa_id: string;
  account_id?: string | null;
  debit_amount: number;
  credit_amount: number;
  memo?: string;
}

export interface CreateManualJournalInput {
  workspace_id?: string;
  entry_date: string;
  description: string;
  reference_no?: string;
  status?: JournalStatus;
  currency_code?: string;
  exchange_rate?: number;
  lines: JournalLineInput[];
}

export interface TrialBalanceRow {
  coa_id: string;
  code: string;
  name: string;
  account_type: string;
  normal_balance: string;
  total_debit: number;
  total_credit: number;
  net_debit: number;
  net_credit: number;
}

export interface LedgerEntryRow {
  line_id: string;
  entry_id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
}

/**
 * Validates Double-Entry Bookkeeping rules:
 * 1. Minimum 2 lines
 * 2. Total Debit > 0 and Total Debit === Total Credit
 */
export function validateDoubleEntryLines(lines: JournalLineInput[]): {
  valid: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  error?: string;
} {
  const activeLines = lines.filter((l) => l.coa_id && (l.debit_amount > 0 || l.credit_amount > 0));
  const totalDebit = activeLines.reduce((acc, l) => acc + Number(l.debit_amount || 0), 0);
  const totalCredit = activeLines.reduce((acc, l) => acc + Number(l.credit_amount || 0), 0);
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;

  if (activeLines.length < 2) {
    return {
      valid: false,
      totalDebit,
      totalCredit,
      difference,
      error: 'Setiap jurnal wajib memiliki minimal 2 baris akun.',
    };
  }
  if (totalDebit <= 0 || Math.abs(difference) > 0.001) {
    return {
      valid: false,
      totalDebit,
      totalCredit,
      difference,
      error: `Total Debit dan Kredit harus seimbang (Selisih: ${difference}).`,
    };
  }
  return { valid: true, totalDebit, totalCredit, difference: 0 };
}

export async function getExchangeRateToBase(fromCurrency: string, baseCurrency = 'IDR'): Promise<number> {
  if (fromCurrency === baseCurrency) return 1;
  const db = await getDb();
  const row = await db.getFirstAsync<{ rate: number }>(
    `SELECT rate FROM exchange_rates WHERE from_currency = ? AND to_currency = ? ORDER BY effective_date DESC, created_at DESC LIMIT 1`,
    [fromCurrency, baseCurrency]
  );
  return row?.rate ?? 1;
}

/**
 * Creates a Manual or System Double-Entry Journal in Business Workspace
 */
export async function createJournalEntry(input: CreateManualJournalInput): Promise<string> {
  const validation = validateDoubleEntryLines(input.lines);
  const status = input.status ?? 'POSTED';
  if (status === 'POSTED' && !validation.valid) {
    throw new Error(validation.error || 'Jurnal tidak seimbang.');
  }

  const db = await getDb();
  const entryId = generateId('je');
  const now = nowIsoTimestamp();
  const wsId = input.workspace_id ?? BUSINESS_WORKSPACE_ID;

  const countRow = await db.getFirstAsync<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM journal_entries WHERE workspace_id = ?',
    [wsId]
  );
  const seq = ((countRow?.cnt ?? 0) + 1).toString().padStart(4, '0');
  const ym = (input.entry_date || todayIsoDate()).slice(0, 7).replace('-', '');
  const entryNumber = `JE-${ym}-${seq}`;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO journal_entries (
        id, workspace_id, entry_number, entry_date, description, reference_no,
        source_type, status, total_debit, total_credit, currency_code, exchange_rate,
        reversal_of_id, reversed_by_id, posted_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'MANUAL', ?, ?, ?, ?, ?, NULL, NULL, ?, NULL)`,
      [
        entryId,
        wsId,
        entryNumber,
        input.entry_date,
        input.description,
        input.reference_no ?? null,
        status,
        validation.totalDebit,
        validation.totalCredit,
        input.currency_code ?? 'IDR',
        input.exchange_rate ?? 1,
        status === 'POSTED' ? now : null,
      ]
    );

    let order = 1;
    for (const line of input.lines) {
      if (!line.coa_id || (line.debit_amount <= 0 && line.credit_amount <= 0)) continue;
      await db.runAsync(
        `INSERT INTO journal_lines (id, journal_entry_id, line_order, coa_id, account_id, debit_amount, credit_amount, memo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId('jl'),
          entryId,
          order++,
          line.coa_id,
          line.account_id ?? null,
          Number(line.debit_amount || 0),
          Number(line.credit_amount || 0),
          line.memo ?? null,
        ]
      );

      // Update wallet balance if line references an account_id and is POSTED
      if (status === 'POSTED' && line.account_id) {
        const delta = Number(line.debit_amount || 0) - Number(line.credit_amount || 0);
        await db.runAsync(
          `UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?`,
          [delta, line.account_id]
        );
      }
    }

    await db.runAsync(
      `INSERT INTO audit_logs (id, workspace_id, entity_type, entity_id, action, old_payload_json, new_payload_json, created_at)
       VALUES (?, ?, 'JOURNAL', ?, 'POST_JOURNAL', NULL, ?, ?)`,
      [generateId('aud'), wsId, entryId, JSON.stringify({ entryNumber, total: validation.totalDebit }), now]
    );
  });

  return entryId;
}

/**
 * Reverses an already POSTED journal entry (since posted journals are immutable)
 */
export async function reversePostedJournalEntry(journalEntryId: string, reason = 'Koreksi Jurnal Pembalik'): Promise<string> {
  const db = await getDb();
  const original = await db.getFirstAsync<JournalEntryRecord>(
    `SELECT * FROM journal_entries WHERE id = ? AND deleted_at IS NULL`,
    [journalEntryId]
  );
  if (!original) {
    throw new Error('Jurnal tidak ditemukan.');
  }
  if (original.status !== 'POSTED') {
    throw new Error('Hanya jurnal berstatus POSTED yang memerlukan Jurnal Pembalik.');
  }
  if (original.reversed_by_id) {
    throw new Error('Jurnal ini sudah pernah dibalik sebelumnya.');
  }

  const lines = await db.getAllAsync<JournalLineRecord>(
    `SELECT * FROM journal_lines WHERE journal_entry_id = ? ORDER BY line_order ASC`,
    [journalEntryId]
  );

  const reversalId = generateId('je_rev');
  const now = nowIsoTimestamp();
  const today = todayIsoDate();
  const revNumber = `${original.entry_number}-REV`;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO journal_entries (
        id, workspace_id, entry_number, entry_date, description, reference_no,
        source_type, status, total_debit, total_credit, currency_code, exchange_rate,
        reversal_of_id, reversed_by_id, posted_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'REVERSAL', 'POSTED', ?, ?, ?, ?, ?, NULL, ?, NULL)`,
      [
        reversalId,
        original.workspace_id,
        revNumber,
        today,
        `[PEMBALIK] ${original.description} (${reason})`,
        original.entry_number,
        original.total_credit,
        original.total_debit,
        original.currency_code,
        original.exchange_rate,
        original.id,
        now,
      ]
    );

    for (const line of lines) {
      // Swap Debit & Credit
      await db.runAsync(
        `INSERT INTO journal_lines (id, journal_entry_id, line_order, coa_id, account_id, debit_amount, credit_amount, memo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId('jl'),
          reversalId,
          line.line_order,
          line.coa_id,
          line.account_id,
          line.credit_amount,
          line.debit_amount,
          `Pembalik baris ${line.memo ?? ''}`.trim(),
        ]
      );

      if (line.account_id) {
        const delta = Number(line.credit_amount || 0) - Number(line.debit_amount || 0);
        await db.runAsync(
          `UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?`,
          [delta, line.account_id]
        );
      }
    }

    await db.runAsync(
      `UPDATE journal_entries SET reversed_by_id = ? WHERE id = ?`,
      [reversalId, original.id]
    );

    await db.runAsync(
      `INSERT INTO audit_logs (id, workspace_id, entity_type, entity_id, action, old_payload_json, new_payload_json, created_at)
       VALUES (?, ?, 'JOURNAL', ?, 'REVERSE_JOURNAL', ?, ?, ?)`,
      [generateId('aud'), original.workspace_id, original.id, JSON.stringify({ originalId: original.id }), JSON.stringify({ reversalId }), now]
    );
  });

  return reversalId;
}

/**
 * Creates a Transaction (Personal simple OR Business Auto-Journal)
 */
export async function createTransaction(params: {
  workspace_id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  account_id: string;
  to_account_id?: string | null;
  category_id?: string | null;
  amount: number;
  currency_code?: string;
  exchange_rate_to_base?: number;
  transaction_date: string;
  title: string;
  notes?: string;
  attachment?: {
    file_name: string;
    file_rel_path: string;
    mime_type: string;
    file_size_bytes: number;
  } | null;
}): Promise<string> {
  const db = await getDb();
  const txId = generateId('tx');
  const now = nowIsoTimestamp();

  const account = await db.getFirstAsync<AccountRecord>(
    'SELECT * FROM accounts WHERE id = ?',
    [params.account_id]
  );
  if (!account) throw new Error('Rekening tidak ditemukan.');

  const currency = params.currency_code || account.currency_code || 'IDR';
  const rate = params.exchange_rate_to_base || (await getExchangeRateToBase(currency, 'IDR'));
  const baseAmount = params.amount * rate;

  let journalEntryId: string | null = null;

  await db.withTransactionAsync(async () => {
    // Update account balance(s)
    if (params.type === 'INCOME') {
      await db.runAsync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
        params.amount,
        params.account_id,
      ]);
    } else if (params.type === 'EXPENSE') {
      await db.runAsync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
        params.amount,
        params.account_id,
      ]);
    } else if (params.type === 'TRANSFER') {
      if (!params.to_account_id) throw new Error('Pilih rekening tujuan transfer.');
      await db.runAsync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
        params.amount,
        params.account_id,
      ]);
      await db.runAsync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
        params.amount,
        params.to_account_id,
      ]);
    }

    // If BUSINESS workspace, automatically generate Double-Entry Journal
    if (params.workspace_id === BUSINESS_WORKSPACE_ID) {
      journalEntryId = generateId('je_auto');
      const countRow = await db.getFirstAsync<{ cnt: number }>(
        'SELECT COUNT(*) as cnt FROM journal_entries WHERE workspace_id = ?',
        [BUSINESS_WORKSPACE_ID]
      );
      const seq = ((countRow?.cnt ?? 0) + 1).toString().padStart(4, '0');
      const ym = params.transaction_date.slice(0, 7).replace('-', '');
      const entryNumber = `JE-${ym}-${seq}`;

      const accountCoaId = account.linked_coa_id || 'coa_1102';
      let debitCoa = accountCoaId;
      let creditCoa = 'coa_4101';

      if (params.type === 'INCOME') {
        const cat = params.category_id
          ? await db.getFirstAsync<CategoryRecord>('SELECT * FROM categories WHERE id = ?', [params.category_id])
          : null;
        debitCoa = accountCoaId;
        creditCoa = cat?.linked_coa_id || 'coa_4101';
      } else if (params.type === 'EXPENSE') {
        const cat = params.category_id
          ? await db.getFirstAsync<CategoryRecord>('SELECT * FROM categories WHERE id = ?', [params.category_id])
          : null;
        debitCoa = cat?.linked_coa_id || 'coa_5204';
        creditCoa = accountCoaId;
      } else if (params.type === 'TRANSFER' && params.to_account_id) {
        const toAcc = await db.getFirstAsync<AccountRecord>('SELECT * FROM accounts WHERE id = ?', [
          params.to_account_id,
        ]);
        debitCoa = toAcc?.linked_coa_id || 'coa_1101';
        creditCoa = accountCoaId;
      }

      await db.runAsync(
        `INSERT INTO journal_entries (
          id, workspace_id, entry_number, entry_date, description, reference_no,
          source_type, status, total_debit, total_credit, currency_code, exchange_rate,
          reversal_of_id, reversed_by_id, posted_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, NULL, 'AUTO_TRANSACTION', 'POSTED', ?, ?, ?, ?, NULL, NULL, ?, NULL)`,
        [
          journalEntryId,
          BUSINESS_WORKSPACE_ID,
          entryNumber,
          params.transaction_date,
          params.title,
          baseAmount,
          baseAmount,
          currency,
          rate,
          now,
        ]
      );

      await db.runAsync(
        `INSERT INTO journal_lines (id, journal_entry_id, line_order, coa_id, account_id, debit_amount, credit_amount, memo)
         VALUES (?, ?, 1, ?, ?, ?, 0, ?),
                (?, ?, 2, ?, ?, 0, ?, ?)`,
        [
          generateId('jl'),
          journalEntryId,
          debitCoa,
          params.type === 'INCOME' ? params.account_id : params.to_account_id ?? null,
          baseAmount,
          params.title,
          generateId('jl'),
          journalEntryId,
          creditCoa,
          params.type !== 'INCOME' ? params.account_id : null,
          baseAmount,
          params.title,
        ]
      );
    }

    await db.runAsync(
      `INSERT INTO transactions (
        id, workspace_id, type, account_id, to_account_id, category_id,
        amount, currency_code, exchange_rate_to_base, base_amount,
        transaction_date, title, notes, paired_transaction_id, journal_entry_id,
        deleted_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?)`,
      [
        txId,
        params.workspace_id,
        params.type,
        params.account_id,
        params.to_account_id ?? null,
        params.category_id ?? null,
        params.amount,
        currency,
        rate,
        baseAmount,
        params.transaction_date,
        params.title,
        params.notes ?? null,
        journalEntryId,
        now,
        now,
      ]
    );

    if (params.attachment) {
      await db.runAsync(
        `INSERT INTO attachments (id, workspace_id, owner_type, owner_id, file_name, file_rel_path, mime_type, file_size_bytes, checksum_sha256, deleted_at, created_at)
         VALUES (?, ?, 'TRANSACTION', ?, ?, ?, ?, ?, ?, NULL, ?)`,
        [
          generateId('att'),
          params.workspace_id,
          txId,
          params.attachment.file_name,
          params.attachment.file_rel_path,
          params.attachment.mime_type,
          params.attachment.file_size_bytes,
          `sha256_${Date.now()}`,
          now,
        ]
      );
    }
  });

  return txId;
}

/**
 * Paired Inter-Workspace Transfer (Personal <-> Business)
 * Never counted as Business Revenue/Expense; booked against Equity (3-1002 Setoran Modal or 3-1003 Prive)
 */
export async function createInterWorkspaceTransfer(params: {
  direction: 'PERSONAL_TO_BUSINESS' | 'BUSINESS_TO_PERSONAL';
  from_account_id: string;
  to_account_id: string;
  amount: number;
  exchange_rate?: number;
  transaction_date: string;
  notes?: string;
}): Promise<{ personalTxId: string; businessTxId: string; journalEntryId: string }> {
  const db = await getDb();
  const personalTxId = generateId('tx_p_pair');
  const businessTxId = generateId('tx_b_pair');
  const journalEntryId = generateId('je_pair');
  const now = nowIsoTimestamp();
  const rate = params.exchange_rate || 1;
  const convertedAmount = params.amount * rate;

  const fromAcc = await db.getFirstAsync<AccountRecord>('SELECT * FROM accounts WHERE id = ?', [
    params.from_account_id,
  ]);
  const toAcc = await db.getFirstAsync<AccountRecord>('SELECT * FROM accounts WHERE id = ?', [
    params.to_account_id,
  ]);
  if (!fromAcc || !toAcc) throw new Error('Rekening asal atau tujuan tidak ditemukan.');

  await db.withTransactionAsync(async () => {
    // 1. Update wallet balances
    await db.runAsync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
      params.amount,
      params.from_account_id,
    ]);
    await db.runAsync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
      convertedAmount,
      params.to_account_id,
    ]);

    // 2. Create Business Double-Entry Journal (Asset vs Equity, NEVER Revenue/Expense)
    const countRow = await db.getFirstAsync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM journal_entries WHERE workspace_id = ?',
      [BUSINESS_WORKSPACE_ID]
    );
    const seq = ((countRow?.cnt ?? 0) + 1).toString().padStart(4, '0');
    const ym = params.transaction_date.slice(0, 7).replace('-', '');
    const entryNumber = `JE-${ym}-${seq}`;

    const isPersonalToBiz = params.direction === 'PERSONAL_TO_BUSINESS';
    const bizAccount = isPersonalToBiz ? toAcc : fromAcc;
    const bizAssetCoa = bizAccount.linked_coa_id || 'coa_1102';
    // 3-1002 Setoran Modal (Credit) vs 3-1003 Prive/Owner Draw (Debit)
    const debitCoa = isPersonalToBiz ? bizAssetCoa : 'coa_3103';
    const creditCoa = isPersonalToBiz ? 'coa_3102' : bizAssetCoa;
    const desc = isPersonalToBiz
      ? `Transfer Masuk dari Personal (${fromAcc.name} -> ${toAcc.name})`
      : `Transfer Keluar ke Personal (${fromAcc.name} -> ${toAcc.name})`;

    await db.runAsync(
      `INSERT INTO journal_entries (
        id, workspace_id, entry_number, entry_date, description, reference_no,
        source_type, status, total_debit, total_credit, currency_code, exchange_rate,
        reversal_of_id, reversed_by_id, posted_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, 'WS-TRANSFER', 'WORKSPACE_TRANSFER', 'POSTED', ?, ?, ?, ?, NULL, NULL, ?, NULL)`,
      [
        journalEntryId,
        BUSINESS_WORKSPACE_ID,
        entryNumber,
        params.transaction_date,
        desc,
        convertedAmount,
        convertedAmount,
        bizAccount.currency_code,
        rate,
        now,
      ]
    );

    await db.runAsync(
      `INSERT INTO journal_lines (id, journal_entry_id, line_order, coa_id, account_id, debit_amount, credit_amount, memo)
       VALUES (?, ?, 1, ?, NULL, ?, 0, ?),
              (?, ?, 2, ?, NULL, 0, ?, ?)`,
      [
        generateId('jl'),
        journalEntryId,
        debitCoa,
        convertedAmount,
        desc,
        generateId('jl'),
        journalEntryId,
        creditCoa,
        convertedAmount,
        desc,
      ]
    );

    // 3. Insert Personal & Business paired transactions
    const personalAccId = isPersonalToBiz ? params.from_account_id : params.to_account_id;
    const businessAccId = isPersonalToBiz ? params.to_account_id : params.from_account_id;

    await db.runAsync(
      `INSERT INTO transactions (
        id, workspace_id, type, account_id, to_account_id, category_id,
        amount, currency_code, exchange_rate_to_base, base_amount,
        transaction_date, title, notes, paired_transaction_id, journal_entry_id,
        deleted_at, created_at, updated_at
      ) VALUES
        (?, ?, 'WORKSPACE_TRANSFER', ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?),
        (?, ?, 'WORKSPACE_TRANSFER', ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      [
        personalTxId,
        PERSONAL_WORKSPACE_ID,
        personalAccId,
        businessAccId,
        params.amount,
        fromAcc.currency_code,
        rate,
        convertedAmount,
        params.transaction_date,
        isPersonalToBiz ? 'Transfer Keluar ke Business' : 'Terima Dana dari Business',
        params.notes ?? desc,
        businessTxId,
        now,
        now,
        businessTxId,
        BUSINESS_WORKSPACE_ID,
        businessAccId,
        personalAccId,
        convertedAmount,
        toAcc.currency_code,
        rate,
        convertedAmount,
        params.transaction_date,
        isPersonalToBiz ? 'Penerimaan Setoran dari Personal' : 'Penarikan Dana ke Personal (Prive)',
        params.notes ?? desc,
        personalTxId,
        journalEntryId,
        now,
        now,
      ]
    );
  });

  return { personalTxId, businessTxId, journalEntryId };
}

/**
 * Soft Delete Transaction (with Paired Transfer & Business Reversal consistency)
 */
export async function softDeleteTransaction(txId: string): Promise<void> {
  const db = await getDb();
  const tx = await db.getFirstAsync<TransactionRecord>(
    'SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL',
    [txId]
  );
  if (!tx) return;

  const now = nowIsoTimestamp();

  // If transaction has a posted journal in Business, reverse the journal first
  if (tx.journal_entry_id) {
    try {
      await reversePostedJournalEntry(tx.journal_entry_id, `Pembatalan Transaksi ${tx.title}`);
    } catch {
      // Ignore if already reversed
    }
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?', [now, now, tx.id]);

    // Revert balance for non-journal Personal transaction
    if (!tx.journal_entry_id) {
      if (tx.type === 'INCOME') {
        await db.runAsync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
          tx.amount,
          tx.account_id,
        ]);
      } else if (tx.type === 'EXPENSE') {
        await db.runAsync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
          tx.amount,
          tx.account_id,
        ]);
      }
    }

    // If paired inter-workspace transfer, also cancel the twin transaction
    if (tx.paired_transaction_id) {
      const twin = await db.getFirstAsync<TransactionRecord>(
        'SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL',
        [tx.paired_transaction_id]
      );
      if (twin) {
        await db.runAsync('UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?', [
          now,
          now,
          twin.id,
        ]);
      }
    }

    await db.runAsync(
      `INSERT INTO audit_logs (id, workspace_id, entity_type, entity_id, action, old_payload_json, new_payload_json, created_at)
       VALUES (?, ?, 'TRANSACTION', ?, 'SOFT_DELETE', ?, NULL, ?)`,
      [generateId('aud'), tx.workspace_id, tx.id, JSON.stringify({ title: tx.title, amount: tx.amount }), now]
    );
  });
}

export async function restoreSoftDeletedTransaction(txId: string): Promise<void> {
  const db = await getDb();
  const tx = await db.getFirstAsync<TransactionRecord>(
    'SELECT * FROM transactions WHERE id = ? AND deleted_at IS NOT NULL',
    [txId]
  );
  if (!tx) return;
  const now = nowIsoTimestamp();

  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE transactions SET deleted_at = NULL, updated_at = ? WHERE id = ?', [now, tx.id]);
    if (!tx.journal_entry_id) {
      if (tx.type === 'INCOME') {
        await db.runAsync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [
          tx.amount,
          tx.account_id,
        ]);
      } else if (tx.type === 'EXPENSE') {
        await db.runAsync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [
          tx.amount,
          tx.account_id,
        ]);
      }
    }
  });
}

export async function permanentDeleteTransaction(txId: string): Promise<void> {
  const db = await getDb();
  const tx = await db.getFirstAsync<TransactionRecord>('SELECT * FROM transactions WHERE id = ?', [txId]);
  if (!tx) return;
  if (tx.journal_entry_id) {
    throw new Error(
      'Transaksi bisnis yang sudah memiliki Jurnal POSTED tidak boleh dihapus permanen agar histori pembukuan tetap utuh. Gunakan Jurnal Pembalik.'
    );
  }
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [txId]);
}

/**
 * 6 Standard Business Accounting Reports Calculations
 */
export async function getTrialBalanceReport(): Promise<{
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}> {
  const db = await getDb();
  const rawRows = await db.getAllAsync<{
    coa_id: string;
    code: string;
    name: string;
    account_type: string;
    normal_balance: string;
    sum_debit: number;
    sum_credit: number;
  }>(
    `SELECT
       c.id as coa_id,
       c.code,
       c.name,
       c.account_type,
       c.normal_balance,
       COALESCE(SUM(CASE WHEN je.status = 'POSTED' AND je.deleted_at IS NULL THEN jl.debit_amount ELSE 0 END), 0) as sum_debit,
       COALESCE(SUM(CASE WHEN je.status = 'POSTED' AND je.deleted_at IS NULL THEN jl.credit_amount ELSE 0 END), 0) as sum_credit
     FROM chart_of_accounts c
     LEFT JOIN journal_lines jl ON jl.coa_id = c.id
     LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
     WHERE c.workspace_id = ? AND c.deleted_at IS NULL
     GROUP BY c.id
     ORDER BY c.code ASC`,
    [BUSINESS_WORKSPACE_ID]
  );

  let totalDebit = 0;
  let totalCredit = 0;

  const rows: TrialBalanceRow[] = rawRows.map((r) => {
    const diff = r.sum_debit - r.sum_credit;
    const net_debit = diff > 0 ? diff : 0;
    const net_credit = diff < 0 ? Math.abs(diff) : 0;
    totalDebit += net_debit;
    totalCredit += net_credit;
    return {
      coa_id: r.coa_id,
      code: r.code,
      name: r.name,
      account_type: r.account_type,
      normal_balance: r.normal_balance,
      total_debit: r.sum_debit,
      total_credit: r.sum_credit,
      net_debit,
      net_credit,
    };
  });

  return {
    rows,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
}

export async function getGeneralLedgerByCoa(coaId: string): Promise<LedgerEntryRow[]> {
  const db = await getDb();
  const coa = await db.getFirstAsync<CoaRecord>('SELECT * FROM chart_of_accounts WHERE id = ?', [coaId]);
  const lines = await db.getAllAsync<{
    line_id: string;
    entry_id: string;
    entry_number: string;
    entry_date: string;
    description: string;
    debit_amount: number;
    credit_amount: number;
  }>(
    `SELECT
       jl.id as line_id,
       je.id as entry_id,
       je.entry_number,
       je.entry_date,
       COALESCE(jl.memo, je.description) as description,
       jl.debit_amount,
       jl.credit_amount
     FROM journal_lines jl
     INNER JOIN journal_entries je ON je.id = jl.journal_entry_id
     WHERE jl.coa_id = ? AND je.status = 'POSTED' AND je.deleted_at IS NULL
     ORDER BY je.entry_date ASC, je.entry_number ASC, jl.line_order ASC`,
    [coaId]
  );

  let running = 0;
  const isCreditNormal = coa?.normal_balance === 'CREDIT';

  return lines.map((l) => {
    running += isCreditNormal ? l.credit_amount - l.debit_amount : l.debit_amount - l.credit_amount;
    return {
      ...l,
      running_balance: running,
    };
  });
}

export async function getFinancialStatementsSummary(): Promise<{
  revenues: TrialBalanceRow[];
  expenses: TrialBalanceRow[];
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
  assets: TrialBalanceRow[];
  liabilities: TrialBalanceRow[];
  equities: TrialBalanceRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquityWithNetIncome: number;
}> {
  const tb = await getTrialBalanceReport();
  const revenues = tb.rows.filter((r) => r.account_type === 'REVENUE' && (r.net_credit > 0 || r.net_debit > 0));
  const expenses = tb.rows.filter((r) => r.account_type === 'EXPENSE' && (r.net_debit > 0 || r.net_credit > 0));
  const totalRevenue = revenues.reduce((s, r) => s + (r.net_credit - r.net_debit), 0);
  const totalExpense = expenses.reduce((s, r) => s + (r.net_debit - r.net_credit), 0);
  const netIncome = totalRevenue - totalExpense;

  const assets = tb.rows.filter((r) => r.account_type === 'ASSET' && (r.net_debit > 0 || r.net_credit > 0));
  const liabilities = tb.rows.filter((r) => r.account_type === 'LIABILITY' && (r.net_credit > 0 || r.net_debit > 0));
  const equities = tb.rows.filter((r) => r.account_type === 'EQUITY' && (r.net_credit > 0 || r.net_debit > 0));

  const totalAssets = assets.reduce((s, r) => s + (r.net_debit - r.net_credit), 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + (r.net_credit - r.net_debit), 0);
  const baseEquity = equities.reduce((s, r) => s + (r.net_credit - r.net_debit), 0);
  const totalEquityWithNetIncome = baseEquity + netIncome;

  return {
    revenues,
    expenses,
    totalRevenue,
    totalExpense,
    netIncome,
    assets,
    liabilities,
    equities,
    totalAssets,
    totalLiabilities,
    totalEquityWithNetIncome,
  };
}

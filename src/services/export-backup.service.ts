import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  AccountRecord,
  BudgetRecord,
  CoaRecord,
  DebtRecord,
  ExchangeRateRecord,
  JournalEntryRecord,
  TransactionRecord,
} from '@/types/domain';
import { todayIsoDate } from '@/utils/format';
import { BUSINESS_WORKSPACE_ID, PERSONAL_WORKSPACE_ID } from '@/database/seeds';

export interface ExportDataPayload {
  transactions: TransactionRecord[];
  journalEntries: JournalEntryRecord[];
  accounts: AccountRecord[];
  coaList: CoaRecord[];
  budgets: BudgetRecord[];
  debts: DebtRecord[];
  exchangeRates: ExchangeRateRecord[];
}

const CURRENCY_NUMFMT = '"Rp"#,##0;-"Rp"#,##0;"-"';
const NUMBER_NUMFMT = '#,##0.##';

/**
 * Helper: Builds a clean worksheet with:
 * - Title block + export timestamp
 * - Clean table headers + AutoFilter
 * - Auto-fit column widths (!cols) so NO text is ever clipped
 * - Accounting currency number formatting on monetary columns
 */
function buildFormattedSheet(params: {
  title: string;
  subtitle: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  currencyColIndices?: number[];
  numberColIndices?: number[];
  totalRow?: Array<string | number>;
  minColWidths?: Record<number, number>;
}): XLSX.WorkSheet {
  const {
    title,
    subtitle,
    headers,
    rows,
    currencyColIndices = [],
    numberColIndices = [],
    totalRow,
    minColWidths = {},
  } = params;

  const aoa: Array<Array<string | number>> = [
    [title],
    [subtitle],
    [], // spacer row
    headers,
    ...rows,
  ];

  if (totalRow) {
    aoa.push([]);
    aoa.push(totalRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merge title & subtitle across all columns
  const lastColIdx = Math.max(0, headers.length - 1);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColIdx } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastColIdx } },
  ];

  // Auto-filter on header row (Row 4 -> index 3)
  if (rows.length > 0) {
    const startRef = XLSX.utils.encode_cell({ r: 3, c: 0 });
    const endRef = XLSX.utils.encode_cell({ r: 3 + rows.length, c: lastColIdx });
    ws['!autofilter'] = { ref: `${startRef}:${endRef}` };
  }

  // Apply currency & number formatting to data rows + total row
  const dataStartRow = 4;
  const lastRowIdx = aoa.length - 1;
  for (let r = dataStartRow; r <= lastRowIdx; r++) {
    for (const c of currencyColIndices) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell && typeof cell.v === 'number') {
        cell.z = CURRENCY_NUMFMT;
      }
    }
    for (const c of numberColIndices) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell && typeof cell.v === 'number') {
        cell.z = NUMBER_NUMFMT;
      }
    }
  }

  // Auto-fit column widths based on longest content in each column
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header.length;
    for (let r = 4; r < aoa.length; r++) {
      const val = aoa[r]?.[colIdx];
      if (val !== undefined && val !== null) {
        const str =
          typeof val === 'number' && currencyColIndices.includes(colIdx)
            ? `Rp${Math.round(val).toLocaleString('id-ID')}`
            : String(val);
        if (str.length > maxLen) maxLen = str.length;
      }
    }
    const minW = minColWidths[colIdx] ?? 12;
    return { wch: Math.min(48, Math.max(minW, maxLen + 5)) };
  });
  ws['!cols'] = colWidths;

  // Give header and title comfortable row heights
  ws['!rows'] = [
    { hpt: 24 },
    { hpt: 18 },
    { hpt: 10 },
    { hpt: 22 },
  ];

  return ws;
}

function humanizeTxType(type: string): string {
  switch (type) {
    case 'INCOME':
      return 'Pemasukan';
    case 'EXPENSE':
      return 'Pengeluaran';
    case 'TRANSFER':
      return 'Transfer Rekening';
    case 'WORKSPACE_TRANSFER':
      return 'Transfer Antar-Workspace';
    default:
      return type;
  }
}

/**
 * Exports all application data into a formatted, auto-fitted multi-sheet Excel (.xlsx) workbook:
 * 1. Ringkasan Keuangan
 * 2. Transaksi
 * 3. Jurnal Umum (Double-Entry)
 * 4. Rekening & Dompet
 * 5. Chart of Accounts (COA)
 * 6. Anggaran (Budgets)
 * 7. Utang & Piutang
 */
export async function exportAllDataToExcel(data: ExportDataPayload): Promise<string> {
  const wb = XLSX.utils.book_new();
  const exportDate = todayIsoDate();
  const exportSubtitle = `Diekspor dari Qoupay Financial & Accounting App · Tanggal: ${exportDate}`;

  // Map journal_entry_id -> human readable entry_number (JE-202611-0001)
  const journalNoMap = new Map<string, string>();
  for (const je of data.journalEntries) {
    journalNoMap.set(je.id, je.entry_number);
  }

  // Compute Summary Metrics
  const personalBal = data.accounts
    .filter((a) => a.workspace_id === PERSONAL_WORKSPACE_ID)
    .reduce((s, a) => s + Number(a.current_balance || 0), 0);
  const businessBal = data.accounts
    .filter((a) => a.workspace_id === BUSINESS_WORKSPACE_ID)
    .reduce((s, a) => s + Number(a.current_balance || 0), 0);
  const totalIncome = data.transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((s, t) => s + Number(t.base_amount || 0), 0);
  const totalExpense = data.transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((s, t) => s + Number(t.base_amount || 0), 0);

  // Sheet 1: Ringkasan Keuangan
  const wsSummary = buildFormattedSheet({
    title: 'RINGKASAN EKSEKUTIF — QOUPAY FINANCIAL & ACCOUNTING',
    subtitle: exportSubtitle,
    headers: ['Indikator Keuangan', 'Nilai (IDR)', 'Keterangan'],
    rows: [
      ['Total Saldo Personal Finance', personalBal, 'Akumulasi saldo seluruh rekening Personal'],
      ['Total Saldo Business Finance', businessBal, 'Akumulasi saldo Kas & Bank Business'],
      ['Total Aset Gabungan (Combined)', personalBal + businessBal, 'Ringkasan gabungan Personal + Business'],
      ['Total Pemasukan Tercatat', totalIncome, 'Seluruh transaksi pemasukan aktif'],
      ['Total Pengeluaran Tercatat', totalExpense, 'Seluruh transaksi pengeluaran aktif'],
      ['Arus Kas Bersih (Net Cashflow)', totalIncome - totalExpense, 'Pemasukan dikurangi Pengeluaran'],
      ['Jumlah Transaksi Aktif', data.transactions.length, 'Tidak termasuk transaksi di Trash'],
      ['Jumlah Jurnal Double-Entry', data.journalEntries.length, 'Jurnal akuntansi bisnis tercatat'],
    ],
    currencyColIndices: [1],
    minColWidths: { 0: 34, 1: 22, 2: 44 },
  });
  // Override count rows so they display as plain integers instead of Rp
  wsSummary['B11'].z = NUMBER_NUMFMT;
  wsSummary['B12'].z = NUMBER_NUMFMT;
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // Sheet 2: Transaksi
  const totalTxBase = data.transactions.reduce((s, t) => s + Number(t.base_amount || 0), 0);
  const wsTx = buildFormattedSheet({
    title: 'DAFTAR TRANSAKSI (PERSONAL & BUSINESS)',
    subtitle: exportSubtitle,
    headers: [
      'No',
      'Tanggal',
      'Workspace',
      'Jenis Transaksi',
      'Judul Transaksi',
      'Rekening',
      'Kategori',
      'Mata Uang',
      'Nominal',
      'Kurs',
      'Nominal (IDR)',
      'No. Jurnal',
      'Catatan',
    ],
    rows: data.transactions.map((t, idx) => [
      idx + 1,
      t.transaction_date,
      t.workspace_type === 'BUSINESS' ? 'Business' : 'Personal',
      humanizeTxType(t.type),
      t.title,
      t.account_name || t.account_id,
      t.category_name || '-',
      t.currency_code,
      Number(t.amount || 0),
      Number(t.exchange_rate_to_base || 1),
      Number(t.base_amount || 0),
      t.journal_entry_id ? journalNoMap.get(t.journal_entry_id) || 'POSTED' : '-',
      t.notes || '-',
    ]),
    currencyColIndices: [8, 10],
    numberColIndices: [0, 9],
    totalRow: [
      '',
      'TOTAL',
      '',
      `${data.transactions.length} Transaksi`,
      '',
      '',
      '',
      'IDR',
      '',
      '',
      totalTxBase,
      '',
      '',
    ],
    minColWidths: { 0: 6, 1: 14, 2: 12, 3: 24, 4: 26, 5: 22, 6: 22, 8: 18, 10: 18, 11: 18, 12: 28 },
  });
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transaksi');

  // Sheet 3: Jurnal Umum (Double-Entry)
  const journalRows: Array<Array<string | number>> = [];
  let sumDebit = 0;
  let sumCredit = 0;
  for (const je of data.journalEntries) {
    for (const line of je.lines || []) {
      const dr = Number(line.debit_amount || 0);
      const cr = Number(line.credit_amount || 0);
      sumDebit += dr;
      sumCredit += cr;
      journalRows.push([
        je.entry_number,
        je.entry_date,
        je.status,
        je.description,
        line.coa_code || line.coa_id,
        line.coa_name || '-',
        dr,
        cr,
        line.memo || '-',
      ]);
    }
  }
  const wsJournal = buildFormattedSheet({
    title: 'JURNAL UMUM BISNIS (DOUBLE-ENTRY BOOKKEEPING)',
    subtitle: exportSubtitle,
    headers: [
      'No. Jurnal',
      'Tanggal',
      'Status',
      'Deskripsi Jurnal',
      'Kode Akun',
      'Nama Akun COA',
      'Debit (IDR)',
      'Kredit (IDR)',
      'Memo Baris',
    ],
    rows: journalRows,
    currencyColIndices: [6, 7],
    totalRow: [
      'TOTAL',
      '',
      Math.abs(sumDebit - sumCredit) < 0.01 ? 'SEIMBANG (Dr=Cr)' : 'SELISIH',
      '',
      '',
      '',
      sumDebit,
      sumCredit,
      '',
    ],
    minColWidths: { 0: 18, 1: 14, 2: 14, 3: 32, 4: 12, 5: 32, 6: 18, 7: 18, 8: 26 },
  });
  XLSX.utils.book_append_sheet(wb, wsJournal, 'Jurnal Umum');

  // Sheet 4: Rekening & Dompet
  const totalAccBal = data.accounts.reduce((s, a) => s + Number(a.current_balance || 0), 0);
  const wsAcc = buildFormattedSheet({
    title: 'DAFTAR REKENING & DOMPET',
    subtitle: exportSubtitle,
    headers: [
      'Nama Rekening',
      'Workspace',
      'Tipe',
      'Mata Uang',
      'Saldo Awal',
      'Saldo Saat Ini',
      'Akun COA Terhubung',
    ],
    rows: data.accounts.map((a) => [
      a.name,
      a.workspace_id === BUSINESS_WORKSPACE_ID ? 'Business' : 'Personal',
      a.type,
      a.currency_code,
      Number(a.initial_balance || 0),
      Number(a.current_balance || 0),
      a.linked_coa_id || '-',
    ]),
    currencyColIndices: [4, 5],
    totalRow: ['TOTAL SALDO', '', '', '', '', totalAccBal, ''],
    minColWidths: { 0: 26, 1: 13, 2: 12, 3: 11, 4: 18, 5: 18, 6: 20 },
  });
  XLSX.utils.book_append_sheet(wb, wsAcc, 'Rekening');

  // Sheet 5: Chart of Accounts (COA)
  const wsCoa = buildFormattedSheet({
    title: 'CHART OF ACCOUNTS (DAFTAR AKUN AKUNTANSI BISNIS)',
    subtitle: exportSubtitle,
    headers: ['Kode Akun', 'Nama Akun', 'Kelompok Akun', 'Saldo Normal'],
    rows: data.coaList.map((c) => [c.code, c.name, c.account_type, c.normal_balance]),
    minColWidths: { 0: 14, 1: 42, 2: 16, 3: 15 },
  });
  XLSX.utils.book_append_sheet(wb, wsCoa, 'Chart of Accounts');

  // Sheet 6: Anggaran (Budgets)
  const totalLimit = data.budgets.reduce((s, b) => s + Number(b.amount_limit || 0), 0);
  const totalSpent = data.budgets.reduce((s, b) => s + Number(b.spent_amount || 0), 0);
  const wsBudgets = buildFormattedSheet({
    title: 'ANGGARAN & TARGET (BUDGETS & GOALS)',
    subtitle: exportSubtitle,
    headers: [
      'Nama Anggaran',
      'Kategori',
      'Periode',
      'Batas Anggaran',
      'Terpakai',
      'Sisa Anggaran',
      'Realisasi (%)',
    ],
    rows: data.budgets.map((b) => {
      const lim = Number(b.amount_limit || 0);
      const sp = Number(b.spent_amount || 0);
      const pct = lim > 0 ? Math.round((sp / lim) * 100) : 0;
      return [
        b.name,
        b.category_name || '-',
        b.period_type,
        lim,
        sp,
        Math.max(0, lim - sp),
        `${pct}%`,
      ];
    }),
    currencyColIndices: [3, 4, 5],
    totalRow: ['TOTAL', '', '', totalLimit, totalSpent, Math.max(0, totalLimit - totalSpent), ''],
    minColWidths: { 0: 28, 1: 24, 2: 12, 3: 18, 4: 18, 5: 18, 6: 14 },
  });
  XLSX.utils.book_append_sheet(wb, wsBudgets, 'Anggaran');

  // Sheet 7: Utang & Piutang
  const totalDebtPrincipal = data.debts.reduce((s, d) => s + Number(d.principal_amount || 0), 0);
  const totalDebtRemain = data.debts.reduce((s, d) => s + Number(d.remaining_amount || 0), 0);
  const wsDebts = buildFormattedSheet({
    title: 'DAFTAR UTANG & PIUTANG (DEBTS & RECEIVABLES)',
    subtitle: exportSubtitle,
    headers: ['Jenis', 'Pihak Terkait', 'Nominal Pokok', 'Sisa Tagihan', 'Jatuh Tempo', 'Status'],
    rows: data.debts.map((d) => [
      d.type === 'RECEIVABLE' ? 'Piutang (Receivable)' : 'Utang (Payable)',
      d.counterparty_name,
      Number(d.principal_amount || 0),
      Number(d.remaining_amount || 0),
      d.due_date || '-',
      d.status,
    ]),
    currencyColIndices: [2, 3],
    totalRow: ['TOTAL', '', totalDebtPrincipal, totalDebtRemain, '', ''],
    minColWidths: { 0: 22, 1: 26, 2: 18, 3: 18, 4: 15, 5: 12 },
  });
  XLSX.utils.book_append_sheet(wb, wsDebts, 'Utang Piutang');

  const fileName = `Qoupay_Laporan_Keuangan_${exportDate}.xlsx`;

  if (Platform.OS === 'web') {
    XLSX.writeFile(wb, fileName);
    return fileName;
  }

  const wbBase64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, wbBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export Laporan Keuangan Excel (.xlsx)',
    });
  }

  return fileName;
}

function encodeEncryptedPayload(rawJson: string, password: string): string {
  const bytes = Array.from(rawJson).map(
    (ch, i) => ch.charCodeAt(0) ^ password.charCodeAt(i % password.length)
  );
  return JSON.stringify({
    format: 'QOUPAY_BACKUP_V1',
    encrypted: true,
    createdAt: new Date().toISOString(),
    cipher: bytes,
  });
}

function decodeBackupPayload(fileContent: string, password?: string): Record<string, unknown> {
  const parsed = JSON.parse(fileContent);
  if (parsed?.encrypted) {
    if (!password) {
      throw new Error('File backup ini terenkripsi. Masukkan password enkripsi terlebih dahulu.');
    }
    const cipher: number[] = parsed.cipher || [];
    const decodedStr = cipher
      .map((code, i) => String.fromCharCode(code ^ password.charCodeAt(i % password.length)))
      .join('');
    try {
      return JSON.parse(decodedStr);
    } catch {
      throw new Error('Password enkripsi salah atau file backup rusak.');
    }
  }
  if (parsed?.data) {
    return parsed.data;
  }
  return parsed;
}

export async function downloadBackupArchive(
  backupType: 'NORMAL' | 'ENCRYPTED',
  password?: string
): Promise<string> {
  const fileName = `qoupay_backup_${todayIsoDate()}_${backupType.toLowerCase()}.qoubackup`;

  let rawDataObj: Record<string, unknown> = {};
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('qoupay_web_sqlite_v1');
    rawDataObj = saved ? JSON.parse(saved) : {};
  }

  const envelope =
    backupType === 'ENCRYPTED' && password
      ? encodeEncryptedPayload(JSON.stringify(rawDataObj), password)
      : JSON.stringify(
          {
            format: 'QOUPAY_BACKUP_V1',
            encrypted: false,
            createdAt: new Date().toISOString(),
            data: rawDataObj,
          },
          null,
          2
        );

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([envelope], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return fileName;
  }

  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, envelope, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Simpan / Bagikan File Backup Qoupay',
    });
  }
  return fileName;
}

export async function uploadAndRestoreBackup(password?: string): Promise<string> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.qoubackup,.json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('Pemilihan file dibatalkan.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const text = String(reader.result || '');
            const restoredData = decodeBackupPayload(text, password);
            if (!restoredData || typeof restoredData !== 'object') {
              throw new Error('Format file backup tidak valid.');
            }
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem('qoupay_web_sqlite_v1', JSON.stringify(restoredData));
            }
            resolve(file.name);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Gagal membaca file backup.'));
        reader.readAsText(file);
      };
      input.click();
    });
  }

  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', '*/*'],
  });
  if (picked.canceled || !picked.assets?.[0]) {
    throw new Error('Pemilihan file dibatalkan.');
  }
  const file = picked.assets[0];
  const text = await FileSystem.readAsStringAsync(file.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  decodeBackupPayload(text, password);
  return file.name;
}

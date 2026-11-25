# Product Requirements Document (PRD) v1.0 — Financial Management & Accounting App

> [!IMPORTANT]
> **Status Dokumen:** **FINAL PRD v1.0 (Seluruh 7 Tahap Concept Review Telah Disepakati)**
> Dokumen ini merupakan spesifikasi induk (*Single Source of Truth*) yang menyatukan seluruh keputusan produk, fitur, aturan akuntansi double-entry, UI/UX **Modern Colorful**, arsitektur **Hybrid Navigation**, skema **17 Tabel SQLite**, serta **8 Fase Pengembangan** sebelum tahap penulisan kode dimulai.

---

## 1. Ringkasan Eksekutif & Visi Produk

**Financial Management & Accounting App** adalah aplikasi mobile *local-first* dan *offline-ready* yang menggabungkan kemudahan **Pencatatan Keuangan Pribadi (Personal Finance)** dengan ketelitian **Pembukuan Akuntansi Bisnis Berbasis Double-Entry (Business Accounting)** dalam satu aplikasi bagi pengguna tunggal (*Single-User*).

### Prinsip Utama Produk:
1. **100% Local-First & Offline-Ready:** Seluruh data transaksi, laporan keuangan, dan file bukti transaksi tersimpan lokal di perangkat menggunakan **Expo SQLite** dan sistem file lokal tanpa ketergantungan pada server backend.
2. **Dual-Engine dalam Satu Aplikasi:**
   - **Personal Workspace:** Pencatatan pemasukan, pengeluaran, anggaran, dan utang/piutang yang cepat dan sederhana tanpa membebani pengguna dengan istilah debit/kredit.
   - **Business Workspace:** Pembukuan akuntansi **Double-Entry** (*Debit = Kredit*) dengan dukungan *Mode Transaksi Cepat (Auto-Journal)* maupun *Mode Input Jurnal Manual*, lengkap dengan 6 laporan akuntansi standar.
   - **Combined Dashboard:** Ringkasan kekayaan bersih gabungan (*Personal + Business*) yang bersifat *read-only* dengan konversi mata uang otomatis ke mata uang utama.
3. **Integritas Data & Auditability:** Mendukung transaksi database ACID, *immutable posted journals* (koreksi wajib melalui jurnal pembalik/penyesuaian), transaksi berpasangan untuk transfer antar-workspace, serta *Soft Delete (Trash)* dan *Permanent Delete* berproteksi relasi.

---

## 2. Spesifikasi Teknologi (Tech Stack Final)

| Komponen | Keputusan Teknologi | Keterangan Teknis |
| :--- | :--- | :--- |
| **Framework** | Expo + React Native | Managed workflow, siap untuk Android & iOS |
| **Language** | TypeScript (Strict Mode) | Type-safety penuh dari database hingga UI |
| **Platform** | Android, iOS-ready | Mobile-first dengan optimasi perangkat spesifikasi rendah-menengah |
| **Navigation** | Expo Router | **Hybrid Navigation**: 5-Tab Bottom Navigation + Sidebar Drawer |
| **Database** | Expo SQLite | `PRAGMA journal_mode = WAL`, `foreign_keys = ON`, transaksi ACID |
| **Backend** | Tidak diperlukan | 100% Local-first |
| **State Management** | Zustand | State global ringan (Workspace aktif, Auth lock, Tema, Bahasa) |
| **Form & Validation** | React Hook Form + Zod | Validasi form dan aturan keseimbangan jurnal (`Debit == Kredit`) |
| **UI Styling** | React Native StyleSheet | Performa tinggi, tema Light & Dark Mode terpusat |
| **Icons** | Lucide React Native | Ikon konsisten di dalam *tinted squircle* |
| **Charts** | React Native SVG | Donut chart, Bar chart, dan Circular progress ring kustom |
| **Security** | PIN + Biometrics | `expo-local-authentication` + hash PIN lokal |
| **Build System** | EAS Build | Konfigurasi build untuk APK / AAB (Android) dan iOS |

---

## 3. Ruang Lingkup Modul & Spesifikasi Fitur (16 Core Modules)

### 3.1. Onboarding & Security
- **Onboarding Wajib (4 Langkah):**
  1. Pengenalan konsep *Personal Finance + Business Accounting*.
  2. Pemilihan Bahasa (`Indonesia` / `English`) dan Mata Uang Utama (*Base Currency*, mis. `IDR`).
  3. Penyiapan Workspace awal (`Personal`, `Business`, atau keduanya) beserta dompet/rekening pertama dan *auto-seeding* **Template COA UMKM Bilingual (ID/EN)**.
  4. Pembuatan 6-digit PIN keamanan dan aktivasi Biometrik (Fingerprint / Face Unlock).
- **App Lock Guard:** Mengunci aplikasi saat dibuka atau setelah kembali dari *background* sesuai pengaturan timeout keamanan.

### 3.2. Workspace Management & Combined Dashboard
- **Workspace Terpisah:** Data transaksi, rekening, kategori, anggaran, dan laporan dipisahkan secara ketat antara `Personal` dan `Business`.
- **Workspace Switcher Pill:** Terletak di Top Header Dashboard untuk berpindah instan antara:
  1. `Personal Finance`
  2. `Business Finance`
  3. `Combined Overview`
- **Aturan Combined Dashboard:**
  - Hanya menampilkan ringkasan eksekutif (Total Aset Gabungan, Breakdown Personal vs Business, dan Tren Kekayaan).
  - Seluruh saldo rekening dengan mata uang berbeda dikonversi terlebih dahulu ke *Base Currency* menggunakan kurs yang tersimpan (`exchange_rates`), bukan dijumlahkan mentah.

### 3.3. Accounts & Wallets (Rekening & Dompet)
- Mendukung tipe: `Kas Tunai (Cash)`, `Bank`, `E-Wallet`, `Kartu Kredit`, dan `Investasi`.
- Setiap rekening memiliki mata uangnya sendiri (`currency_code`).
- Di **Business Workspace**, setiap rekening wajib terhubung ke satu akun Aset di *Chart of Accounts* (`linked_coa_id`).

### 3.4. Category Management & Chart of Accounts (COA)
- **Personal:** Kategori Pemasukan & Pengeluaran dengan ikon dan warna kustom.
- **Business (COA):**
  - Pengelompokan 5 tipe akun utama: `1-ASSET (Aset)`, `2-LIABILITY (Liabilitas)`, `3-EQUITY (Ekuitas)`, `4-REVENUE (Pendapatan)`, `5-EXPENSE (Beban)`.
  - Setiap kategori transaksi bisnis dipetakan ke `linked_coa_id` agar *Mode Transaksi Cepat* dapat membuat jurnal double-entry secara otomatis.

### 3.5. Transaction Management (Personal & Business)
- **Personal Input:** Pilih `Pengeluaran`, `Pemasukan`, atau `Transfer` → Nominal → Kategori → Rekening → Tanggal → Catatan → Lampiran Bukti → Simpan.
- **Business Input (2 Mode):**
  1. **Mode Transaksi Cepat (Smart Assisted Double-Entry):** Pengguna memilih jenis transaksi rutin (mis. Penjualan Tunai, Pengeluaran Operasional, Transfer Kas/Bank); sistem otomatis menyusun pasangan Debit & Kredit di balik layar dengan fitur **Preview Jurnal** sebelum diposting.
  2. **Mode Jurnal Manual:** Pengguna menginput langsung baris-baris akun Debit dan Kredit beserta memo per baris.

### 3.6. Double-Entry Accounting Engine & 6 Laporan Bisnis
- **Aturan Wajib Double-Entry:**
  - Setiap jurnal wajib memiliki **minimal 2 baris** (`journal_lines`).
  - Total Debit wajib sama dengan Total Kredit ($\sum \text{Debit} = \sum \text{Kredit}$).
  - Jurnal memiliki status `DRAFT`, `POSTED`, atau `VOIDED`.
  - Jurnal yang sudah `POSTED` bersifat **immutable** (tidak dapat diedit atau dihapus permanen). Koreksi wajib dilakukan melalui fitur **Buat Jurnal Pembalik (Reverse Entry)** atau **Jurnal Penyesuaian**.
  - Transfer antar-rekening dicatat sebagai perpindahan aset (`Aset Kas/Bank Tujuan [Dr]` pada `Aset Kas/Bank Asal [Cr]`), bukan pendapatan atau biaya.
- **6 Laporan Akuntansi Bisnis (Dihitung dari Jurnal `POSTED`):**
  1. **Jurnal Umum (General Journal)**
  2. **Buku Besar (General Ledger)** lengkap dengan *Running Balance* per akun COA
  3. **Neraca Saldo (Trial Balance)**
  4. **Laba Rugi (Profit & Loss Statement)**
  5. **Neraca (Balance Sheet)** ($\text{Aset} = \text{Liabilitas} + \text{Ekuitas}$)
  6. **Arus Kas (Cash Flow Statement)**

### 3.7. Transfer Antar-Workspace (Paired Transactions)
- Ketika mengirim dana dari `Personal → Business` (atau sebaliknya):
  - Sistem membuat **dua transaksi yang saling terhubung** melalui `paired_transaction_id` dalam satu transaksi database ACID.
  - **Sisi Personal:** Tercatat sebagai *Transfer Keluar ke Bisnis* (atau *Penerimaan dari Bisnis*).
  - **Sisi Business:** Otomatis memposting jurnal antara akun **Kas/Bank Bisnis** dan akun Ekuitas (**Setoran Modal Pemilik / Owner's Contribution** atau **Prive / Owner's Draw**), sehingga **tidak pernah dihitung sebagai pendapatan atau biaya operasional bisnis**.
  - Jika kedua rekening menggunakan mata uang berbeda, kurs transfer (`exchange_rate`) wajib disimpan.
  - **Pembatalan Konsisten:** Membatalkan salah satu sisi transfer otomatis membatalkan sisi pasangannya dan membuat jurnal pembalik di Business Workspace.

### 3.8. Multi-Currency & Exchange Rates
- Mendukung banyak mata uang (`IDR`, `USD`, `SGD`, `EUR`, `MYR`, dll.).
- Pembaruan kurs mendukung **Mode Manual** (input kurs sendiri) dan **Mode Otomatis** (ketika perangkat terhubung ke internet, lalu menyimpannya secara lokal di tabel `exchange_rates` untuk pemakaian offline).

### 3.9. Budget Management & Debt/Receivables
- **Budget & Goals:** Mengatur anggaran bulanan/tahunan per kategori dengan indikator *Circular Progress Ring* dan peringatan ketika mendekati atau melewati batas anggaran.
- **Debt & Receivables:** Mencatat Utang (*Payables*) dan Piutang (*Receivables*), tanggal jatuh tempo, serta riwayat pembayaran cicilan/pelunasan (`debt_payments`) yang terhubung langsung ke saldo rekening dan jurnal.

### 3.10. Attachments Management (Bukti Transaksi)
- Mendukung format **JPG/JPEG, PNG, PDF, dan dokumen perangkat lainnya**.
- Sumber input: Ambil foto langsung dari kamera atau pilih file dari memori perangkat.
- Fitur: Preview gambar/dokumen di dalam aplikasi, hapus lampiran, dan sertakan seluruh file lampiran di dalam bundel backup.

### 3.11. Trash & Recovery (Soft Delete & Permanent Delete)
- **Soft Delete:** Data yang dihapus masuk ke **Trash** (`deleted_at` terisi), tidak tampil di laporan, dan dapat dipulihkan (*Restore*) kapan saja.
- **Permanent Delete:** Menghapus data secara permanen dengan dialog konfirmasi.
- **Proteksi Integritas:**
  - Data master (Rekening, Kategori, COA) yang masih memiliki transaksi/jurnal terkait tidak boleh dihapus permanen.
  - Jurnal bisnis berstatus `POSTED` tidak boleh dihapus (baik soft maupun permanent delete); sistem mengarahkan pengguna ke tombol **Buat Jurnal Pembalik**.

### 3.12. Backup & Restore (Normal + Terenkripsi)
- Mengemas snapshot database SQLite (`VACUUM INTO`) beserta folder `attachments/` dan `manifest.json` (lengkap dengan checksum SHA-256) ke dalam satu file arsip backup.
- Mendukung **Backup Normal** dan **Backup Terenkripsi (AES-256-GCM dengan Password)**.

---

## 4. Spesifikasi UI/UX & Design System

- **Arah Visual:** **D. Modern Colorful** — Bersih, segar, dan profesional dengan kombinasi warna utama **Ungu (`#7C3AED`)** dan **Biru (`#2563EB`)**, permukaan kartu putih/charcoal bersih, serta aksen warna ekspresif pada grafik dan kategori.
- **Arsitektur Navigasi:** **C. Hybrid Navigation**
  - **Bottom Navigation (5 Menu):** `Home`, `Activity`, `+ (Floating Purple Add Button)`, `Reports`, `Settings`.
  - **Sidebar / Drawer:** Menyediakan akses terstruktur ke *Accounts & Wallets*, *Categories*, *Budget*, *Debt*, serta seluruh menu *Business Accounting* (*Chart of Accounts, General Journal, General Ledger, Trial Balance, Profit & Loss, Balance Sheet, Cash Flow*), *Multi-Currency*, *Trash*, dan *Backup*.
- **Tipografi & Komponen:** Font **Inter** dengan `tabular-nums` untuk seluruh nominal uang, `border-radius: 12px–28px`, spacing `4/8px`, ikon **Lucide**, dan dukungan penuh **Light Mode & Dark Mode**.

*(Referensi detail UI/UX tersimpan di [ui_ux_design_system_plan.md](file:///C:/Users/fr/.gemini/antigravity/brain/2ab1de6b-add3-454b-9549-0dacdfcb66aa/ui_ux_design_system_plan.md))*

---

## 5. Arsitektur Database (17 Tabel Expo SQLite)

Database terdiri dari **17 tabel inti** yang saling berelasi dengan `FOREIGN KEY` aktif dan transaksi ACID:
1. `profiles` — Profil lokal, PIN hash, status biometrik & onboarding.
2. `workspaces` — Konfigurasi workspace `PERSONAL` dan `BUSINESS`.
3. `currencies` — Daftar mata uang dan konfigurasi desimal.
4. `exchange_rates` — Riwayat kurs manual & otomatis.
5. `chart_of_accounts` — Daftar akun akuntansi bisnis (COA) + seeder default UMKM ID/EN.
6. `accounts` — Rekening/dompet pengguna (terhubung ke COA di Business).
7. `categories` — Kategori pemasukan/pengeluaran (terhubung ke COA di Business).
8. `transactions` — Transaksi harian & `paired_transaction_id` untuk transfer antar-workspace.
9. `journal_entries` — Header jurnal double-entry (`DRAFT`, `POSTED`, `VOIDED`, `reversal_of_id`).
10. `journal_lines` — Baris debit & kredit (minimal 2 baris per jurnal, $\sum \text{Debit} = \sum \text{Kredit}$).
11. `budgets` — Target anggaran per kategori & periode.
12. `debts` — Data pokok utang dan piutang.
13. `debt_payments` — Riwayat pembayaran/cicilan utang dan piutang.
14. `attachments` — Metadata file bukti transaksi lokal (Foto/PDF) + SHA-256 checksum.
15. `audit_logs` — Jejak audit pembuatan, pembalikan jurnal, soft delete, restore, dan permanent delete.
16. `settings` — Preferensi tema, bahasa, dan kurs.
17. `backups` — Metadata riwayat backup normal & terenkripsi.

*(Referensi detail skema database tersimpan di [database_and_accounting_engine_plan.md](file:///C:/Users/fr/.gemini/antigravity/brain/2ab1de6b-add3-454b-9549-0dacdfcb66aa/database_and_accounting_engine_plan.md))*

---

## 6. Rencana Eksekusi Pengembangan (8 Fase Implementasi)

1. **Fase 1 — Foundation & Design System:** Inisialisasi proyek Expo + TypeScript, tema *Modern Colorful* (Light/Dark), i18n (`ID/EN`), dan kerangka *Hybrid Navigation (Bottom Tabs + Drawer)*.
2. **Fase 2 — SQLite Database & Seeding:** Koneksi SQLite (`WAL`), *migration runner* 17 tabel, dan *seeder* mata uang, kategori, serta *Default COA UMKM (ID/EN)*.
3. **Fase 3 — Onboarding, Security & Workspace:** 4 langkah Onboarding wajib, layar kunci PIN + Biometrik, dan *Workspace Switcher Pill*.
4. **Fase 4 — Master Data & Multi-Currency:** Modul Rekening/Dompet, Kategori, Chart of Accounts (COA), dan manajemen Multi-Currency & Kurs.
5. **Fase 5 — Core Transactions & Double-Entry Engine:** Input transaksi Personal, Business Auto-Journal, Form Jurnal Manual Debit/Kredit (*Sticky Balance Bar* & *Jurnal Pembalik*), serta Transfer Antar-Workspace berpasangan.
6. **Fase 6 — Dashboards, SVG Charts & 6 Laporan Akuntansi:** Dashboard Personal, Business, & Combined, grafik Donut/Bar SVG, dan 6 Laporan Akuntansi Bisnis.
7. **Fase 7 — Budget, Debt & Attachments:** Modul Anggaran (*Circular Progress Ring*), Utang/Piutang beserta cicilan, dan Lampiran Bukti Transaksi (Kamera/Galeri/PDF).
8. **Fase 8 — Trash, Encrypted Backup & Release Polish:** Modul Trash & Recovery, Backup & Restore (Normal + AES-256), pengujian integritas akuntansi, dan konfigurasi EAS Build.

*(Referensi detail arsitektur kode tersimpan di [development_and_architecture_plan.md](file:///C:/Users/fr/.gemini/antigravity/brain/2ab1de6b-add3-454b-9549-0dacdfcb66aa/development_and_architecture_plan.md))*

---

## 7. Persetujuan Akhir PRD (Ready for Development)

Seluruh dokumen perencanaan Pre-PRD dan **Final PRD v1.0** kini telah lengkap.
- Silakan tinjau **PRD v1.0** ini. Begitu Anda menyetujui dokumen ini (atau memberi instruksi **"Mulai Fase 1"**), kita siap memulai tahap implementasi kode dari **Fase 1: Project Setup, Design System "Modern Colorful", & Hybrid Navigation**.

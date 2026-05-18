# Product Requirements Document (PRD)
# Sistem Monitoring Pengadaan Barang/Jasa

**Versi:** 1.0.0
**Tanggal:** 2025-01-27
**Status:** Draft

---

## 1. Ringkasan Eksekutif

Sistem web-based untuk memonitoring proses pengadaan barang/jasa secara real-time. Platform ini mengambil URL pengadaan dari LPSE/website pemerintah, melakukan screenshot otomatis setiap tahapan SOP 16 langkah, mengekstrak link produk (e-katalog/LPSE), dan mengirimkan notifikasi progres ke Telegram.

### Tujuan Produk

- Mempermudah tim pengadaan memonitoring banyak paket pengadaan sekaligus
- Menyediakan bukti visual (screenshot) setiap tahapan SOP
- Mengotomasi deteksi perubahan status pada halaman pengadaan
- Memberikan notifikasi proaktif via Telegram saat ada perubahan

---

## 2. Problem Statement

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | Monitoring manual banyak paket pengadaan memakan waktu | Inefisiensi SDM, risiko错过 deadline |
| 2 | Tidak ada bukti visual per tahapan SOP | Sulit audit, tidak ada trail |
| 3 | Perubahan status tidak terdeteksi cepat | Respons lambat terhadap tenderbaru/hasil evaluasi |
| 4 | Komunikasi progres via WhatsApp manual | Tidak terstruktur, mudah terlewat |

---

## 3. Target User

| User | Peran | Kebutuhan |
|------|-------|-----------|
| Admin Pengadaan | Operator utama | Input URL, trigger scraping, lihat dashboard |
| Kepala Divisi | Supervisor | Monitoring overview, terima notifikasi |
| Auditor | Reviewer | Akses log dan screenshot untuk audit |

---

## 4. Fitur Utama

### 4.1 Manajemen Paket Pengadaan

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Input URL Paket | Tambah paket pengadaan baru dengan URL LPSE | P0 |
| Edit Paket | Ubah detail paket (nama, URL, kategori) | P0 |
| Hapus Paket | Hapus paket dari monitoring | P1 |
| Kategori Paket | Klasifikasi paket per kategori pengadaan | P1 |
| Status Tracking | Lacak status terkini setiap paket | P0 |

### 4.2 SOP 16 Tahapan Monitoring

SOP pengadaan barang/jasa terdiri dari 16 tahapan:

| # | Tahapan | Deskripsi |
|---|---------|-----------|
| 1 | Penyusunan Rencana Umum Pengadaan | RUP disusun oleh PA/KPA |
| 2 | Penyusunan Rencana Implementasi Pengadaan | RIP detail teknis |
| 3 | Penetapan Metode dan Rancangan Dokumen Pengadaan | Pilih metode seleksi |
| 4 | Penyiapan Dokumen Pengadaan | Draft dokumen tender |
| 5 | Pengadaan Tanpa Tender / Tender | Pelaksanaan proses |
| 6 | Penjelasan Dokumen Pengadaan | Rapat penjelasan / aanwijzing |
| 7 | Pemasukan Dokumen Penawaran | Submit penawaran |
| 8 | Evaluasi Dokumen Penawaran | Evaluasi kualitas & harga |
| 9 | Negosiasi dan Penetapan Pemenang | Negosiasi harga |
| 10 | Penetapan Pemenang | SPP / SPT (Surat Penetapan) |
| 11 | Penandatanganan Kontrak | Kontrak kerja |
| 12 | Pelaksanaan Pekerjaan | Eksekusi pekerjaan |
| 13 | Serah Terima Pekerjaan | Pemeriksaan & penerimaan |
| 14 | Pembayaran | Proses pembayaran |
| 15 | Pemeliharaan | Masa pemeliharaan |
| 16 | Penyelesaian Akhir | Serah terima final |

Setiap tahapan memiliki:
- Status: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`
- Screenshot bukti
- Timestamp catatan
- Catatan/notes opsional

### 4.3 Scraping Otomatis

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Scraping URL | Ambil konten halaman pengadaan | P0 |
| Screenshot Otomatis | Screenshot per tahapan | P0 |
| Ekstrak Link Produk | Deteksi link e-katalog/LPSE | P0 |
| Batch Scraping | Scraping banyak paket sekaligus | P1 |
| Jadwal Scraping | Cron job periodic check | P1 |
| Retry Mechanism | Auto-retry saat scraping gagal | P1 |

### 4.4 Dashboard Monitoring

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Overview Stats | Total paket, aktif, selesai, bermasalah | P0 |
| Tabel Monitoring | Daftar paket dengan status per tahapan | P0 |
| Progress Bar | Visualisasi progres 16 tahapan | P0 |
| Filter & Search | Cari paket berdasarkan nama/status | P1 |
| Detail View | Lihat detail + screenshot per paket | P0 |
| Log Aktivitas | Riwayat semua aktivitas scraping | P1 |

### 4.5 Notifikasi Telegram

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Perubahan Status | Notif saat status tahapan berubah | P0 |
| Ringkasan Harian | Summary paket yang perlu perhatian | P1 |
| Error Alert | Notif saat scraping gagal | P0 |
| Custom Command | Bot command untuk info cepat | P2 |

---

## 5. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                           │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Frontend │  │ Backend  │  │ Scraper  │  │   n8n    │   │
│  │  React   │  │ Golang   │  │Node.js + │  │Workflow  │   │
│  │ + Vite   │  │ + Gin    │  │Playwright│  │Automation│   │
│  │ :5173    │  │ :8080    │  │ :3001    │  │ :5678    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │              │          │
│       └─────────────┼─────────────┼──────────────┘          │
│                     │             │                          │
│              ┌──────┴─────────────┴──────┐                  │
│              │     PostgreSQL (DB)       │                  │
│              │        :5432              │                  │
│              └───────────────────────────┘                  │
│                                                              │
│                     ┌──────────────┐                         │
│                     │   Telegram   │                         │
│                     │   Bot API    │                         │
│                     └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Frontend | React + Vite + Tailwind CSS | React 18, Vite 5 |
| Backend | Golang + Gin | Go 1.21+ |
| Scraper | Node.js + Playwright | Node 20 LTS |
| Workflow | n8n | Latest |
| Database | PostgreSQL | 15+ |
| Container | Docker + Docker Compose | Latest |
| Notifikasi | Telegram Bot API | v3 |

### Data Flow

```
1. User input URL → Frontend → Backend API → PostgreSQL
2. Backend trigger → Scraper Service → Playwright
   ├── Screenshot → Uploads (/uploads)
   ├── Extract Links → Backend API
   └── Update Status → PostgreSQL
3. Status Change → n8n Webhook → Telegram Bot → User
4. Cron Schedule → n8n → Backend API → Trigger Scraper
```

---

## 6. API Endpoints

### 6.1 Authentication

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/auth/me` | Get current user |

### 6.2 Paket Pengadaan

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/paket` | List semua paket (pagination) |
| POST | `/api/v1/paket` | Tambah paket baru |
| GET | `/api/v1/paket/:id` | Detail paket |
| PUT | `/api/v1/paket/:id` | Update paket |
| DELETE | `/api/v1/paket/:id` | Hapus paket |
| GET | `/api/v1/paket/:id/tahapan` | List tahapan paket |
| PUT | `/api/v1/paket/:id/tahapan/:no` | Update status tahapan |

### 6.3 Scraping

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/scraping/trigger/:paketId` | Trigger scraping |
| GET | `/api/v1/scraping/jobs` | List scraping jobs |
| GET | `/api/v1/scraping/jobs/:id` | Detail job |
| POST | `/api/v1/scraping/batch` | Trigger batch scraping |

### 6.4 Notifikasi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/notifikasi` | List notifikasi |
| POST | `/api/v1/notifikasi/test` | Kirim test notifikasi |
| PUT | `/api/v1/notifikasi/:id/read` | Tandai sudah dibaca |

### 6.5 Dashboard

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/dashboard/stats` | Statistik overview |
| GET | `/api/v1/dashboard/activity` | Log aktivitas terbaru |

---

## 7. Database Schema

> Lihat file terpisah: `docs/database-schema.sql`

---

## 8. Workflow n8n

> Lihat file terpisah: `docs/workflow-n8n.md`

---

## 9. Non-Functional Requirements

| Aspek | Requirement |
|-------|-------------|
| Performance | Dashboard load < 3 detik |
| Scalability | Mendukung 100+ paket pengadaan |
| Availability | 99% uptime (docker restart policy) |
| Security | JWT auth, HTTPS, input validation |
| Backup | Database backup harian otomatis |
| Logging | Structured logging ke stdout + file |

---

## 10. Milestone

| Fase | Fitur | Timeline |
|------|-------|----------|
| MVP | Login, Dashboard, Input Paket, Manual Scraping | Week 1-2 |
| v1.0 | SOP 16 Tahapan, Auto Scraping, Screenshot | Week 3-4 |
| v1.5 | n8n Integration, Telegram Notif, Batch Scraping | Week 5-6 |
| v2.0 | Scheduling, Report, Multi-user Roles | Week 7-8 |

---

## 11. Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LPSE berubah struktur HTML | High | High | Scraper modular, mudah diupdate selector |
| Rate limiting LPSE | Medium | Medium | Delay antar request, rotating user agent |
| Playwright resource heavy | Medium | Medium | Container dengan memory limit, cleanup |
| Data loss | Low | High | PostgreSQL backup otomatis |

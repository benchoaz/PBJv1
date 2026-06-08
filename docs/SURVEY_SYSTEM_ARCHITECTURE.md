# Arsitektur Sistem Asisten Survei HPS & Auto-Pembanding e-Katalog LKPP

Dokumen ini menjelaskan secara rinci struktur, alur kerja, integrasi AI, serta rencana pengembangan sistem survei otomatis pada aplikasi e-Procurement PBJ (Pengadaan Barang/Jasa) Kabupaten Probolinggo. Dokumen ini ditujukan sebagai referensi teknis agar dapat dianalisis dengan mudah oleh AI IDE lain.

---

## 1. Ikhtisar Sistem (System Overview)
Fitur **Asisten Survei HPS** adalah modul otomasi pencarian harga pasar riil dari platform **e-Katalog LKPP** untuk membantu Pejabat Pembuat Komitmen (PPK) dan Pejabat Pengadaan (PP) menyusun Harga Perkiraan Sendiri (HPS) dan Dokumen Persiapan Pengadaan (DPP).

Sistem ini dirancang untuk:
* Mencari harga barang dari penyedia target secara otomatis.
* Mengambil screenshot halaman pencarian dan detail produk secara otomatis sebagai bukti riil audit.
* Mencari produk pembanding dari kompetitor lain di wilayah setempat secara cerdas (Auto-Pembanding).
* Mengelompokkan zona logistik pengiriman berdasarkan kedekatan wilayah Satuan Kerja (Satker) dengan lokasi penyedia.

---

## 2. Arsitektur Komponen & Teknologi

Alur data survei terdistribusi ke dalam 3 layer utama:

```
[ FRONTEND ] (React UI)
    │  (POST /api/survey/run dengan Payload & Gemini Key)
    ▼
[ BACKEND API ] (Go Server)
    │  (Menyalurkan request & mendistribusikan ke Redis Queue)
    ▼
[ SURVEY SERVICE ] (Node.js + Puppeteer + Redis BullMQ)
       ├── Menjalankan Scraping LKPP Live via Chromium Headless
       ├── Mengakses Gemini API (gemini-1.5-flash) untuk Normalisasi Kata Kunci
       └── Menyimpan screenshot bukti fisik ke shared volume
```

### A. Frontend: React UI
* **File Kunci**: `frontend/src/components/ppk/Step3RincianHPS.jsx`
* **Peran**:
  * Mengelola state toleransi harga, filter lokasi target, dan nama vendor target.
  * Mengambil secara dinamis API Key Gemini yang disimpan di pengaturan Satker/Global dari database `/api/settings/ocr_api_keys`.
  * Mengirim payload survei dan memantau status secara berkala (polling) menggunakan Job ID melalui `/api/survey/status/:jobId`.

### B. Backend: Go REST API
* **File Kunci**: `backend/cmd/server/main.go`, `backend/internal/handlers/survey.go`
* **Peran**:
  * Bertindak sebagai proxy yang menerima request dari frontend dan menyalurkannya ke microservice survei.

### C. Worker Service: Node.js + Puppeteer (survey-service)
* **File Kunci**: `survey-service/server.js`
* **Peran**:
  * Menggunakan **BullMQ** dengan antrean Redis untuk memproses job survei secara antrean (concurrency = 1 untuk efisiensi RAM di VPS).
  * Mengontrol browser Chromium via **Puppeteer** untuk menjelajahi e-Katalog LKPP secara live.
  * Menghasilkan screenshot hasil pencarian dan halaman detail produk.

---

## 3. Alur Pemrosesan Survei (Step-by-Step Workflow)

### Tahap 1: Ekstraksi & Pra-Pembersihan
Ketika survei dimulai, nama barang dari DPA dibersihkan menggunakan dua metode:
1. **Heuristic Rule (Regex)**: Menghapus kata pembuka pengadaan (*belanja, penyediaan, sewa, paket*) serta satuan di akhir kalimat (*rim, box, pcs, pack*).
2. **Gemini LLM Refinement**: Jika "AI Aktif" dicentang, nama barang DPA yang panjang dikirim ke Gemini API (`gemini-1.5-flash`) untuk diekstrak menjadi 1-3 kata kunci pencarian yang paling relevan (misal: *"Belanja Makanan Dan Minuman Rapat (Nasi Kotak Ayam Bakar)"* menjadi *"Nasi Kotak"*).

### Tahap 2: Ekstraksi Query Percobaan (Search Attempts)
Sistem membuat daftar alternatif query pencarian secara berjenjang dari spesifik ke umum. Jika query pertama gagal menghasilkan produk, sistem mencoba kata kunci berikutnya.
* Contoh query attempts untuk `"PAKET NASI KOTAK PUJASERA99"`:
  1. `"NASI KOTAK PUJASERA99"` (Pembersihan awal)
  2. `"NASI KOTAK"` (Alternatif pangkas kata belakang)
  3. `"NASI"` (Core query)
  4. `"NASI KOTAK"` (Abaikan kata depan)

### Tahap 3: Pemindaian Vendor (Bypass Mode)
Jika user mengisi `Target Penyedia / URL e-Katalog (Opsional)` dengan URL produk e-Katalog spesifik:
* Bot langsung melakukan bypass mengunjungi URL tersebut tanpa melakukan pencarian kata kunci.
* Bot membaca judul produk asli di halaman tersebut (misalnya judul produk adalah `"PAKET NASI KOTAK PUJASERA99"` milik vendor *"DWI RATNA ANGGRAENI"*).
* Bot menetapkan penyedia tersebut sebagai pemenang survei produk utama secara otomatis.

### Tahap 4: Logika Pembanding Otomatis (Auto-Comparator)
Setelah produk utama teridentifikasi, bot akan menyaring data dari hasil pencarian global untuk mencari produk kompetitor dengan aturan ketat:
* **Anti-Monopoli**: Penyedia pembanding tidak boleh sama dengan penyedia produk utama (`c.vendor !== bestCandidate.vendor`).
* **Batas Harga Wajar**: Harga pembanding harus masuk akal, berkisar antara $0.7 \times$ hingga $1.5 \times$ dari harga pagu DPA.
* **Anti-Halusinasi**: Jika tidak ada kompetitor riil yang memenuhi syarat, kolom pembanding dikosongkan. Sistem **tidak boleh mengarang** data fiktif.

### Tahap 5: Deteksi Zona & Wilayah Pengiriman
Lokasi penyedia dicocokkan secara dinamis dengan instansi PPK yang login saat ini:
* **Zona 1**: Kecamatan Penyedia **sama** dengan Kecamatan Instansi PPK (misal: keduanya di Besuk) $\rightarrow$ `🟢 Zona 1: Kec. Sama`.
* **Zona 2**: Kecamatan Penyedia berbeda namun masih di Kabupaten Probolinggo $\rightarrow$ `🔵 Zona 2`.
* **Luar Wilayah**: Berada di luar Kabupaten Probolinggo $\rightarrow$ `📍 Luar Wilayah`.

---

## 4. Struktur Basis Data Relasional (Database Schema)

* **Tabel `vendor_locations`**:
  Menyimpan pemetaan lokasi dinamis hasil koreksi/input manual PPK di frontend.
  ```go
  type VendorLocation struct {
      ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
      VendorName  string    `gorm:"uniqueIndex;not null" json:"vendor_name"`
      Subdistrict string    `gorm:"not null" json:"subdistrict"`
      UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
  }
  ```

* **Tabel `projects`**:
  Menyimpan snapshot dpaRincian, docSettings, dan hasil akhir `surveyData` dalam format JSON pada kolom `description`.

---

## 5. Rencana Pengembangan Mendatang (Future Roadmap)

AI IDE lain dapat melanjutkan optimasi pada area berikut:
1. **Dynamic Region Expansion**: Jika pencarian pembanding di tingkat regional (`Kab. Probolinggo`) menghasilkan **0 kompetitor**, sistem harus secara otomatis memperluas radius pencarian ke tingkat Provinsi atau Nasional khusus untuk kolom kompetitor pembanding agar tabel dokumen DPP tidak kosong.
2. **Semantic Embeddings Matching**: Menggantikan logika Jaccard Similarity tradisional dengan pencocokan kemiripan vektor (Embeddings) untuk mendeteksi kesetaraan spesifikasi produk pengganti secara akurat.
3. **AI Price Negotiator**: Menggunakan LLM untuk menganalisis selisih harga produk utama dengan kompetitor dan menghasilkan draft kalimat negosiasi harga otomatis untuk Pejabat Pengadaan.

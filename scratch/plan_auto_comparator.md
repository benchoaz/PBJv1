# Ide Perbaikan Fitur Auto Pembanding

Berdasarkan analisis sistem, alasan mengapa "Auto Pembanding" sering kosong atau tidak muncul adalah karena aturan penyaringan (*filtering*) yang saling berbenturan di dalam sistem pencarian kita.

## Penyebab Akar (Root Cause)
1. **Aturan Harga Ketat:** Sistem dirancang agar Harga Pembanding **harus lebih mahal (atau sama)** dengan Harga Barang Terpilih (`c.price >= bestCandidate.price`). Ini wajar secara hukum PBJ untuk membuktikan bahwa kita sudah memilih produk yang paling "efisien/murah".
2. **Keterbatasan Halaman Pertama:** Saat Puppeteer mencari barang di `katalog.inaproc.id`, sistem mengirimkan limit `maxPrice` (Pagu). Sehingga, SEMUA barang yang didapat oleh sistem harganya *pasti* di bawah Pagu.
3. **Jendela Harga Sangat Sempit:** Jika barang terpilih harganya sudah sangat mendekati Pagu (misalnya Rp 32.000 dari Pagu Rp 32.400), maka nyaris tidak ada barang sisa di halaman pencarian tersebut yang harganya berada di celah sempit Rp 32.000 - Rp 32.400. Semuanya lebih murah, sehingga *terbuang* dari daftar pembanding.
4. **Dominasi Vendor Tunggal:** Seringkali di satu wilayah, halaman pertama dikuasai oleh vendor yang sama (misalnya DWI RATNA). Pembanding *tidak boleh* dari vendor yang sama.

## Solusi yang Saya Usulkan (Ide)

Saya akan menambahkan **Fase Pencarian Khusus Pembanding (Dedicated Comparator Search)** di dalam *backend* `survey-service`.

**Cara kerjanya:**
1. Sistem mencari target utama seperti biasa (dengan filter harga agar tidak melebihi pagu).
2. Setelah sistem menemukan `bestCandidate` (Barang Terpilih), sistem akan mengecek apakah sudah ada pembanding.
3. Jika pembanding masih **kosong**, sistem akan diam-diam **membuka tab baru / melakukan pencarian kedua** ke `katalog.inaproc.id`.
4. Pada pencarian kedua ini, sistem **melepas batasan `maxPrice` (Pagu)**, namun tetap mempertahankan filter wilayah dan kata kunci.
5. Dengan dilepasnya Pagu, Inaproc akan menampilkan barang-barang dari vendor kompetitor yang harganya mungkin sedikit lebih mahal dari Pagu (misal Rp 35.000). 
6. Sistem akan dengan mudah "mencomot" barang tersebut sebagai pembanding, karena harganya lebih tinggi dari barang terpilih, dan berasal dari vendor berbeda. Ini adalah bukti yang sangat kuat untuk diajukan ke auditor!

Apakah Anda setuju dengan ide dan alur logika ini? Jika ya, saya akan langsung menulis kodenya ke dalam `server.js` VPS Anda.

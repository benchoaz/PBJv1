const fs = require('fs');

const step3Path = '/home/beni/PBJ/frontend/src/components/ppk/Step3RincianHPS.jsx';
let step3Content = fs.readFileSync(step3Path, 'utf8');

const hookCode = `
  useEffect(() => {
    if (selectedPack) {
      const cat = getPacketCategory(selectedPack.packName);
      
      let defMerek = "";
      let defMetode = "";
      let defSpek = "";

      if (cat === 'Modal') {
        defMerek = "Sesuai dengan kebutuhan standar operasional, perangkat yang diadakan merujuk pada merek yang memiliki layanan purna jual resmi (Service Center) di wilayah terdekat dan terjamin ketersediaan suku cadangnya. Hal ini bertujuan untuk menjamin kelangsungan operasional perangkat setelah masa garansi habis.";
        defMetode = "Pemilihan penyedia dilakukan melalui metode E-Purchasing pada Katalog Elektronik (Katalog Lokal/Nasional/Sektoral) melalui prosedur Negosiasi Harga untuk mendapatkan barang dengan kualifikasi teknis yang tepat dan harga yang kompetitif.";
        defSpek = "Penyedia wajib melampirkan Surat Dukungan Pabrikan (apabila disyaratkan dalam e-Katalog), memberikan Garansi Resmi Pabrik minimal 1 (satu) tahun, serta bertanggung jawab atas proses pengiriman, instalasi, dan uji coba alat hingga berfungsi dengan baik.";
      } else if (cat === 'Konsolidasi') {
        defMerek = "Pemilihan merek/produk telah ditetapkan berdasarkan hasil Konsolidasi Pengadaan oleh Bagian Pengadaan Barang dan Jasa Sekretariat Daerah yang memiliki spesifikasi teknis dan Standar Satuan Harga yang seragam.";
        defMetode = "Dilakukan melalui metode Direct Purchasing (Pembelian Langsung) pada e-Katalog Elektronik khusus etalase Produk Konsolidasi sesuai Surat Edaran PBJ tentang pelaksanaan pengadaan barang/jasa hasil konsolidasi tanpa memandang batasan HPS.";
        defSpek = "Penyedia yang dipilih merupakan penyedia pelaksana Katalog Konsolidasi terpilih. Pengiriman dilakukan sesuai permintaan parsial/sekaligus dan tidak diperkenankan ada tambahan ongkos kirim/biaya lainnya di luar yang tertera dalam kontrak.";
      } else if (cat === 'Mamin-Prasmanan') {
        defMerek = "Penyediaan jasa katering/prasmanan tidak mensyaratkan merek tertentu, melainkan berfokus pada kualitas cita rasa, higienitas penyajian, dan reputasi kebersihan penyedia lokal di sekitar lokasi kegiatan.";
        defMetode = "Metode E-Purchasing Katalog Elektronik Etalase Makanan dan Minuman, dengan mengedepankan pemberdayaan Pelaku Usaha Mikro dan Kecil (UMK) yang berdomisili di wilayah setempat.";
        defSpek = "Penyedia wajib memiliki Sertifikat Laik Higiene Sanitasi (SLHS). Makanan disajikan secara prasmanan lengkap dengan peralatan saji yang bersih dan layak, meja, taplak, serta minimal 1 (satu) orang pramusaji yang standby selama acara berlangsung. Sisa makanan dan peralatan kotor wajib dibersihkan maksimal 1 jam setelah acara selesai.";
      } else if (cat === 'Mamin-Bungkus') {
        defMerek = "Tidak mengikat merek tertentu, mengutamakan pemanfaatan bahan pangan lokal yang diolah secara higienis oleh pelaku usaha mikro/kecil binaan pemerintah daerah setempat.";
        defMetode = "E-Purchasing pada Katalog Elektronik (Kategori Makanan dan Minuman) yang diutamakan untuk penyedia UMK lokal.";
        defSpek = "Penyedia diwajibkan memiliki SLHS (Sertifikat Laik Higiene Sanitasi). Makanan dikemas dalam wadah food-grade yang ramah lingkungan dan diantarkan ke lokasi kegiatan selambat-lambatnya 1 (satu) jam sebelum acara dimulai untuk memastikan makanan tetap dalam kondisi segar dan tidak basi.";
      } else if (cat === 'Mamin-Snack') {
        defMerek = "Tidak mengikat merek tertentu, diutamakan kudapan lokal basah/kering dengan kombinasi rasa manis dan gurih, yang dikemas rapi.";
        defMetode = "E-Purchasing pada Katalog Elektronik Etalase Makanan dan Minuman.";
        defSpek = "Penyedia wajib melampirkan produk yang memiliki masa kadaluarsa (jika kemasan pabrikan) atau menjamin kesegaran produk (jika jajanan pasar). Pengemasan menggunakan kotak makanan (snack box) food-grade, dilengkapi air mineral gelas/botol dan tisu.";
      } else if (cat === 'Jasa') {
        defMerek = "Tidak berlaku, pengadaan berupa layanan/jasa yang menitikberatkan pada kualifikasi personel dan rekam jejak perusahaan dalam menangani jasa serupa.";
        defMetode = "E-Purchasing melalui Katalog Elektronik sektoral/lokal dengan mengutamakan negosiasi pada ruang lingkup pekerjaan dan kewajaran harga.";
        defSpek = "Penyedia wajib melaksanakan layanan jasa sesuai kerangka acuan kerja, menyediakan tenaga terampil, serta memberikan laporan hasil pekerjaan secara berkala dan tepat waktu.";
      } else {
        defMerek = "Barang yang diadakan merujuk pada standar pasaran yang umum beredar, memiliki kualitas SNI (jika ada), ramah lingkungan, dan dapat memenuhi fungsi kegiatan administrasi kantor dengan baik.";
        defMetode = "E-Purchasing pada Katalog Elektronik dengan prioritas Pelaku Usaha Mikro, Kecil, dan Koperasi (UMKK) untuk menstimulasi ekonomi lokal sesuai Instruksi Presiden.";
        defSpek = "Penyedia wajib mengirimkan barang dalam kondisi baru, tidak cacat fisik, dan bersegel asli pabrik. Apabila saat serah terima ditemukan barang rusak atau tidak sesuai pesanan, penyedia wajib menukarnya maksimal dalam waktu 2x24 jam.";
      }

      if (!dppSpecs || (!dppSpecs.justifikasiMerek && !dppSpecs.metodePemilihan && !dppSpecs.spesifikasiLayanan)) {
        setDppSpecs({
          ...dppSpecs,
          justifikasiMerek: defMerek,
          metodePemilihan: defMetode,
          spesifikasiLayanan: defSpek
        });
      }
    }
  }, [selectedPack]); // Only run when selectedPack changes/loads
`;

if (!step3Content.includes('defMerek')) {
  step3Content = step3Content.replace(
    /const getPacketCategory = [\s\S]*?};\n/,
    `$&${hookCode}\n`
  );
  fs.writeFileSync(step3Path, step3Content, 'utf8');
  console.log('Injected defaults into step3');
}

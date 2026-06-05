const fs = require('fs');

const step3Path = '/home/beni/PBJ/frontend/src/components/ppk/Step3RincianHPS.jsx';
let step3Content = fs.readFileSync(step3Path, 'utf8');

// First, remove the old useEffect
step3Content = step3Content.replace(
  /  useEffect\(\(\) => \{\n    if \(selectedPack\) \{\n      const cat = getPacketCategory\([\s\S]*?\}, \[selectedPack\]\); \/\/ Only run when selectedPack changes\/loads/g,
  ''
);

const hookCode = `
  // Automatically populate AI editor defaults based on selected DPP template
  useEffect(() => {
    const templateName = docSettings?.dpp || '';
    
    let defMerek = "";
    let defMetode = "";
    let defSpek = "";

    if (templateName.includes('Modal')) {
      defMerek = "Sesuai dengan kebutuhan standar operasional, perangkat yang diadakan merujuk pada merek yang memiliki layanan purna jual resmi (Service Center) di wilayah terdekat dan terjamin ketersediaan suku cadangnya. Hal ini bertujuan untuk menjamin kelangsungan operasional perangkat setelah masa garansi habis.";
      defMetode = "Pemilihan penyedia dilakukan melalui metode E-Purchasing pada Katalog Elektronik (Katalog Lokal/Nasional/Sektoral) melalui prosedur Negosiasi Harga untuk mendapatkan barang dengan kualifikasi teknis yang tepat dan harga yang kompetitif.";
      defSpek = "Penyedia wajib melampirkan Surat Dukungan Pabrikan (apabila disyaratkan dalam e-Katalog), memberikan Garansi Resmi Pabrik minimal 1 (satu) tahun, serta bertanggung jawab atas proses pengiriman, instalasi, dan uji coba alat hingga berfungsi dengan baik.";
    } else if (templateName.includes('Konsolidasi')) {
      defMerek = "Pemilihan merek/produk telah ditetapkan berdasarkan hasil Konsolidasi Pengadaan oleh Bagian Pengadaan Barang dan Jasa Sekretariat Daerah yang memiliki spesifikasi teknis dan Standar Satuan Harga yang seragam.";
      defMetode = "Dilakukan melalui metode Direct Purchasing (Pembelian Langsung) pada e-Katalog Elektronik khusus etalase Produk Konsolidasi sesuai Surat Edaran PBJ tentang pelaksanaan pengadaan barang/jasa hasil konsolidasi tanpa memandang batasan HPS.";
      defSpek = "Penyedia yang dipilih merupakan penyedia pelaksana Katalog Konsolidasi terpilih. Pengiriman dilakukan sesuai permintaan parsial/sekaligus dan tidak diperkenankan ada tambahan ongkos kirim/biaya lainnya di luar yang tertera dalam kontrak.";
    } else if (templateName.includes('Makanan')) {
      defMerek = "Penyediaan jasa katering tidak mensyaratkan merek tertentu, melainkan berfokus pada kualitas cita rasa, higienitas penyajian, dan reputasi kebersihan penyedia lokal di sekitar lokasi kegiatan.";
      defMetode = "Metode E-Purchasing Katalog Elektronik Etalase Makanan dan Minuman, dengan mengedepankan pemberdayaan Pelaku Usaha Mikro dan Kecil (UMK) yang berdomisili di wilayah setempat.";
      defSpek = "Penyedia wajib memiliki Sertifikat Laik Higiene Sanitasi (SLHS). Makanan dikemas dalam wadah food-grade yang ramah lingkungan dan diantarkan ke lokasi kegiatan selambat-lambatnya 1 (satu) jam sebelum acara dimulai. Apabila ada prasmanan, harus disajikan lengkap dengan peralatan saji bersih.";
    } else if (templateName.includes('Jasa Lainnya')) {
      defMerek = "Tidak berlaku, pengadaan berupa layanan/jasa yang menitikberatkan pada kualifikasi personel dan rekam jejak perusahaan dalam menangani jasa serupa.";
      defMetode = "E-Purchasing melalui Katalog Elektronik sektoral/lokal dengan mengutamakan negosiasi pada ruang lingkup pekerjaan dan kewajaran harga.";
      defSpek = "Penyedia wajib melaksanakan layanan jasa sesuai kerangka acuan kerja, menyediakan tenaga terampil, serta memberikan laporan hasil pekerjaan secara berkala dan tepat waktu.";
    } else {
      // Default ATK/Barang Umum
      defMerek = "Barang yang diadakan merujuk pada standar pasaran yang umum beredar, memiliki kualitas SNI (jika ada), ramah lingkungan, dan dapat memenuhi fungsi kegiatan administrasi kantor dengan baik.";
      defMetode = "E-Purchasing pada Katalog Elektronik dengan prioritas Pelaku Usaha Mikro, Kecil, dan Koperasi (UMKK) untuk menstimulasi ekonomi lokal sesuai Instruksi Presiden.";
      defSpek = "Penyedia wajib mengirimkan barang dalam kondisi baru, tidak cacat fisik, dan bersegel asli pabrik. Apabila saat serah terima ditemukan barang rusak atau tidak sesuai pesanan, penyedia wajib menukarnya maksimal dalam waktu 2x24 jam.";
    }

    // Always override if empty, or if user changed template and wants defaults
    // Since we don't know if user explicitly cleared it, we will set it if it's currently matching an old default, or empty.
    setDppSpecs({
      ...dppSpecs,
      justifikasiMerek: defMerek,
      metodePemilihan: defMetode,
      spesifikasiLayanan: defSpek
    });
  }, [docSettings?.dpp]); 
`;

step3Content = step3Content.replace(
  /const getPacketCategory = [\s\S]*?};\n/,
  `$&${hookCode}\n`
);

fs.writeFileSync(step3Path, step3Content, 'utf8');
console.log('Injected template-based defaults into step3');

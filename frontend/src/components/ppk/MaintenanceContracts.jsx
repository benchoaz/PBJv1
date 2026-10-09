import React from 'react';
import { getMaintenanceConfig, formatTitleCase } from '../../config/maintenanceConfig';

function terbilangHelper(angka) {
  const bilangan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  const n = Math.floor(angka);
  if (n < 12) return bilangan[n];
  if (n < 20) return terbilangHelper(n - 10) + " Belas";
  if (n < 100) return (bilangan[Math.floor(n / 10)] + " Puluh " + terbilangHelper(n % 10)).trim();
  if (n < 200) return ("Seratus " + terbilangHelper(n - 100)).trim();
  if (n < 1000) return (bilangan[Math.floor(n / 100)] + " Ratus " + terbilangHelper(n % 100)).trim();
  if (n < 2000) return ("Seribu " + terbilangHelper(n - 1000)).trim();
  if (n < 1000000) return (terbilangHelper(Math.floor(n / 1000)) + " Ribu " + terbilangHelper(n % 1000)).trim();
  if (n < 1000000000) {
    const juta = terbilangHelper(Math.floor(n / 1000000)) + " Juta";
    const sisa = terbilangHelper(n % 1000000);
    return (juta + " " + sisa).trim();
  }
  if (n < 1000000000000) {
    const milyar = terbilangHelper(Math.floor(n / 1000000000)) + " Milyar";
    const sisa = terbilangHelper(n % 1000000000);
    return (milyar + " " + sisa).trim();
  }
  return "";
}

function terbilang(angka) {
  const n = Math.floor(Math.abs(Number(angka) || 0));
  if (n === 0) return "Nol";
  return terbilangHelper(n).replace(/\s+/g, ' ').trim();
}

function formatTanggalIndo(tglStr, fallbackDateStr) {
  const dStr = tglStr || fallbackDateStr;
  if (!dStr) return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  try {
    const str = String(dStr).trim();
    const parts = str.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return String(dStr);
  }
}

export function getSafeNoSirupHelper(pack, metadata) {
  const metaRup = metadata?.id_rup;
  if (metaRup && !String(metaRup).includes('.')) return String(metaRup).trim();

  const packRup = pack?.noSirup || pack?.idPaket;
  if (packRup && !String(packRup).includes('.')) return String(packRup).trim();

  try {
    const raw = localStorage.getItem('pbj_sirup_packages');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && pack?.packName) {
        const cleanPName = pack.packName.toLowerCase().trim();
        const found = list.find(p => {
          const pName = (p.packName || '').toLowerCase().trim();
          return pName === cleanPName || (p.pagu && pack.pagu && Number(p.pagu) === Number(pack.pagu) && (pName.includes(cleanPName) || cleanPName.includes(pName)));
        });
        if (found?.noSirup && !String(found.noSirup).includes('.')) {
          return String(found.noSirup).trim();
        }
      }
    }
  } catch (e) {}

  return '-';
}

/**
 * 1. DOKUMEN SPK (SURAT PERINTAH KERJA) JASA PEMELIHARAAN
 * Berdasarkan Perpres 16/2018 jo Perpres 12/2021 Pasal 28 ayat (1) huruf c & Perlem LKPP 12/2021
 */
export function SpkMaintenanceDocument({
  selectedPack,
  packageMetadata = {},
  dppSpecs = {},
  currentUser,
  docSettings,
  tanggalSurat
}) {
  const currentJenis = dppSpecs?.jenisPemeliharaan || 'kendaraan';
  const mConfig = getMaintenanceConfig(currentJenis);

  // Nomor dokumen
  const nomorSpk = packageMetadata.nomor_spk || (packageMetadata.nomor_dpp ? packageMetadata.nomor_dpp.replace(/DPP/i, 'SPK') : '000.3.1/029/SPK/KEC.BESUK/2026');
  const nomorDpp = packageMetadata.nomor_dpp || '000.3.1/029/DPP/KEC.BESUK/2026';
  const tglSpk = formatTanggalIndo(packageMetadata.tanggal_spk || packageMetadata.tanggal_dpp || tanggalSurat);
  const tglDpp = formatTanggalIndo(packageMetadata.tanggal_dpp || tanggalSurat);
  const tahunAnggaran = packageMetadata.tahun_anggaran || new Date().getFullYear();

  const instansi = docSettings?.namaInstansi || currentUser?.department || 'Kecamatan Besuk';
  const alamatInstansi = docSettings?.alamatLengkap || 'Jl. Raya Besuk Nomor 37 Besuk Probolinggo';
  const kotaSurat = docSettings?.kotaSurat || (instansi.toLowerCase().includes('besuk') ? 'Besuk' : 'Probolinggo');

  // Perhitungan Nilai Kontrak / HPS
  const jasaHpsItems = (dppSpecs?.maintenanceHpsItems || []).filter(item => item.kategori === 'Jasa/Upah');
  const bahanHpsItems = (dppSpecs?.maintenanceHpsItems || []).filter(item => item.kategori !== 'Jasa/Upah');
  const subtotalJasa = jasaHpsItems.reduce((acc, it) => acc + ((parseFloat(it.volume) || 0) * (parseFloat(it.hargaSatuan) || 0)), 0);
  const subtotalBahan = bahanHpsItems.reduce((acc, it) => acc + ((parseFloat(it.volume) || 0) * (parseFloat(it.hargaSatuan) || 0)), 0);
  const subtotalHpsBeforeTax = subtotalJasa + subtotalBahan;
  const includePpn = dppSpecs?.maintenanceParams?.includePpn !== false;
  const nilaiPpn = includePpn ? Math.round(subtotalHpsBeforeTax * 0.11) : 0;
  const totalHps = subtotalHpsBeforeTax + nilaiPpn;

  const nilaiKontrak = totalHps > 0 ? totalHps : (selectedPack?.pagu || 0);
  const terbilangKontrak = terbilang(nilaiKontrak);

  // Identitas Rekanan Penyedia Jasa
  const vendorName = selectedPack?.vendorName || docSettings?.namaPenyedia || (currentJenis === 'kendaraan' ? 'Bengkel Sahabat Motor Mandiri' : 'CV. Mitra Prima Karya');
  const vendorLeader = selectedPack?.vendorLeader || 'Bambang Irawan';
  const vendorAddress = selectedPack?.vendorAddress || docSettings?.alamatPenyedia || 'Kecamatan Besuk, Kabupaten Probolinggo';
  const vendorKbli = dppSpecs.maintenanceParams?.kbli || mConfig.defaultKbli;

  // Waktu & Garansi
  const waktuPelaksanaan = dppSpecs.waktu || packageMetadata.waktu_penyelesaian || (currentJenis === 'kendaraan' ? '10 (Sepuluh) hari kalender' : '30 (Tiga Puluh) hari kalender');
  const masaGaransi = dppSpecs.maintenanceParams?.masaGaransi || (currentJenis === 'gedung' ? '30 (tiga puluh) hari kalender' : '1 (satu) bulan atau 1.000 km');
  const rawRup = getSafeNoSirupHelper(selectedPack, packageMetadata);

  return (
    <div className="space-y-4 text-justify text-[12pt] font-['Arial',sans-serif] leading-relaxed">
      {/* JUDUL SPK */}
      <div className="text-center mb-6">
        <div className="font-bold text-[14pt] uppercase underline tracking-wide">SURAT PERINTAH KERJA (SPK)</div>
        <div className="font-bold text-[11pt]">Nomor: {nomorSpk}</div>
        <div className="text-[11pt] font-semibold mt-1">
          Paket Pekerjaan: {selectedPack?.packName || 'Jasa Pemeliharaan'}
        </div>
      </div>

      {/* PARAGRAF PEMBUKA */}
      <p className="indent-8">
        Pada hari ini, tanggal <strong>{tglSpk}</strong>, bertempat di <strong>{kotaSurat}</strong>, kami yang bertanda tangan di bawah ini:
      </p>

      {/* IDENTITAS PARA PIHAK */}
      <table className="w-full border-none mb-3">
        <tbody>
          <tr>
            <td className="w-8 align-top border-none p-1 font-bold">I.</td>
            <td className="w-48 align-top border-none p-1 font-semibold">Nama</td>
            <td className="w-3 align-top border-none p-1">:</td>
            <td className="align-top border-none p-1 font-bold">{currentUser?.name || 'Handik Hariyanto, S.Kom., M.Si'}</td>
          </tr>
          <tr>
            <td className="border-none p-1"></td>
            <td className="align-top border-none p-1 font-semibold">NIP</td>
            <td className="align-top border-none p-1">:</td>
            <td className="align-top border-none p-1 font-mono">{currentUser?.nip || '-'}</td>
          </tr>
          <tr>
            <td className="border-none p-1"></td>
            <td className="align-top border-none p-1 font-semibold">Jabatan</td>
            <td className="align-top border-none p-1">:</td>
            <td className="align-top border-none p-1">Pejabat Pembuat Komitmen (PPK) pada {instansi}</td>
          </tr>
          <tr>
            <td className="border-none p-1"></td>
            <td className="align-top border-none p-1 font-semibold">Alamat Satuan Kerja</td>
            <td className="align-top border-none p-1">:</td>
            <td className="align-top border-none p-1">{alamatInstansi}</td>
          </tr>
          <tr>
            <td className="border-none p-1"></td>
            <td colSpan={3} className="pt-1 text-slate-700 italic border-none">
              Bertindak untuk dan atas nama {instansi}, selanjutnya disebut sebagai <strong>PIHAK KESATU (PPK)</strong>.
            </td>
          </tr>

          <tr><td colSpan={4} className="h-3 border-none"></td></tr>

          <tr>
            <td className="w-8 align-top border-none p-1 font-bold">II.</td>
            <td className="w-48 align-top border-none p-1 font-semibold">Nama Penanggung Jawab</td>
            <td className="w-3 align-top border-none p-1">:</td>
            <td className="align-top border-none p-1 font-bold">{vendorLeader}</td>
          </tr>
          <tr>
            <td className="border-none p-1"></td>
            <td className="align-top border-none p-1 font-semibold">Nama Badan Usaha / Bengkel</td>
            <td className="align-top border-none p-1">:</td>
            <td className="align-top border-none p-1 font-bold uppercase">{vendorName}</td>
          </tr>
          <tr>
            <td className="border-none p-1"></td>
            <td className="align-top border-none p-1 font-semibold">Alamat Tempat Usaha</td>
            <td className="align-top border-none p-1">:</td>
            <td className="align-top border-none p-1">{vendorAddress}</td>
          </tr>
          <tr>
            <td className="border-none p-1"></td>
            <td className="align-top border-none p-1 font-semibold">Klasifikasi Usaha (KBLI)</td>
            <td className="align-top border-none p-1">:</td>
            <td className="align-top border-none p-1">{vendorKbli}</td>
          </tr>
          <tr>
            <td className="border-none p-1"></td>
            <td colSpan={3} className="pt-1 text-slate-700 italic border-none">
              Bertindak untuk dan atas nama {vendorName}, selanjutnya disebut sebagai <strong>PIHAK KEDUA (Penyedia)</strong>.
            </td>
          </tr>
        </tbody>
      </table>

      {/* DASAR HUKUM DAN RUJUKAN */}
      <div className="font-bold uppercase text-[11pt] mt-4 mb-1">DASAR HUKUM DAN RUJUKAN PENGADAAN:</div>
      <ol className="list-decimal pl-8 space-y-1 mb-4 text-justify">
        <li>Peraturan Presiden Nomor 16 Tahun 2018 tentang Pengadaan Barang/Jasa Pemerintah sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021 (Pasal 28 ayat (1) huruf c perihal Bentuk Kontrak Surat Perintah Kerja untuk Pengadaan Jasa Lainnya);</li>
        <li>Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah (Perlem LKPP) Nomor 12 Tahun 2021 tentang Pedoman Pelaksanaan Pengadaan Barang/Jasa Pemerintah Melalui Penyedia;</li>
        <li>Peraturan Pemerintah Nomor 28 Tahun 2020 tentang Perubahan atas PP Nomor 27 Tahun 2014 tentang Pengelolaan Barang Milik Negara/Daerah jo Peraturan Menteri Dalam Negeri Nomor 19 Tahun 2016 tentang Pedoman Pengelolaan Barang Milik Daerah;</li>
        <li>Dokumen Pelaksanaan Anggaran (DPA) Satuan Kerja Tahun Anggaran {tahunAnggaran} pada Akun Belanja: <strong>{selectedPack?.mak || packageMetadata.mak || '-'}</strong>;</li>
        <li>Dokumen Persiapan Pengadaan (DPP) Nomor: <strong>{nomorDpp}</strong> tanggal {tglDpp} dengan ID RUP LKPP: <strong>{rawRup}</strong>.</li>
      </ol>

      {/* SYARAT-SYARAT KONTRAK */}
      <div className="font-bold uppercase text-[11pt] mt-4 mb-1">KETENTUAN DAN SYARAT-SYARAT SURAT PERINTAH KERJA:</div>
      <p className="indent-8 mb-2">
        PIHAK KESATU memberikan perintah kerja kepada PIHAK KEDUA, dan PIHAK KEDUA menerima serta menyanggupi untuk melaksanakan pekerjaan pemeliharaan dengan syarat-syarat sebagai berikut:
      </p>

      <div className="space-y-3">
        <div>
          <strong>1. Lingkup Pekerjaan &amp; Objek Pemeliharaan:</strong>
          <p className="indent-6 mt-1">
            PIHAK KEDUA wajib melaksanakan pekerjaan pemeliharaan berkala, servis rutin, perbaikan teknis, dan penggantian komponen/suku cadang pada objek pemeliharaan dinas milik {instansi} sebagaimana tercantum dalam rincian berikut:
          </p>
          <div className="my-2">
            <table className="w-full border-collapse border border-slate-900 text-[10.5pt]">
              <thead>
                <tr className="bg-slate-100 font-bold text-center">
                  <td className="border border-slate-900 p-1 w-8">No</td>
                  {mConfig.objekColumns.map(col => (
                    <td key={col.key} className="border border-slate-900 p-1">{col.label}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(!dppSpecs?.maintenanceObjects || dppSpecs.maintenanceObjects.length === 0) ? (
                  <tr>
                    <td colSpan={mConfig.objekColumns.length + 1} className="border border-slate-900 p-2 text-center italic text-slate-500">
                      1 Paket Pekerjaan Pemeliharaan sesuai rincian DPA/DPP.
                    </td>
                  </tr>
                ) : (
                  dppSpecs.maintenanceObjects.map((obj, idx) => (
                    <tr key={obj.id || idx}>
                      <td className="border border-slate-900 p-1 text-center align-top">{idx + 1}</td>
                      {mConfig.objekColumns.map(col => (
                        <td key={col.key} className="border border-slate-900 p-1 align-top">
                          {obj[col.key] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <strong>2. Nilai Pekerjaan (Harga Kontrak):</strong>
          <p className="indent-6 mt-1">
            Total nilai pekerjaan pemeliharaan yang disepakati adalah sebesar <strong>Rp {nilaiKontrak.toLocaleString('id-ID')}</strong> (<em>{terbilangKontrak} Rupiah</em>). Nilai tersebut telah memperhitungkan seluruh upah tenaga mekanik/teknisi terampil, biaya suku cadang/bahan orisinil, peralatan kerja, biaya operasional, keuntungan wajar penyedia, serta seluruh pajak yang berlaku sesuai ketentuan perundang-undangan perpajakan.
          </p>
        </div>

        <div>
          <strong>3. Jangka Waktu Pelaksanaan:</strong>
          <p className="indent-6 mt-1">
            Jangka waktu pelaksanaan pekerjaan ditetapkan selama <strong>{waktuPelaksanaan}</strong> terhitung sejak tanggal diterbitkannya Surat Perintah Kerja (SPK) ini. Lokasi penyerahan hasil akhir pekerjaan berada di: <strong>{formatTitleCase(dppSpecs.tempat || packageMetadata.lokasi_pekerjaan || instansi)}</strong>.
          </p>
        </div>

        <div>
          <strong>4. Standar Mutu Suku Cadang &amp; Bukti Fisik Komponen Bekas:</strong>
          <ul className="list-disc pl-8 mt-1 space-y-1">
            <li>Seluruh suku cadang (spare part), pelumas mesin/transmisi, dan bahan yang dipergunakan wajib dalam kondisi 100% baru dan memenuhi standar suku cadang asli pabrikan (OEM / Genuine Parts) atau berkualitas setara SNI demi menjamin keselamatan berkendara dan keandalan operasional dinas.</li>
            <li>PIHAK KEDUA wajib mengumpulkan dan menyerahkan seluruh fisik suku cadang bekas (onderdil lama yang telah diganti) kepada Pengurus Barang / PPK PIHAK KESATU sebagai bukti fisik pertanggungjawaban penatausahaan aset Barang Milik Daerah (BMD).</li>
          </ul>
        </div>

        <div>
          <strong>5. Jaminan Pemeliharaan, Garansi, &amp; Surat Pernyataan Kesanggupan (SKP):</strong>
          <ul className="list-disc pl-8 mt-1 space-y-1">
            <li>PIHAK KEDUA memberikan jaminan/garansi hasil pekerjaan pemeliharaan minimal selama <strong>{masaGaransi}</strong> terhitung sejak tanggal Berita Acara Serah Terima (BAST).</li>
            <li>PIHAK KEDUA melampirkan <strong>Surat Pernyataan Kesanggupan Pemeliharaan (SKP)</strong> bermaterai yang menjadi lampiran tak terpisahkan dari SPK ini. Apabila timbul cacat mutu atau kerusakan fungsi dalam masa garansi, PIHAK KEDUA wajib memperbaikinya kembali selambat-lambatnya dalam 2x24 jam tanpa biaya tambahan.</li>
          </ul>
        </div>

        <div>
          <strong>6. Sanksi Denda Keterlambatan:</strong>
          <p className="indent-6 mt-1">
            Apabila PIHAK KEDUA terlambat menyelesaikan pekerjaan melebihi batas waktu yang ditetapkan, PIHAK KEDUA dikenakan denda keterlambatan sebesar <strong>1/1000 (satu permil)</strong> dari nilai kontrak (sebelum PPN) untuk setiap hari kalender keterlambatan, sebagaimana diatur dalam Pasal 79 Peraturan Presiden Nomor 16 Tahun 2018.
          </p>
        </div>

        <div>
          <strong>7. Ketentuan Penyelesaian Pekerjaan &amp; Pembayaran:</strong>
          <p className="indent-6 mt-1">
            Pembayaran 100% (seratus persen) dilaksanakan secara non-tunai melalui rekening bank resmi PIHAK KEDUA setelah seluruh pekerjaan selesai dilaksanakan dengan baik dan dibuktikan dengan kelengkapan dokumen sah:
          </p>
          <ul className="list-disc pl-8 mt-1 space-y-0.5 text-[11pt]">
            <li>Nota/Faktur rincian biaya resmi yang memisahkan jasa perbaikan dan komponen suku cadang;</li>
            <li>Surat Perintah Kerja (SPK) yang telah ditandatangani kedua belah pihak;</li>
            <li>Dokumentasi foto fisik kondisi objek sebelum dan sesudah pelaksanaan servis/perbaikan;</li>
            <li>Berita Acara Pemeriksaan Pekerjaan dan Berita Acara Serah Terima (BAST);</li>
            <li>Surat Pernyataan Kesanggupan Pemeliharaan (SKP) bermaterai.</li>
          </ul>
        </div>
      </div>

      {/* PENUTUP & TANDA TANGAN DUA PIHAK */}
      <p className="indent-8 mt-4">
        Demikian Surat Perintah Kerja (SPK) ini dibuat dalam rangkap 2 (dua) bermaterai cukup dan memiliki kekuatan hukum yang sama bagi kedua belah pihak untuk dipatuhi dan dilaksanakan dengan penuh rasa tanggung jawab.
      </p>

      <div className="grid grid-cols-2 gap-8 mt-8 pt-4" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="text-center">
          <div className="font-bold">Menerima dan Menyetujui:</div>
          <div className="font-bold">Untuk dan atas nama Penyedia</div>
          <div className="font-bold uppercase">{vendorName}</div>
          <div className="h-20 flex items-center justify-center italic text-[10px] text-slate-400">
            (Materai Rp 10.000,-)
          </div>
          <div className="font-bold underline uppercase">{vendorLeader}</div>
          <div>Direktur / Penanggung Jawab</div>
        </div>
        <div className="text-center">
          <div>{kotaSurat}, {tglSpk}</div>
          <div className="font-bold">Untuk dan atas nama:</div>
          <div className="font-bold uppercase">{instansi}</div>
          <div className="font-bold">Pejabat Pembuat Komitmen (PPK)</div>
          {docSettings?.ttdPpk ? (
            <div className="flex justify-center my-1">
              <img src={docSettings.ttdPpk} alt="TTD PPK" style={{ maxHeight: '75px', maxWidth: '200px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.2)' }} />
            </div>
          ) : (
            <div className="h-20"></div>
          )}
          <div className="font-bold underline uppercase">{currentUser?.name}</div>
          <div className="font-mono">NIP. {currentUser?.nip}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. DOKUMEN SKP (SURAT PERNYATAAN KESANGGUPAN PEMELIHARAAN)
 * Berdasarkan Regulasi Jaminan Pemeliharaan PP 28/2020 jo Permendagri 19/2016 & Perpres 16/2018
 */
export function SkpMaintenanceDocument({
  selectedPack,
  packageMetadata = {},
  dppSpecs = {},
  currentUser,
  docSettings,
  tanggalSurat
}) {
  const currentJenis = dppSpecs?.jenisPemeliharaan || 'kendaraan';
  const mConfig = getMaintenanceConfig(currentJenis);

  const nomorSkp = packageMetadata.nomor_skp || '001/SKP/BENGKEL/X/2026';
  const nomorSpk = packageMetadata.nomor_spk || (packageMetadata.nomor_dpp ? packageMetadata.nomor_dpp.replace(/DPP/i, 'SPK') : '000.3.1/029/SPK/KEC.BESUK/2026');
  const tglSurat = formatTanggalIndo(packageMetadata.tanggal_spk || packageMetadata.tanggal_dpp || tanggalSurat);
  const instansi = docSettings?.namaInstansi || currentUser?.department || 'Kecamatan Besuk';
  const kotaSurat = docSettings?.kotaSurat || (instansi.toLowerCase().includes('besuk') ? 'Besuk' : 'Probolinggo');

  const vendorName = selectedPack?.vendorName || docSettings?.namaPenyedia || (currentJenis === 'kendaraan' ? 'Bengkel Sahabat Motor Mandiri' : 'CV. Mitra Prima Karya');
  const vendorLeader = selectedPack?.vendorLeader || 'Bambang Irawan';
  const vendorAddress = selectedPack?.vendorAddress || docSettings?.alamatPenyedia || 'Kecamatan Besuk, Kabupaten Probolinggo';
  const vendorKbli = dppSpecs.maintenanceParams?.kbli || mConfig.defaultKbli;
  const masaGaransi = dppSpecs.maintenanceParams?.masaGaransi || (currentJenis === 'gedung' ? '30 (tiga puluh) hari kalender' : '1 (satu) bulan atau 1.000 km');

  return (
    <div className="space-y-4 text-justify text-[12pt] font-['Arial',sans-serif] leading-relaxed">
      {/* JUDUL SKP */}
      <div className="text-center mb-6">
        <div className="font-bold text-[14pt] uppercase underline tracking-wide">
          SURAT PERNYATAAN KESANGGUPAN PEMELIHARAAN (SKP)
        </div>
        <div className="font-bold text-[11pt]">Nomor: {nomorSkp}</div>
        <div className="text-[10.5pt] text-slate-600 mt-1">
          Lampiran Berita Acara Serah Terima (BAST) &amp; SPK Nomor: {nomorSpk}
        </div>
      </div>

      {/* IDENTITAS PENYEDIA */}
      <p className="indent-8">
        Yang bertanda tangan di bawah ini:
      </p>

      <table className="w-full border-none mb-3">
        <tbody>
          <tr>
            <td className="w-48 align-top border-none p-1 font-semibold">Nama Penanggung Jawab</td>
            <td className="w-3 align-top border-none p-1">:</td>
            <td className="align-top border-none p-1 font-bold">{vendorLeader}</td>
          </tr>
          <tr>
            <td className="align-top border-none p-1 font-semibold">Jabatan</td>
            <td className="align-top border-none p-1">:</td>
            <td className="align-top border-none p-1">Pimpinan / Direktur Bengkel Rekanan</td>
          </tr>
          <tr>
            <td className="align-top border-none p-1 font-semibold">Nama Badan Usaha / Usaha</td>
            <td className="align-top border-none p-1">:</td>
            <td className="align-top border-none p-1 font-bold uppercase">{vendorName}</td>
          </tr>
          <tr>
            <td className="align-top border-none p-1 font-semibold">Alamat Tempat Usaha</td>
            <td className="align-top border-none p-1">:</td>
            <td className="align-top border-none p-1">{vendorAddress}</td>
          </tr>
          <tr>
            <td className="align-top border-none p-1 font-semibold">Izin Usaha / KBLI</td>
            <td className="align-top border-none p-1">:</td>
            <td className="align-top border-none p-1">{vendorKbli}</td>
          </tr>
        </tbody>
      </table>

      {/* KONSIDERAN RUJUKAN */}
      <p className="indent-8">
        Sehubungan dengan pelaksanaan paket pekerjaan <strong>{selectedPack?.packName || 'Jasa Pemeliharaan'}</strong> pada <strong>{instansi}</strong> Tahun Anggaran {packageMetadata.tahun_anggaran || new Date().getFullYear()} berdasarkan Surat Perintah Kerja (SPK) Nomor: <strong>{nomorSpk}</strong>, dengan ini menyatakan dengan sebenarnya dan penuh rasa tanggung jawab:
      </p>

      {/* BUTIR-BUTIR PERNYATAAN */}
      <ol className="list-decimal pl-8 space-y-2.5 mb-4 text-justify">
        <li>
          <strong>Kesanggupan Garansi Purna Jual &amp; Masa Pemeliharaan:</strong><br />
          Kami menjamin seluruh hasil pekerjaan servis, perbaikan teknis, serta komponen/suku cadang yang telah dipasang berfungsi dengan optimal, aman digunakan, dan memenuhi standar kelaikan operasional selama masa garansi/pemeliharaan yaitu minimal selama <strong>{masaGaransi}</strong> terhitung sejak tanggal penandatanganan Berita Acara Serah Terima (BAST).
        </li>
        <li>
          <strong>Kesanggupan Perbaikan Cacat Mutu (Bebas Biaya Tambahan):</strong><br />
          Apabila dalam masa pemeliharaan tersebut di atas terjadi kerusakan kembali, penurunan fungsi, atau cacat mutu akibat kegagalan pengerjaan teknis maupun kerusakan suku cadang yang dipasang, kami sanggup dan bersedia melakukan pemeriksaan dan perbaikan ulang atau penggantian komponen tanpa memungut biaya tambahan apa pun (gratis/bebas biaya) selambat-lambatnya dalam waktu <strong>2 x 24 jam</strong> sejak diterimanya pemberitahuan resmi dari PPK/Pengurus Barang.
        </li>
        <li>
          <strong>Jaminan Orisinalitas Suku Cadang &amp; Pelumas:</strong><br />
          Kami menjamin bahwa seluruh suku cadang, pelumas mesin/transmisi, dan bahan penunjang yang dipasang/digunakan dalam pekerjaan pemeliharaan ini adalah 100% baru, berkualitas standar pabrikan resmi (OEM / Genuine Parts) atau setara SNI, serta bebas dari barang tiruan/rekondisi/bekas.
        </li>
        <li>
          <strong>Kepatuhan Penyerahan Komponen Bekas Pengelolaan BMD:</strong><br />
          Sesuai ketentuan Peraturan Pemerintah Nomor 28 Tahun 2020 dan Permendagri Nomor 19 Tahun 2016 tentang Pengelolaan Barang Milik Daerah, kami telah dan sanggup menyerahkan seluruh onderdil/komponen bekas yang diganti kepada Pejabat Pembuat Komitmen (PPK) / Pengurus Barang Satuan Kerja sebagai bukti fisik pertanggungjawaban penatausahaan aset dinas.
        </li>
        <li>
          <strong>Kepatuhan Sanksi Hukum &amp; Regulasi Pengadaan:</strong><br />
          Apabila di kemudian hari kami terbukti ingkar janji (wanprestasi), tidak memenuhi kewajiban garansi, atau melanggar butir-butir pernyataan di atas, kami bersedia dituntut sesuai ketentuan hukum yang berlaku, dikenakan sanksi ganti rugi, pemutusan kerjasama kemitraan, serta sanksi pencantuman dalam Daftar Hitam (Blacklist) penyedia sesuai ketentuan Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah.
        </li>
      </ol>

      <p className="indent-8 mt-4">
        Demikian Surat Pernyataan Kesanggupan Pemeliharaan (SKP) ini kami buat dengan sadar, sukarela, dan tanpa paksaan dari pihak mana pun, serta dibubuhi materai yang cukup untuk dipergunakan sebagaimana mestinya.
      </p>

      {/* TANDA TANGAN */}
      <div className="grid grid-cols-2 gap-8 mt-8 pt-4" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div className="text-center">
          <div className="italic text-slate-600 text-[11pt]">Mengetahui dan Menyetujui:</div>
          <div className="font-bold">Pejabat Pembuat Komitmen (PPK)</div>
          <div className="font-bold uppercase">{instansi}</div>
          {docSettings?.ttdPpk ? (
            <div className="flex justify-center my-1">
              <img src={docSettings.ttdPpk} alt="TTD PPK" style={{ maxHeight: '75px', maxWidth: '200px', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.2)' }} />
            </div>
          ) : (
            <div className="h-20"></div>
          )}
          <div className="font-bold underline uppercase">{currentUser?.name}</div>
          <div className="font-mono">NIP. {currentUser?.nip}</div>
        </div>
        <div className="text-center">
          <div>{kotaSurat}, {tglSurat}</div>
          <div className="font-bold">Yang Membuat Pernyataan,</div>
          <div className="font-bold uppercase">{vendorName}</div>
          <div className="h-20 flex items-center justify-center italic text-[10px] text-slate-400">
            (Materai Rp 10.000,-)
          </div>
          <div className="font-bold underline uppercase">{vendorLeader}</div>
          <div>Pimpinan / Penanggung Jawab</div>
        </div>
      </div>
    </div>
  );
}

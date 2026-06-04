import React from 'react';
import {
  BAHP_TEMPLATE_TYPES,
  KOMPARASI_KRITERIA,
  DASAR_HUKUM,
  KLAUSUL_KHUSUS,
  PENUTUP_TEMPLATE,
  resolveCritVal,
} from './BahpTemplates';

/**
 * BahpDocument — Dokumen BAHP resmi yang dapat dicetak.
 * Setiap jenis pengadaan menghasilkan dokumen yang secara substansial berbeda.
 */
export default function BahpDocument({
  templateId = 'atk',
  submittedPack,
  negotiatedItems = {},
  checkedItems = {},
  docSettings = {},
  user,
  refinedBahpIntro,
  refinedBahpConclusion,
  getPackageItems,
  getDynamicTotalPagu,
}) {
  // ── Metadata dokumen ──────────────────────────────────────────────────────
  const instansi   = docSettings.namaInstansi    || submittedPack?.senderDepartment || 'Kecamatan Besuk';
  const ukpbj      = docSettings.namaUKPBJ       || 'Unit Kerja Pengadaan Barang/Jasa (UKPBJ)';
  const alamat     = docSettings.alamatInstansi   || 'Kabupaten Probolinggo, Jawa Timur';
  const tahun      = new Date().getFullYear();
  const nomorFmt   = docSettings.formatNomorSurat || '027/{nomor}/PP/437.82/{tahun}';
  const nomorBahp  = nomorFmt
    .replace('{nomor}', docSettings.nomorUrut || '78')
    .replace('{tahun}', tahun)
    .toUpperCase();

  const tpl         = BAHP_TEMPLATE_TYPES.find(t => t.id === templateId) || BAHP_TEMPLATE_TYPES[0];
  const kriteria    = KOMPARASI_KRITERIA[templateId]  || KOMPARASI_KRITERIA.atk;
  const dasarHukum  = DASAR_HUKUM[templateId]         || DASAR_HUKUM.atk;
  const klausul     = KLAUSUL_KHUSUS[templateId];
  const penutup     = PENUTUP_TEMPLATE[templateId]     || PENUTUP_TEMPLATE.atk;

  const activeItems = (getPackageItems?.(submittedPack) || []).filter(i => checkedItems[i.no]);
  const grandTotal  = activeItems.reduce((acc, item) => {
    const n = negotiatedItems[item.no] || {};
    return acc + parseFloat(n.price || 0) * (item.qty || 1) + parseFloat(n.ongkir || 0);
  }, 0);

  const today    = new Date();
  const tglLong  = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const tglShort = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── Style shortcuts ───────────────────────────────────────────────────────
  const B  = 'border border-slate-800';
  const TD = `${B} p-1.5 text-[8.5px]`;
  const TH = `${TD} bg-slate-100 font-bold text-center`;

  // ── Seksi A: kolom tambahan khas tiap template ────────────────────────────
  const extraColDefs = {
    atk:          [{ key: 'status_pdn', label: 'PDN/TKDN' }, { key: 'status_umkk', label: 'UMKK' }],
    mamin:        [{ key: 'jenis_menu', label: 'Menu' }, { key: 'sertif_halal', label: 'Halal' }],
    jasa:         [{ key: 'output', label: 'Output' }, { key: 'jangka_waktu', label: 'Jangka Waktu' }],
    modal:        [{ key: 'merk_tipe', label: 'Merk/Tipe' }, { key: 'garansi', label: 'Garansi' }, { key: 'tkdn_pct', label: 'TKDN (%)' }],
    pemeliharaan: [{ key: 'cakupan', label: 'Cakupan Pekerjaan' }, { key: 'garansi_kerja', label: 'Garansi Kerja' }],
    konstruksi:   [{ key: 'sbu', label: 'SBU' }, { key: 'jadwal', label: 'Waktu (HK)' }, { key: 'k3', label: 'K3/SMKK' }],
  };
  const extraCols = extraColDefs[templateId] || [];

  return (
    <div className="bg-white text-slate-900 text-[9.5px] leading-relaxed font-serif max-w-[780px] mx-auto print:max-w-none">

      {/* ╔══════════════════════════════════════════════╗
          ║ KOP SURAT                                    ║
          ╚══════════════════════════════════════════════╝ */}
      <div className="text-center border-b-4 border-double border-slate-900 pb-3 mb-4 font-sans">
        <div className="text-[12px] font-bold tracking-wider uppercase">PEMERINTAH KABUPATEN PROBOLINGGO</div>
        <div className="text-[13px] font-bold tracking-widest uppercase mt-0.5">{ukpbj}</div>
        <div className="text-[8.5px] mt-0.5 text-slate-600">{alamat}</div>
      </div>

      {/* ╔══════════════════════════════════════════════╗
          ║ JUDUL DOKUMEN                                ║
          ╚══════════════════════════════════════════════╝ */}
      <div className="text-center font-bold uppercase underline text-[11.5px] tracking-wide mb-0.5 font-sans">
        BERITA ACARA HASIL PEMILIHAN (BAHP) E-PURCHASING
      </div>
      <div className="text-center text-[8.5px] font-sans mb-0.5">
        Jenis Pengadaan: <strong>{tpl.label.toUpperCase()}</strong> — Metode: {tpl.metodePemilihan}
      </div>
      <div className="text-center font-bold text-[9.5px] font-sans mb-4">
        NOMOR: {nomorBahp}
      </div>

      {/* ╔══════════════════════════════════════════════╗
          ║ PEMBUKA                                      ║
          ╚══════════════════════════════════════════════╝ */}
      <div className="text-justify mb-3 font-sans">
        {refinedBahpIntro ? (
          <span className="whitespace-pre-wrap">{refinedBahpIntro}</span>
        ) : (
          <>
            Pada hari ini, <strong>{tglLong}</strong>, bertempat di {instansi},
            Pejabat Pengadaan pada Satuan Kerja <strong>{instansi}</strong> telah melaksanakan
            proses penelusuran katalog elektronik, komparasi harga dan kualitas, serta negosiasi
            teknis kepada penyedia melalui sistem e-Purchasing Katalog Elektronik LKPP untuk
            pengadaan <strong>{tpl.jenisPengadaan}</strong> — <em>{tpl.label}</em> —
            sebagaimana tercantum di bawah ini.
          </>
        )}
      </div>

      {/* ── Identitas Paket ── */}
      <table className="w-full text-[9px] font-sans border-collapse mb-4">
        <tbody>
          {[
            ['Satuan Kerja',          instansi],
            ['Nama Pekerjaan',        submittedPack?.packName       || '-'],
            ['Jenis Pengadaan',       tpl.jenisPengadaan],
            ['Metode Pemilihan',      tpl.metodePemilihan],
            ['Kode RUP (SIRUP LKPP)', submittedPack?.noSirup        || '-'],
            ['MAK / Akun Belanja',    submittedPack?.mak             || '-'],
            ['Total Pagu HPS DPA',    `Rp ${(getDynamicTotalPagu?.() || 0).toLocaleString('id-ID')}`],
            ['Tanggal Pemrosesan',    tglShort],
          ].map(([label, val]) => (
            <tr key={label}>
              <td className="py-0.5 w-48 font-semibold align-top">{label}</td>
              <td className="py-0.5 w-3">:</td>
              <td className="py-0.5">{val}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ╔══════════════════════════════════════════════╗
          ║ DASAR HUKUM                                  ║
          ╚══════════════════════════════════════════════╝ */}
      <SectionTitle>Dasar Hukum</SectionTitle>
      <ol className="list-decimal list-inside text-[9px] font-sans space-y-0.5 mb-4 ml-3">
        {dasarHukum.map((d, i) => <li key={i} className="leading-relaxed">{d}</li>)}
      </ol>

      {/* ╔══════════════════════════════════════════════╗
          ║ SEKSI A — RINCIAN PENETAPAN PRODUK/JASA      ║
          ╚══════════════════════════════════════════════╝ */}
      <SectionTitle letter="A">
        Hasil Rincian Penetapan {tpl.jenisPengadaan} melalui e-Purchasing
      </SectionTitle>
      <table className="w-full border-collapse font-sans mb-4">
        <thead>
          <tr>
            <td className={`${TH} w-5`}>No</td>
            <td className={TH}>Nama {tpl.jenisPengadaan}</td>
            <td className={`${TH} w-10`}>Vol</td>
            <td className={TH}>Penyedia</td>
            <td className={`${TH} text-right`}>Harga Tayang</td>
            <td className={`${TH} text-right`}>Harga Negosiasi</td>
            <td className={`${TH} text-right`}>Biaya Kirim</td>
            {extraCols.map(c => <td key={c.key} className={`${TH}`}>{c.label}</td>)}
            <td className={`${TH} text-right`}>Total</td>
            <td className={`${TH} w-14`}>Status</td>
          </tr>
        </thead>
        <tbody>
          {activeItems.length === 0 ? (
            <tr><td colSpan={9 + extraCols.length} className={`${TD} text-center italic text-slate-400`}>
              Belum ada item yang diproses
            </td></tr>
          ) : activeItems.map((item, idx) => {
            const nego    = negotiatedItems[item.no] || {};
            const tayang  = parseFloat(nego.tayang  ?? item.tayang ?? item.price ?? 0);
            const negoVal = parseFloat(nego.price   ?? 0);
            const ongkir  = parseFloat(nego.ongkir  ?? 0);
            const vendor  = nego.vendor || item.vendor || item.dppVendor || '-';
            const total   = (negoVal * (item.qty || 1)) + ongkir;
            const status  = nego.itemStatus || 'Tersedia';
            return (
              <tr key={item.no} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                <td className={`${TD} text-center`}>{idx + 1}</td>
                <td className={TD}>{item.name}</td>
                <td className={`${TD} text-center`}>{item.qty} {item.unit}</td>
                <td className={TD}>{vendor}</td>
                <td className={`${TD} text-right font-mono`}>Rp {tayang.toLocaleString('id-ID')}</td>
                <td className={`${TD} text-right font-mono font-bold`}>Rp {negoVal.toLocaleString('id-ID')}</td>
                <td className={`${TD} text-right font-mono`}>Rp {ongkir.toLocaleString('id-ID')}</td>
                {extraCols.map(c => (
                  <td key={c.key} className={`${TD} text-center`}>
                    {nego?.[c.key] || resolveCritVal(c.key, { vendor, harga_tayang: tayang, harga_nego: negoVal, extra: nego }, true)}
                  </td>
                ))}
                <td className={`${TD} text-right font-mono font-bold`}>Rp {total.toLocaleString('id-ID')}</td>
                <td className={`${TD} text-center`}>{status}</td>
              </tr>
            );
          })}
          {activeItems.length > 0 && (
            <tr className="bg-slate-100 font-bold font-sans">
              <td colSpan={7 + extraCols.length} className={`${TD} text-right`}>TOTAL NILAI NEGOSIASI</td>
              <td className={`${TD} text-right font-mono`}>Rp {grandTotal.toLocaleString('id-ID')}</td>
              <td className={TD}></td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ╔══════════════════════════════════════════════╗
          ║ KLAUSUL KHUSUS (berbeda tiap jenis)          ║
          ╚══════════════════════════════════════════════╝ */}
      {klausul && (
        <>
          <SectionTitle letter="B">{klausul.judul}</SectionTitle>
          <p className="font-sans text-[9px] text-justify leading-relaxed whitespace-pre-line mb-4">
            {klausul.isi}
          </p>
        </>
      )}

      {/* ╔══════════════════════════════════════════════╗
          ║ MATRIKS KOMPARASI (berbeda kriteria tiap tpl)║
          ╚══════════════════════════════════════════════╝ */}
      <SectionTitle letter="C">
        Matriks Komparasi Perbandingan {tpl.jenisPengadaan}
        {templateId === 'konstruksi' && ' (Evaluasi Harga, Teknis & Administrasi)'}
        {templateId === 'modal'      && ' (Evaluasi Teknis, Garansi & Harga)'}
        {templateId === 'jasa'       && ' (Evaluasi Kualifikasi & Harga)'}
      </SectionTitle>
      <p className="font-sans text-[9px] mb-3 leading-relaxed">
        {templateId === 'atk'         && 'Pejabat Pengadaan telah membandingkan harga satuan dari minimal 2 (dua) penyedia yang berbeda di e-Katalog LKPP sebagai dasar penetapan harga wajar:'}
        {templateId === 'mamin'       && 'Pejabat Pengadaan telah membandingkan penawaran dari beberapa penyedia katering/makanan yang terdaftar di e-Katalog, dengan mempertimbangkan aspek harga, kualitas menu, dan kepatuhan halal:'}
        {templateId === 'jasa'        && 'Pejabat Pengadaan telah membandingkan kualifikasi dan harga penawaran dari beberapa penyedia jasa, sesuai prosedur pengadaan langsung Jasa Lainnya:'}
        {templateId === 'modal'       && 'Pejabat Pengadaan telah melakukan evaluasi teknis mendalam terhadap spesifikasi, garansi, TKDN, dan harga dari beberapa penyedia barang modal:'}
        {templateId === 'pemeliharaan'&& 'Pejabat Pengadaan telah membandingkan penawaran jasa pemeliharaan dari beberapa penyedia, dengan mempertimbangkan kualifikasi teknis, cakupan pekerjaan, dan kewajaran harga:'}
        {templateId === 'konstruksi'  && 'Pejabat Pengadaan telah melakukan evaluasi administrasi, teknis, dan harga terhadap penyedia pekerjaan konstruksi sesuai ketentuan Perlem LKPP 12/2021 Lampiran V:'}
      </p>

      {activeItems.map((item, itemIdx) => {
        const nego      = negotiatedItems[item.no] || {};
        const autoComps = nego.autoComparators || [];
        const selCol    = {
          name:         item.name,
          vendor:       nego.vendor || item.vendor || item.dppVendor || '-',
          harga_tayang: parseFloat(nego.tayang ?? item.tayang ?? item.price ?? 0),
          harga_nego:   parseFloat(nego.price || 0),
          extra:        nego,
        };
        const compCols  = autoComps.map(c => ({
          name:         c.name || item.name,
          vendor:       c.vendor || '-',
          harga_tayang: parseFloat(c.price || 0),
          harga_nego:   null,
          extra:        c,
        }));
        const allCols   = [selCol, ...compCols];

        return (
          <div key={item.no} className="mb-5 font-sans">
            <div className="text-[9px] font-bold mb-1">
              {itemIdx + 1}. {templateId === 'konstruksi' ? 'Evaluasi Penyedia' : 'Komparasi'}:{' '}
              <span className="font-normal italic">{item.name}</span>
              {autoComps.length === 0 && (
                <span className="font-normal text-slate-400 ml-1">
                  — (Jalankan "Cari + Pembanding" untuk mengisi data pembanding secara otomatis)
                </span>
              )}
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <td className={`${TH} w-32 text-left`}>Kriteria Evaluasi</td>
                  {allCols.map((col, ci) => (
                    <td key={ci} className={`${TH} ${ci === 0 ? 'bg-indigo-50' : ''}`}>
                      {col.name.length > 30 ? col.name.slice(0, 30) + '…' : col.name}
                      {ci === 0 && <div className="text-[7px] font-bold text-indigo-700 mt-0.5">(TERPILIH)</div>}
                      {ci > 0 && <div className="text-[7px] font-normal text-slate-400 mt-0.5">(Pembanding {ci})</div>}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kriteria.map((krit, ki) => (
                  <tr key={ki} className={ki % 2 === 0 ? '' : 'bg-slate-50/40'}>
                    <td className={`${TD} font-semibold bg-slate-50 text-left`}>{krit.label}</td>
                    {allCols.map((col, ci) => {
                      const isSelected = ci === 0;
                      const val = resolveCritVal(krit.key, col, isSelected);
                      return (
                        <td key={ci} className={`${TD} text-center ${isSelected ? 'font-bold' : 'text-slate-500'}`}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* ╔══════════════════════════════════════════════╗
          ║ CATATAN KHUSUS KONSTRUKSI                    ║
          ╚══════════════════════════════════════════════╝ */}
      {templateId === 'konstruksi' && (
        <div className="font-sans border border-slate-300 rounded p-3 mb-4 text-[9px]">
          <div className="font-bold mb-1 uppercase text-slate-700">Catatan K3 Konstruksi (SMKK)</div>
          <p className="leading-relaxed text-justify">
            Seluruh pekerjaan konstruksi wajib dilaksanakan dengan menerapkan Sistem Manajemen
            Keselamatan Konstruksi (SMKK) sesuai Peraturan Menteri PUPR Nomor 8 Tahun 2023.
            Penyedia wajib menyampaikan Rencana Keselamatan Konstruksi (RKK) sebelum Surat Perintah
            Mulai Kerja (SPMK) diterbitkan. Kegagalan menerapkan SMKK merupakan wanprestasi yang
            dapat menjadi dasar pemutusan kontrak.
          </p>
        </div>
      )}

      {/* ╔══════════════════════════════════════════════╗
          ║ SEKSI D — KESIMPULAN & PENETAPAN             ║
          ╚══════════════════════════════════════════════╝ */}
      <SectionTitle letter="D">Kesimpulan dan Penetapan Penyedia</SectionTitle>
      <p className="font-sans text-[9px] text-justify leading-relaxed whitespace-pre-line mb-3">
        {refinedBahpConclusion || penutup}
      </p>
      <p className="font-sans text-[9px] text-justify leading-relaxed mb-6">
        Demikian Berita Acara Hasil Pemilihan (BAHP) e-Purchasing ini dibuat dengan sebenarnya,
        untuk dipergunakan sebagaimana mestinya sebagai dokumen pertanggungjawaban pelaksanaan
        pengadaan barang/jasa pemerintah sesuai ketentuan peraturan perundang-undangan yang berlaku.
      </p>

      {/* ╔══════════════════════════════════════════════╗
          ║ TANDA TANGAN                                 ║
          ╚══════════════════════════════════════════════╝ */}
      <div className="flex justify-end mt-8 font-sans">
        <div className="w-64 text-center">
          <div className="text-[9px] text-slate-800 mb-0.5">{instansi}, {tglShort}</div>
          <div className="text-[9px] text-slate-800 mb-14">
            Pejabat Pengadaan (PP)<br />{instansi}
          </div>
          <div className="text-[9.5px] font-bold text-slate-900 underline">{user?.name || '-'}</div>
          <div className="text-[9px] text-slate-700">NIP. {user?.nip || '-'}</div>
        </div>
      </div>

      {/* ╔══════════════════════════════════════════════╗
          ║ LAMPIRAN II: BUKTI SCREENSHOT & TAUTAN       ║
          ╚══════════════════════════════════════════════╝ */}
      <div className="mt-10 pt-8 border-t-2 border-dashed border-slate-350 print:break-before-page">
        <div className="text-center font-bold uppercase underline text-[10.5px] tracking-wide mb-4 font-sans">
          LAMPIRAN II: BUKTI TANGKAPAN LAYAR (SCREENSHOT) & TAUTAN RESMI E-KATALOG LKPP
        </div>
        <p className="font-sans text-[8.5px] text-slate-600 mb-4 text-justify">
          Sebagai bukti dukung kewajaran harga dan transparansi proses e-Purchasing, berikut dilampirkan bukti fisik berupa tautan (URL) produk aktif dan tangkapan layar (screenshot) dari portal katalog elektronik nasional (e-Katalog Inaproc LKPP) untuk produk terpilih serta produk pembanding:
        </p>

        <div className="space-y-6">
          {activeItems.map((item, idx) => {
            const nego = negotiatedItems[item.no] || {};
            const autoComps = nego.autoComparators || [];

            // Selected product URL and screenshot
            const selectedUrl = nego.linkSelected || item.link || "https://e-katalog.lkpp.go.id";
            const selectedScreenshot = nego.screenshotUrl || nego.screenshot || null;

            return (
              <div key={item.no} className="border border-slate-200 rounded p-3 bg-white">
                <div className="font-bold text-[9px] border-b border-slate-200 pb-1 mb-3">
                  {idx + 1}. Bukti Audit Produk Terpilih: <span className="font-normal italic">{item.name}</span>
                </div>

                {/* Selected Product Info & Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <table className="w-full text-[8.5px]">
                      <tbody>
                        <tr>
                          <td className="w-24 font-semibold py-0.5">Nama Produk Terpilih</td>
                          <td className="w-2 py-0.5">:</td>
                          <td className="py-0.5">{item.name}</td>
                        </tr>
                        <tr>
                          <td className="font-semibold py-0.5">Penyedia / Vendor</td>
                          <td className="py-0.5">:</td>
                          <td className="py-0.5">{nego.vendor || item.vendor || item.dppVendor || '-'}</td>
                        </tr>
                        <tr>
                          <td className="font-semibold py-0.5">Harga Negosiasi</td>
                          <td className="py-0.5">:</td>
                          <td className="py-0.5 font-bold">Rp {(parseFloat(nego.price) || 0).toLocaleString('id-ID')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <div className="text-[8.5px] font-semibold text-slate-700 mb-0.5">Tautan Resmi (E-Katalog):</div>
                    <a 
                      href={selectedUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-700 hover:underline break-all font-mono text-[8px]"
                    >
                      {selectedUrl}
                    </a>
                  </div>
                </div>

                {/* Selected Product Screenshot */}
                {selectedScreenshot ? (
                  <div className="border border-slate-350 rounded overflow-hidden mb-4 bg-slate-50">
                    <div className="bg-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between text-[7.5px] font-mono text-slate-600">
                      <span>{selectedUrl}</span>
                      <span className="font-sans">Tangkapan Layar Terpilih</span>
                    </div>
                    <div className="p-2 flex justify-center bg-white">
                      <img 
                        src={selectedScreenshot} 
                        alt={`Screenshot ${item.name}`} 
                        className="max-h-[220px] object-contain border border-slate-100 rounded" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 rounded p-4 text-center text-slate-450 italic text-[8.5px] mb-4 bg-slate-50">
                    Tangkapan layar untuk produk terpilih belum diambil (Jalankan "Cari + Pembanding" untuk mengambil screenshot otomatis)
                  </div>
                )}

                {/* Comparators */}
                {autoComps.length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-slate-300">
                    <div className="font-bold text-[8.5px] text-slate-700 mb-2">Produk Pembanding:</div>
                    <div className="space-y-4">
                      {autoComps.map((comp, ci) => {
                        const compUrl = comp.link || comp.url || "https://e-katalog.lkpp.go.id";
                        const compScreenshot = comp.screenshotUrl || comp.screenshot || null;

                        return (
                          <div key={ci} className="bg-slate-50/50 p-2 rounded border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <div>
                                <table className="w-full text-[8px]">
                                  <tbody>
                                    <tr>
                                      <td className="w-24 font-semibold py-0.5">Pembanding {ci + 1}</td>
                                      <td className="w-2 py-0.5">:</td>
                                      <td className="py-0.5">{comp.name || item.name}</td>
                                    </tr>
                                    <tr>
                                      <td className="font-semibold py-0.5">Penyedia / Vendor</td>
                                      <td className="py-0.5">:</td>
                                      <td className="py-0.5">{comp.vendor || '-'}</td>
                                    </tr>
                                    <tr>
                                      <td className="font-semibold py-0.5">Harga Tayang</td>
                                      <td className="py-0.5">:</td>
                                      <td className="py-0.5">Rp {(parseFloat(comp.price) || 0).toLocaleString('id-ID')}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              <div>
                                <div className="text-[8px] font-semibold text-slate-700 mb-0.5">Tautan Pembanding:</div>
                                <a 
                                  href={compUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-700 hover:underline break-all font-mono text-[7.5px]"
                                >
                                  {compUrl}
                                </a>
                              </div>
                            </div>

                            {compScreenshot && (
                              <div className="border border-slate-300 rounded overflow-hidden bg-white mt-2">
                                <div className="bg-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between text-[7px] font-mono text-slate-600">
                                  <span>{compUrl}</span>
                                  <span className="font-sans">Tangkapan Layar Pembanding {ci + 1}</span>
                                </div>
                                <div className="p-2 flex justify-center">
                                  <img 
                                    src={compScreenshot} 
                                    alt={`Screenshot Pembanding ${ci + 1}`} 
                                    className="max-h-[160px] object-contain border border-slate-100 rounded" 
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Sub-komponen helper ─────────────────────────────────────────────────────
function SectionTitle({ letter, children }) {
  return (
    <div className="font-bold text-[9.5px] uppercase font-sans border-b border-slate-400 pb-0.5 mb-2 mt-5 tracking-wide">
      {letter ? `${letter}. ` : ''}{children}
    </div>
  );
}

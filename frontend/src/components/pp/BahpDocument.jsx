import React from 'react';
import {
  BAHP_TEMPLATE_TYPES,
  KOMPARASI_KRITERIA,
  DASAR_HUKUM,
  KLAUSUL_KHUSUS,
  PENUTUP_TEMPLATE,
  resolveCritVal,
  REKOMENDASI_PP_PPK,
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
  // Gunakan tanggal yang diinput manual jika tersedia
  const customDate = docSettings.tanggalBahp ? new Date(docSettings.tanggalBahp) : new Date();
  const tglLong  = customDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const tglShort = customDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Gunakan nomor urut yang diinput manual jika tersedia
  const activeNomorUrut = docSettings.nomorUrut !== undefined ? docSettings.nomorUrut : '78';
  const nomorBahp  = nomorFmt
    .replace('{nomor}', activeNomorUrut)
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
    return acc + parseFloat(n.price || 0) * (item.qty || 1);
  }, 0);

  // Load template-specific dynamic fields from localStorage
  const getStoredJson = (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  const tenagaAhliList    = getStoredJson('pbj_tenaga_ahli_list', []);
  const biayaPersonil     = parseFloat(localStorage.getItem('pbj_biaya_personil') || '0');
  const biayaNonPersonil  = parseFloat(localStorage.getItem('pbj_biaya_non_personil') || '0');
  const satkerPesertaList = getStoredJson('pbj_satker_peserta_list', []);
  const koordinatLokasi   = localStorage.getItem('pbj_koordinat_lokasi') || '';
  const personilK3        = localStorage.getItem('pbj_personil_k3') || '';
  const metodeKerja       = localStorage.getItem('pbj_metode_kerja') || '';
  const merkTipeModal     = localStorage.getItem('pbj_merk_tipe_modal') || '';
  const nilaiTkdnModal    = localStorage.getItem('pbj_nilai_tkdn_modal') || '';
  const noSeriModal       = localStorage.getItem('pbj_no_seri_modal') || '';

  // ── Style shortcuts ───────────────────────────────────────────────────────
  const B  = 'border border-black';
  const TD = `${B} p-1.5 text-[0.85em]`;
  const TH = `${TD} bg-gray-50 font-bold text-center`;

  // ── Seksi A: kolom tambahan khas tiap template ────────────────────────────
  const extraColDefs = {
    atk:                   [{ key: 'status_pdn', label: 'PDN/TKDN' }, { key: 'status_umkk', label: 'UMKK' }],
    mamin:                 [{ key: 'jenis_menu', label: 'Menu' }, { key: 'sertif_halal', label: 'Halal' }],
    jasa:                  [{ key: 'output', label: 'Output' }, { key: 'jangka_waktu', label: 'Jangka Waktu' }],
    modal:                 [{ key: 'merk_tipe', label: 'Merk/Tipe' }, { key: 'garansi', label: 'Garansi' }, { key: 'tkdn_pct', label: 'TKDN (%)' }],
    pemeliharaan:          [{ key: 'cakupan', label: 'Cakupan Pekerjaan' }, { key: 'garansi_kerja', label: 'Garansi Kerja' }],
    konstruksi:            [{ key: 'sbu', label: 'SBU' }, { key: 'jadwal', label: 'Waktu (HK)' }, { key: 'k3', label: 'K3/SMKK' }],
    konsultasi_non:        [{ key: 'tenaga_ahli', label: 'Tenaga Ahli' }, { key: 'jangka_waktu', label: 'Jangka Waktu (Bln)' }, { key: 'output', label: 'Output' }],
    konsultasi_konstruksi: [{ key: 'sbu', label: 'SBU Konsultansi' }, { key: 'tenaga_ahli', label: 'Tenaga Ahli' }, { key: 'spta', label: 'SPTA' }],
    konsolidasi:           [{ key: 'status_pdn', label: 'Status PDN' }, { key: 'volume_total', label: 'Volume Total' }, { key: 'jml_satker', label: 'Jml Satker' }],
  };
  const extraCols = extraColDefs[templateId] || [];

  return (
    <div 
      className="bg-white text-black mx-auto print:shadow-none print:border-none print:w-full transition-all duration-300"
      style={{
        width: '100%',
        minHeight: docSettings.paperSize === 'F4' ? '330mm' : '297mm',
        paddingTop: `${docSettings.marginTop !== undefined ? docSettings.marginTop : 20}mm`,
        paddingRight: `${docSettings.marginRight !== undefined ? docSettings.marginRight : 20}mm`,
        paddingBottom: `${docSettings.marginBottom !== undefined ? docSettings.marginBottom : 25}mm`,
        paddingLeft: `${docSettings.marginLeft !== undefined ? docSettings.marginLeft : 30}mm`,
        fontFamily: docSettings.fontFamily === 'Bookman Old Style' 
          ? "'Bookman Old Style', Georgia, serif" 
          : docSettings.fontFamily === 'Arial' 
            ? "Arial, Helvetica, sans-serif" 
            : "'Times New Roman', Times, serif",
        fontSize: docSettings.fontSize || '12pt',
        lineHeight: docSettings.lineHeight || '1.15',
        boxSizing: 'border-box',
      }}
    >

      {/* ╔══════════════════════════════════════════════╗
          ║ KOP SURAT                                    ║
          ╚══════════════════════════════════════════════╝ */}
      {docSettings.showKop !== false && (
        <div className="w-full pb-3 mb-5" style={{ 
          borderBottom: '4.5px solid black',
          paddingBottom: '10px',
          marginBottom: '20px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                {/* Emblem Left Column */}
                <td style={{ width: '15%', verticalAlign: 'middle', textAlign: 'center', paddingRight: '12px' }}>
                  <div className="relative inline-block">
                    {docSettings.logoType === 'pemda' ? (
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/2/25/Lambang_Kabupaten_Probolinggo.png" 
                        alt="Logo Daerah" 
                        style={{ maxHeight: '72px', maxWidth: '72px', objectFit: 'contain', display: 'inline-block' }} 
                      />
                    ) : docSettings.logoType === 'garuda' ? (
                      <LogoGarudaPlaceholder />
                    ) : docSettings.customLogo ? (
                      <img 
                        src={docSettings.customLogo} 
                        alt="Logo Kustom" 
                        style={{ maxHeight: '72px', maxWidth: '72px', objectFit: 'contain', display: 'inline-block' }} 
                      />
                    ) : (
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/2/25/Lambang_Kabupaten_Probolinggo.png" 
                        alt="Logo Daerah" 
                        style={{ maxHeight: '72px', maxWidth: '72px', objectFit: 'contain', display: 'inline-block' }} 
                      />
                    )}
                  </div>
                </td>
                {/* Text Header Middle Column */}
                <td style={{ width: '85%', textAlign: 'center', verticalAlign: 'middle' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', lineHeight: '1.2', letterSpacing: '0.04em', color: 'black' }}>
                    {docSettings.namaPemda || 'PEMERINTAH KABUPATEN PROBOLINGGO'}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '13pt', textTransform: 'uppercase', lineHeight: '1.25', marginTop: '4px', color: 'black', whiteSpace: 'pre-line' }}>
                    {(docSettings.namaInstansi || ukpbj || '').split(', ').map((part, idx, arr) => (
                      <React.Fragment key={idx}>
                        {part}{idx < arr.length - 1 ? ',' : ''}
                        {idx < arr.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div 
                    style={{ fontSize: '8.5pt', marginTop: '6px', lineHeight: '1.35', color: '#0f172a' }}
                    dangerouslySetInnerHTML={{ __html: formatAlamatKop(docSettings.alamatLengkap || docSettings.alamatInstansi || alamat) }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ╔══════════════════════════════════════════════╗
          ║ JUDUL DOKUMEN                                ║
          ╚══════════════════════════════════════════════╝ */}
      <div className="text-center font-bold uppercase underline text-[1.25em] tracking-wide mb-0.5 ">
        BERITA ACARA HASIL PEMILIHAN (BAHP) E-PURCHASING
      </div>
      <div className="text-center text-[0.85em] mb-0.5">
        Jenis Pengadaan: <strong>{tpl.label.toUpperCase()}</strong> — Metode: {tpl.metodePemilihan}
      </div>
      <div className="text-center font-bold text-[1.05em] mb-4">
        NOMOR: {nomorBahp}
      </div>

      {/* ╔══════════════════════════════════════════════╗
          ║ PEMBUKA                                      ║
          ╚══════════════════════════════════════════════╝ */}
      <div className="text-justify mb-3 ">
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
      <table className="w-full text-[0.95em] border-collapse mb-4">
        <tbody>
          {[
            ['Satuan Kerja',          submittedPack?.senderDepartment || instansi],
            ['Nama Pekerjaan',        submittedPack?.packName       || '-'],
            ['Jenis Pengadaan',       tpl.jenisPengadaan],
            ['Metode Pemilihan',      tpl.metodePemilihan],
            ['Kode RUP (SIRUP LKPP)', submittedPack?.noSirup        || '-'],
            ['MAK / Akun Belanja',    submittedPack?.mak             || '-'],
            ['Total Pagu HPS DPA',    `Rp ${(submittedPack?.pagu || getDynamicTotalPagu?.() || 0).toLocaleString('id-ID')}`],
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
      <ol className="list-decimal list-inside text-[0.95em] space-y-0.5 mb-4 ml-3">
        {dasarHukum.map((d, i) => <li key={i} className="leading-relaxed">{d}</li>)}
      </ol>

      {/* ╔══════════════════════════════════════════════╗
          ║ SEKSI A — RINCIAN PENETAPAN PRODUK/JASA      ║
          ╚══════════════════════════════════════════════╝ */}
      <SectionTitle letter="A">
        Hasil Rincian Penetapan {tpl.jenisPengadaan} melalui e-Purchasing
      </SectionTitle>
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr>
            <td className={`${TH} w-5`}>No</td>
            <td className={TH}>Nama {tpl.jenisPengadaan}</td>
            <td className={`${TH} w-10`}>Vol</td>
            <td className={TH}>Penyedia</td>
            <td className={`${TH} text-right`}>Harga DPA</td>
            <td className={`${TH} text-right`}>Harga Tayang</td>
            <td className={`${TH} text-right`}>Harga Negosiasi</td>
            {extraCols.map(c => <td key={c.key} className={`${TH}`}>{c.label}</td>)}
            <td className={`${TH} text-right`}>Total</td>
            <td className={`${TH} w-14`}>Status</td>
          </tr>
        </thead>
        <tbody>
          {activeItems.length === 0 ? (
            <tr><td colSpan={9 + extraCols.length} className={`${TD} text-center italic text-black`}>
              Belum ada item yang diproses
            </td></tr>
          ) : activeItems.map((item, idx) => {
            const nego    = negotiatedItems[item.no] || {};
            const dpaPrice = parseFloat(item.paguDpa ?? item.price ?? 0);
            const tayang  = parseFloat(nego.tayang  ?? item.tayang ?? item.price ?? 0);
            const negoVal = parseFloat(nego.price   ?? 0);
            const vendor  = nego.vendor || item.vendor || item.dppVendor || '-';
            const total   = negoVal * (item.qty || 1);
            const status  = nego.itemStatus || 'Tersedia';
            return (
              <tr key={item.no} className={idx % 2 === 0 ? 'bg-white' : ''}>
                <td className={`${TD} text-center`}>{idx + 1}</td>
                <td className={TD}>{item.name}</td>
                <td className={`${TD} text-center`}>{item.qty} {item.unit}</td>
                <td className={TD}>{vendor}</td>
                <td className={`${TD} text-right font-mono`}>Rp {dpaPrice.toLocaleString('id-ID')}</td>
                <td className={`${TD} text-right font-mono`}>Rp {tayang.toLocaleString('id-ID')}</td>
                <td className={`${TD} text-right font-mono font-bold`}>Rp {negoVal.toLocaleString('id-ID')}</td>
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
            <tr className="bg-gray-50 font-bold ">
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
          <p className=" text-[0.95em] text-justify leading-relaxed whitespace-pre-line mb-4">
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
      <p className=" text-[0.95em] mb-3 leading-relaxed">
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
          <div key={item.no} className="mb-5 ">
            <div className="text-[0.95em] font-bold mb-1">
              {itemIdx + 1}. {templateId === 'konstruksi' ? 'Evaluasi Penyedia' : 'Komparasi'}:{' '}
              {item.name}
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <td className={`${TH} w-32 text-left`}>Kriteria Evaluasi</td>
                  {allCols.map((col, ci) => (
                    <td key={ci} className={`${TH} ${ci === 0 ? 'bg-gray-100' : ''}`}>
                      {col.name.length > 30 ? col.name.slice(0, 30) + '…' : col.name}
                      {ci === 0 && <div className="text-[0.75em] font-bold text-black mt-0.5">(TERPILIH)</div>}
                      {ci > 0 && <div className="text-[0.75em] font-normal text-black mt-0.5">(Pembanding {ci})</div>}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kriteria.map((krit, ki) => (
                  <tr key={ki} className={ki % 2 === 0 ? '' : ''}>
                    <td className={`${TD} font-semibold bg-gray-50 text-left`}>{krit.label}</td>
                    {allCols.map((col, ci) => {
                      const isSelected = ci === 0;
                      const val = resolveCritVal(krit.key, col, isSelected);
                      return (
                        <td key={ci} className={`${TD} text-center ${isSelected ? 'font-bold' : 'text-black'}`}>
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

      {/* ─── DETAIL SPESIFIK JENIS PENGADAAN (DOKUMEN BAHP) ─── */}

      {/* Jasa Konsultansi (Non-Konstruksi & Konstruksi) */}
      {['konsultasi_non', 'konsultasi_konstruksi'].includes(templateId) && (
        <div className="mb-5">
          <SectionTitle>Struktur Biaya & Tenaga Ahli Utama</SectionTitle>
          <div className="mb-3 text-[0.95em]">
            <table className="w-full border-collapse mb-3">
              <thead>
                <tr>
                  <td className={TH}>Biaya Personil (Billing Rate)</td>
                  <td className={TH}>Biaya Non-Personil (Reimbursable)</td>
                  <td className={TH}>Total Biaya Jasa Konsultansi</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`${TD} text-center font-mono`}>Rp {biayaPersonil.toLocaleString('id-ID')}</td>
                  <td className={`${TD} text-center font-mono`}>Rp {biayaNonPersonil.toLocaleString('id-ID')}</td>
                  <td className={`${TD} text-center font-mono font-bold bg-gray-50`}>Rp {(biayaPersonil + biayaNonPersonil).toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-[0.95em] font-bold mb-1">Daftar Tenaga Ahli yang Ditugaskan:</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <td className={`${TH} w-8`}>No</td>
                <td className={TH}>Nama Lengkap</td>
                <td className={TH}>Posisi / Peran</td>
                <td className={TH}>{templateId === 'konsultasi_konstruksi' ? 'Sertifikat (SKA/SKK)' : 'Sertifikat Kompetensi'}</td>
                <td className={`${TH} w-20`}>Man-Month</td>
                <td className={`${TH} text-right`}>Tarif / Bulan</td>
                <td className={`${TH} text-right`}>Total</td>
              </tr>
            </thead>
            <tbody>
              {tenagaAhliList.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`${TD} text-center italic`}>Tidak ada rincian tenaga ahli yang diinputkan</td>
                </tr>
              ) : (
                tenagaAhliList.map((ahli, aIdx) => {
                  const mm = parseFloat(ahli.manMonth) || 0;
                  const rate = parseFloat(ahli.rate) || 0;
                  const total = mm * rate;
                  return (
                    <tr key={aIdx}>
                      <td className={`${TD} text-center`}>{aIdx + 1}</td>
                      <td className={TD}>{ahli.nama || '-'}</td>
                      <td className={TD}>{ahli.posisi || '-'}</td>
                      <td className={`${TD} text-center`}>{ahli.sertifikat || '-'}</td>
                      <td className={`${TD} text-center`}>{mm} MM</td>
                      <td className={`${TD} text-right font-mono`}>Rp {rate.toLocaleString('id-ID')}</td>
                      <td className={`${TD} text-right font-mono font-bold`}>Rp {total.toLocaleString('id-ID')}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pengadaan Terkonsolidasi */}
      {templateId === 'konsolidasi' && (
        <div className="mb-5">
          <SectionTitle>Daftar Satuan Kerja Peserta Konsolidasi</SectionTitle>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <td className={`${TH} w-8`}>No</td>
                <td className={TH}>Nama Satker / SKPD</td>
                <td className={`${TH} text-right`}>Pagu Anggaran</td>
                <td className={`${TH} w-24`}>Volume Kebutuhan</td>
                <td className={TH}>Alamat Pengiriman</td>
              </tr>
            </thead>
            <tbody>
              {satkerPesertaList.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`${TD} text-center italic`}>Tidak ada rincian satker peserta yang diinputkan</td>
                </tr>
              ) : (
                satkerPesertaList.map((satker, sIdx) => (
                  <tr key={sIdx}>
                    <td className={`${TD} text-center`}>{sIdx + 1}</td>
                    <td className={TD}>{satker.namaSatker || '-'}</td>
                    <td className={`${TD} text-right font-mono`}>Rp {(parseFloat(satker.pagu) || 0).toLocaleString('id-ID')}</td>
                    <td className={`${TD} text-center`}>{satker.volume || '-'}</td>
                    <td className={TD}>{satker.alamat || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pekerjaan Konstruksi */}
      {templateId === 'konstruksi' && (koordinatLokasi || personilK3 || metodeKerja) && (
        <div className="border border-black rounded p-3 mb-4 text-[0.95em]">
          <div className="font-bold mb-2 uppercase text-black">Detail Spesifikasi Fisik & SMKK</div>
          <table className="w-full text-[0.9em] border-collapse">
            <tbody>
              {koordinatLokasi && (
                <tr>
                  <td className="w-48 py-1 font-semibold align-top">Koordinat Lokasi Pekerjaan</td>
                  <td className="w-3 py-1 align-top">:</td>
                  <td className="py-1 align-top">{koordinatLokasi}</td>
                </tr>
              )}
              {personilK3 && (
                <tr>
                  <td className="py-1 font-semibold align-top">Tenaga Ahli / Petugas K3 SMKK</td>
                  <td className="py-1 align-top">:</td>
                  <td className="py-1 align-top">{personilK3}</td>
                </tr>
              )}
              {metodeKerja && (
                <tr>
                  <td className="py-1 font-semibold align-top">Metode Pelaksanaan Utama</td>
                  <td className="py-1 align-top">:</td>
                  <td className="py-1 align-top">{metodeKerja}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Belanja Modal */}
      {templateId === 'modal' && (merkTipeModal || nilaiTkdnModal || noSeriModal) && (
        <div className="border border-black rounded p-3 mb-4 text-[0.95em]">
          <div className="font-bold mb-2 uppercase text-black">Spesifikasi Aset & Catatan Inventarisasi</div>
          <table className="w-full text-[0.9em] border-collapse">
            <tbody>
              {merkTipeModal && (
                <tr>
                  <td className="w-48 py-1 font-semibold align-top">Merek / Tipe Barang</td>
                  <td className="w-3 py-1 align-top">:</td>
                  <td className="py-1 align-top">{merkTipeModal}</td>
                </tr>
              )}
              {nilaiTkdnModal && (
                <tr>
                  <td className="py-1 font-semibold align-top">Nilai Komponen Dalam Negeri</td>
                  <td className="py-1 align-top">:</td>
                  <td className="py-1 align-top">{nilaiTkdnModal}% (Tingkat Komponen Dalam Negeri / TKDN)</td>
                </tr>
              )}
              {noSeriModal && (
                <tr>
                  <td className="py-1 font-semibold align-top">Nomor Seri Aset / Pabrikan</td>
                  <td className="py-1 align-top">:</td>
                  <td className="py-1 align-top">{noSeriModal}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ╔══════════════════════════════════════════════╗
          ║ CATATAN KHUSUS KONSTRUKSI                    ║
          ╚══════════════════════════════════════════════╝ */}
      {templateId === 'konstruksi' && (
        <div className=" border border-black rounded p-3 mb-4 text-[0.95em]">
          <div className="font-bold mb-1 uppercase text-black">Catatan K3 Konstruksi (SMKK)</div>
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
          ║ SEKSI D — REKOMENDASI PROSEDUR PEMILIHAN     ║
          ╚══════════════════════════════════════════════╝ */}
      {REKOMENDASI_PP_PPK[templateId] && (
        <>
          <SectionTitle letter="D">{REKOMENDASI_PP_PPK[templateId].judul}</SectionTitle>
          <p className="text-[0.95em] text-justify leading-relaxed whitespace-pre-line mb-4">
            {REKOMENDASI_PP_PPK[templateId].isi}
          </p>
        </>
      )}

      {/* ╔══════════════════════════════════════════════╗
          ║ SEKSI E — KESIMPULAN & PENETAPAN             ║
          ╚══════════════════════════════════════════════╝ */}
      <SectionTitle letter="E">Kesimpulan dan Penetapan Penyedia</SectionTitle>
      <p className=" text-[0.95em] text-justify leading-relaxed whitespace-pre-line mb-3">
        {refinedBahpConclusion || penutup}
      </p>
      <p className=" text-[0.95em] text-justify leading-relaxed mb-6">
        Demikian Berita Acara Hasil Pemilihan (BAHP) e-Purchasing ini dibuat dengan sebenarnya,
        untuk dipergunakan sebagaimana mestinya sebagai dokumen pertanggungjawaban pelaksanaan
        pengadaan barang/jasa pemerintah sesuai ketentuan peraturan perundang-undangan yang berlaku.
      </p>

      {/* ╔══════════════════════════════════════════════╗
          ║ TANDA TANGAN                                 ║
          ╚══════════════════════════════════════════════╝ */}
      <div className="flex justify-between mt-8 ">
        {/* Tanda Tangan PPK (Kiri) */}
        <div className="w-64 text-center">
          <div className="text-[0.95em] text-black mb-0.5">&nbsp;</div>
          <div className="text-[0.95em] text-black mb-2 flex flex-col items-center">
            <span>Menyetujui,</span>
            <span>Pejabat Pembuat Komitmen (PPK)</span>
            {docSettings.signatureMethodPpk === 'tte' ? (
              <div className="flex justify-center my-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="220" height="90" viewBox="0 0 220 90" style={{ border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
                  <rect x="0" y="0" width="220" height="90" fill="#f8fafc" rx="6" />
                  <rect x="10" y="10" width="70" height="70" fill="white" stroke="#334155" strokeWidth="1.5" />
                  <path d="M15 15h10v10H15zm0 15h10v10H15zm15-15h10v10H30zm0 15h10v10H30zm15-15h10v10H45zm0 15h10v10H45zm15 0h10v10H60zm0-15h10v10H60z" fill="#334155" />
                  <path d="M20 20h20v20H20zm25 25h15v15H45z" fill="#000" />
                  <text x="90" y="22" fontSize="7" fontWeight="bold" fill="#0f172a" letterSpacing="0.5">TANDA TANGAN ELEKTRONIK</text>
                  <text x="90" y="32" fontSize="6" fontWeight="bold" fill="#475569">Sertifikat Elektronik Diterbitkan Oleh:</text>
                  <text x="90" y="42" fontSize="7" fontWeight="black" fill="#1e3a8a">BSrE BSSN</text>
                  <line x1="90" y1="48" x2="210" y2="48" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="90" y="58" fontSize="6.5" fontWeight="bold" fill="#0f172a">PEJABAT PEMBUAT KOMITMEN</text>
                  <text x="90" y="68" fontSize="6" fill="#475569">NIP: .......................................</text>
                  <text x="90" y="78" fontSize="5" fontWeight="bold" fill="#16a34a">✓ VERIFIED &amp; SECURED BY BSSN</text>
                </svg>
              </div>
            ) : (
              docSettings.ttdPpk ? (
                <img 
                  src={docSettings.ttdPpk} 
                  alt="TTD Pejabat Pembuat Komitmen" 
                  style={{ maxHeight: '75px', maxWidth: '200px', width: 'auto', height: 'auto', objectFit: 'contain', mixBlendMode: 'multiply', marginTop: '6px', marginBottom: '4px' }} 
                />
              ) : (
                <div style={{ height: '75px', marginTop: '6px', marginBottom: '4px' }}></div>
              )
            )}
          </div>
          <div className={`text-[1.05em] font-bold text-black underline ${(!docSettings.ttdPpk && docSettings.signatureMethodPpk !== 'tte') ? 'mt-14' : 'mt-2'}`}>
            .......................................................
          </div>
          <div className="text-[0.95em] text-black">NIP. ...............................................</div>
        </div>

        {/* Tanda Tangan PP (Kanan) */}
        <div className="w-64 text-center">
          <div className="text-[0.95em] text-black mb-0.5">{instansi}, {tglShort}</div>
          <div className="text-[0.95em] text-black mb-2 flex flex-col items-center">
            <span>Pejabat Pengadaan (PP)</span>
            <span>{instansi}</span>
            {docSettings.signatureMethodPp === 'tte' ? (
              <div className="flex justify-center my-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="220" height="90" viewBox="0 0 220 90" style={{ border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
                  <rect x="0" y="0" width="220" height="90" fill="#f8fafc" rx="6" />
                  <rect x="10" y="10" width="70" height="70" fill="white" stroke="#334155" strokeWidth="1.5" />
                  <path d="M15 15h10v10H15zm0 15h10v10H15zm15-15h10v10H30zm0 15h10v10H30zm15-15h10v10H45zm0 15h10v10H45zm15 0h10v10H60zm0-15h10v10H60z" fill="#334155" />
                  <path d="M20 20h20v20H20zm25 25h15v15H45z" fill="#000" />
                  <text x="90" y="22" fontSize="7" fontWeight="bold" fill="#0f172a" letterSpacing="0.5">TANDA TANGAN ELEKTRONIK</text>
                  <text x="90" y="32" fontSize="6" fontWeight="bold" fill="#475569">Sertifikat Elektronik Diterbitkan Oleh:</text>
                  <text x="90" y="42" fontSize="7" fontWeight="black" fill="#1e3a8a">BSrE BSSN</text>
                  <line x1="90" y1="48" x2="210" y2="48" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="90" y="58" fontSize="6.5" fontWeight="bold" fill="#0f172a">{user?.name || '-'}</text>
                  <text x="90" y="68" fontSize="6" fill="#475569">NIP: {user?.nip || '-'}</text>
                  <text x="90" y="78" fontSize="5" fontWeight="bold" fill="#16a34a">✓ VERIFIED &amp; SECURED BY BSSN</text>
                </svg>
              </div>
            ) : (
              docSettings.ttdPp && (
                <img 
                  src={docSettings.ttdPp} 
                  alt="TTD Pejabat Pengadaan" 
                  style={{ maxHeight: '75px', maxWidth: '200px', width: 'auto', height: 'auto', objectFit: 'contain', mixBlendMode: 'multiply', marginTop: '6px', marginBottom: '4px' }} 
                />
              )
            )}
          </div>
          <div className={`text-[1.05em] font-bold text-black underline ${(!docSettings.ttdPp && docSettings.signatureMethodPp !== 'tte') ? 'mt-14' : 'mt-2'}`}>{user?.name || '-'}</div>
          <div className="text-[0.95em] text-black">NIP. {user?.nip || '-'}</div>
        </div>
      </div>

      {/* ╔══════════════════════════════════════════════╗
          ║ LAMPIRAN II: BUKTI SCREENSHOT & TAUTAN       ║
          ╚══════════════════════════════════════════════╝ */}
      <div className="mt-10 pt-8 border-t-2 border-dashed border-black print:break-before-page">
        <div className="text-center font-bold uppercase underline text-[1.1em] tracking-wide mb-4 ">
          LAMPIRAN II: BUKTI TANGKAPAN LAYAR (SCREENSHOT) & TAUTAN RESMI E-KATALOG LKPP
        </div>
        <p className=" text-[0.85em] text-black mb-4 text-justify">
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
              <div key={item.no} className="border border-black rounded p-3 bg-white">
                <div className="font-bold text-[0.95em] border-b border-black pb-1 mb-3">
                  {idx + 1}. Bukti Audit Produk Terpilih: <span className="font-normal italic">{item.name}</span>
                </div>

                {/* Selected Product Info & Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <table className="w-full text-[0.85em]">
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
                    <div className="text-[0.85em] font-semibold text-black mb-0.5">Tautan Resmi (E-Katalog):</div>
                    <a 
                      href={selectedUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-700 hover:underline break-all font-mono text-[0.85em]"
                    >
                      {selectedUrl}
                    </a>
                  </div>
                </div>

                {/* Selected Product Screenshot */}
                {selectedScreenshot ? (
                  <div className="border border-black rounded overflow-hidden mb-4 bg-gray-50">
                    <div className="bg-gray-50 border-b border-black px-3 py-1 flex items-center justify-between text-[0.8em] font-mono text-black">
                      <span>{selectedUrl}</span>
                      <span className="">Tangkapan Layar Terpilih</span>
                    </div>
                    <div className="p-2 flex justify-center bg-white">
                      <img 
                        src={selectedScreenshot} 
                        alt={`Screenshot ${item.name}`} 
                        className="max-h-[220px] object-contain border border-black rounded" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-black rounded p-4 text-center text-black italic text-[0.85em] mb-4 bg-gray-50 print:hidden">
                    Tangkapan layar untuk produk terpilih belum diambil (Jalankan "Cari + Pembanding" untuk mengambil screenshot otomatis)
                  </div>
                )}

                {/* Comparators */}
                {autoComps.length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-black">
                    <div className="font-bold text-[0.85em] text-black mb-2">Produk Pembanding:</div>
                    <div className="space-y-4">
                      {autoComps.map((comp, ci) => {
                        const compUrl = comp.link || comp.url || "https://e-katalog.lkpp.go.id";
                        const compScreenshot = comp.screenshotUrl || comp.screenshot || null;

                        return (
                          <div key={ci} className=" p-2 rounded border border-black">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                              <div>
                                <table className="w-full text-[0.85em]">
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
                                <div className="text-[0.85em] font-semibold text-black mb-0.5">Tautan Pembanding:</div>
                                <a 
                                  href={compUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-700 hover:underline break-all font-mono text-[0.8em]"
                                >
                                  {compUrl}
                                </a>
                              </div>
                            </div>

                            {compScreenshot && (
                              <div className="border border-black rounded overflow-hidden bg-white mt-2">
                                <div className="bg-gray-50 border-b border-black px-3 py-1 flex items-center justify-between text-[0.75em] font-mono text-black">
                                  <span>{compUrl}</span>
                                  <span className="">Tangkapan Layar Pembanding {ci + 1}</span>
                                </div>
                                <div className="p-2 flex justify-center">
                                  <img 
                                    src={compScreenshot} 
                                    alt={`Screenshot Pembanding ${ci + 1}`} 
                                    className="max-h-[160px] object-contain border border-black rounded" 
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
    <div className="font-bold text-[1.05em] uppercase border-b border-black pb-0.5 mb-2 mt-5 tracking-wide">
      {letter ? `${letter}. ` : ''}{children}
    </div>
  );
}

// High-fidelity SVG of the Indonesian Garuda Emblem
const LogoGarudaPlaceholder = () => (
  <svg width="65" height="65" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm select-none">
    <path d="M50 8 C58 20 85 24 90 28 C90 45 82 72 50 94 C18 72 10 45 10 28 C15 24 42 20 50 8 Z" fill="#D97706" opacity="0.1" />
    <path d="M50 8 C58 20 85 24 90 28 C90 45 82 72 50 94 C18 72 10 45 10 28 C15 24 42 20 50 8 Z" stroke="#8F5C12" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M50 35 C35 32 18 36 12 44 C16 52 24 58 35 56 C33 62 25 68 20 72 C30 72 38 68 42 60" stroke="#8F5C12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M50 35 C65 32 82 36 88 44 C84 52 76 58 65 56 C67 62 75 68 80 72 C70 72 62 68 58 60" stroke="#8F5C12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M43 62 L43 78 C43 82 50 84 50 84 C50 84 57 82 57 78 L57 62 Z" fill="#8F5C12" opacity="0.2"/>
    <path d="M46 62 V76 M50 62 V80 M54 62 V76" stroke="#8F5C12" strokeWidth="1.8" strokeLinecap="round"/>
    <rect x="42" y="38" width="16" height="20" rx="3" fill="#B91C1C" stroke="#8F5C12" strokeWidth="2" />
    <path d="M42 48 H58" stroke="#8F5C12" strokeWidth="1.5" />
    <path d="M50 38 V58" stroke="#8F5C12" strokeWidth="1.5" />
    <circle cx="50" cy="48" r="3" fill="#D97706" />
    <path d="M50 18 C52 14 55 12 58 14 C58 17 56 20 53 22 Z" fill="#8F5C12" stroke="#8F5C12" strokeWidth="1" />
    <circle cx="53" cy="17" r="1" fill="#FFFFFF" />
  </svg>
);

const formatAlamatKop = (alamat) => {
  if (!alamat) return '';
  let formatted = alamat;
  
  // Replace URL
  const urlRegex = /(https?:\/\/[^\s,]+)/g;
  formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" class="text-blue-600 underline hover:text-blue-800 transition-colors" style="color: #2563eb; text-decoration: underline;">$1</a>');
  
  // Replace Email
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
  formatted = formatted.replace(emailRegex, '<a href="mailto:$1" class="text-blue-600 underline hover:text-blue-800 transition-colors" style="color: #2563eb; text-decoration: underline;">$1</a>');
  
  return formatted;
};

import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    content = f.read()

# 1. Add `incomingPacksList` state
state_insertion = "  const [activeTab, setActiveTab] = useState('incoming')\n"
new_state = "  const [incomingPacksList, setIncomingPacksList] = useState([]);\n"
content = content.replace(state_insertion, state_insertion + new_state)

# 2. Modify the useEffect logic
old_use_effect = """  // Sinkronisasi dengan database backend untuk melihat paket yang "Terkirim ke PP"
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const projects = Array.isArray(data) ? data : (data?.data || []);
        const incomingPack = projects.find(p => p.status === 'Terkirim ke PP');
        if (incomingPack) {
          let parsedData = {};
          try {
            parsedData = JSON.parse(incomingPack.description || '{}');
          } catch(e) {}
          
          const convertedPack = {
            id: incomingPack.id,
            packName: incomingPack.name || parsedData?.selectedPack?.packName || 'Paket Pengadaan',
            pagu: incomingPack.budget || parsedData?.selectedPack?.pagu || 0,
            mak: parsedData?.selectedPack?.mak || '',
            noSirup: parsedData?.selectedPack?.noSirup || '',
            volume: parsedData?.packageMetadata?.volume || '1 Paket',
            spesifikasi: parsedData?.packageMetadata?.spesifikasi || '',
            hpsValue: parsedData?.hpsValue || incomingPack.budget || '',
            techSpecs: parsedData?.techSpecs || '',
            dpaName: parsedData?.dpaName || 'DPA_Document.pdf',
            senderName: parsedData?.currentUser?.name || incomingPack.created_by || 'PPK',
            senderNip: parsedData?.currentUser?.nip || '',
            senderDepartment: parsedData?.currentUser?.department || 'Instansi Terkait',
            sentDate: new Date(incomingPack.updated_at || incomingPack.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            items: [],
            description: incomingPack.description
          };
          
          setSubmittedPack(convertedPack);
          localStorage.setItem('pbj_submitted_package', JSON.stringify(convertedPack));
        }
      })
      .catch(err => console.error('Gagal mengambil data dari database:', err));
  }, []);"""

new_use_effect = """  // Sinkronisasi dengan database backend untuk melihat daftar paket "Terkirim ke PP"
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const projects = Array.isArray(data) ? data : (data?.data || []);
        const incomingPacks = projects.filter(p => p.status === 'Terkirim ke PP');
        setIncomingPacksList(incomingPacks);
      })
      .catch(err => console.error('Gagal mengambil data dari database:', err));
  }, []);

  const selectIncomingPackage = (incomingPack) => {
    let parsedData = {};
    try {
      parsedData = JSON.parse(incomingPack.description || '{}');
    } catch(e) {}
    
    const convertedPack = {
      id: incomingPack.id,
      packName: incomingPack.name || parsedData?.selectedPack?.packName || 'Paket Pengadaan',
      pagu: incomingPack.budget || parsedData?.selectedPack?.pagu || 0,
      mak: parsedData?.selectedPack?.mak || '',
      noSirup: parsedData?.selectedPack?.noSirup || '',
      volume: parsedData?.packageMetadata?.volume || '1 Paket',
      spesifikasi: parsedData?.packageMetadata?.spesifikasi || '',
      hpsValue: parsedData?.hpsValue || incomingPack.budget || '',
      techSpecs: parsedData?.techSpecs || '',
      dpaName: parsedData?.dpaName || 'DPA_Document.pdf',
      senderName: parsedData?.currentUser?.name || incomingPack.created_by || 'PPK',
      senderNip: parsedData?.currentUser?.nip || '',
      senderDepartment: parsedData?.currentUser?.department || 'Instansi Terkait',
      sentDate: new Date(incomingPack.updated_at || incomingPack.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      items: [],
      description: incomingPack.description
    };
    
    setSubmittedPack(convertedPack);
    localStorage.setItem('pbj_submitted_package', JSON.stringify(convertedPack));
  };"""

content = content.replace(old_use_effect, new_use_effect)

# 3. Modify the UI block
old_empty_state = """            <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center max-w-2xl mx-auto mt-4">
              <span className="text-4xl block mb-3">📬</span>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Belum Ada Paket Usulan Real</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">Sistem mendeteksi belum ada paket aktif yang dikirimkan oleh PPK melalui dashboard Persiapan Pengadaan saat ini.</p>
              
              <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-left space-y-2 mb-6">
                <strong>�� Cara Simulasi Alur Penuh (End-to-End):</strong>
                <ol className="list-decimal pl-4 space-y-1 font-mono text-[10px] text-slate-600">
                  <li>Logout dari PP, kemudian login sebagai PPK (NIP: <span className="font-bold">198001012005011001</span>).</li>
                  <li>Upload DPA, sinkronkan SIRUP, pilih paket RUP, tentukan HPS, lakukan TTE, lalu klik **"Kirim DPP ke PP"**.</li>
                  <li>Logout dan login kembali sebagai PP (NIP: <span className="font-bold">198502022010012002</span>). Paket akan muncul di sini secara real-time!</li>
                </ol>
              </div>
              
              <div className="border-t border-slate-200 pt-6">
                <span className="text-xs text-slate-400 block mb-3 uppercase tracking-wider font-bold">Atau Gunakan Paket Contoh (Simulasi)</span>
                <button 
                  onClick={() => {
                    const mockPack = {
                      packName: 'Pengadaan Belanja Modal Alat Kantor Laptop & Printer Dinas',
                      pagu: 10829000,
                      mak: '7.01.01.2.07.0006.5.2.02.10.0002',
                      volume: '1 Unit Laptop, 1 Unit Printer',
                      spesifikasi: 'Laptop Core i3 & Printer EPSON L121',
                      hpsValue: '10829000',
                      techSpecs: 'Laptop dan Printer untuk operasional sekretariat',
                      dpaName: 'DPA TA. 2026 KEC. BESUK-90-95.pdf',
                      senderName: 'Handik Hariyanto, S.Kom., M.Si',
                      senderNip: '197909102002121004',
                      senderDepartment: 'Kantor Kecamatan Besuk',
                      sentDate: '17 Mei 2026'
                    }
                    setSubmittedPack(mockPack)
                    localStorage.setItem('pbj_submitted_package', JSON.stringify(mockPack))
                  }} 
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-6 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm mx-auto"
                >
                  🚀 Muat Paket Simulasi (Dummy)
                </button>
              </div>
            </div>"""

new_empty_state = """            <div>
              {incomingPacksList.length > 0 ? (
                <div className="max-w-4xl mx-auto mt-4">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">📬 Daftar Paket Usulan Masuk</h3>
                      <p className="text-xs text-slate-500">Terdapat <strong className="text-indigo-600">{incomingPacksList.length}</strong> paket dari PPK yang menunggu diproses.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {incomingPacksList.map(pack => {
                      let parsedData = {};
                      try { parsedData = JSON.parse(pack.description || '{}'); } catch(e) {}
                      
                      return (
                        <div key={pack.id} className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="px-2 py-0.5 text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded uppercase tracking-wider">Menunggu Diproses</span>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {pack.id}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-base group-hover:text-indigo-700 transition-colors">{pack.name}</h4>
                            <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                              <span>Pagu: <strong className="text-slate-700 font-mono">Rp {(pack.budget || 0).toLocaleString('id-ID')}</strong></span>
                              <span>•</span>
                              <span>Pengirim: <strong className="text-slate-700">{parsedData?.currentUser?.name || pack.created_by || 'PPK'}</strong></span>
                              <span>•</span>
                              <span>Tgl Kirim: <strong className="text-slate-700">{new Date(pack.updated_at || pack.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                            </div>
                          </div>
                          <button 
                            onClick={() => selectIncomingPackage(pack)} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-[11px] font-bold transition-all shadow-sm whitespace-nowrap flex items-center gap-2"
                          >
                            Proses Paket Ini <span>➔</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center max-w-2xl mx-auto mt-4">
                  <span className="text-4xl block mb-3">📬</span>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Belum Ada Paket Usulan Real</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">Sistem mendeteksi belum ada paket aktif yang dikirimkan oleh PPK melalui dashboard Persiapan Pengadaan saat ini.</p>
                  
                  <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-left space-y-2 mb-6">
                    <strong>💡 Cara Simulasi Alur Penuh (End-to-End):</strong>
                    <ol className="list-decimal pl-4 space-y-1 font-mono text-[10px] text-slate-600">
                      <li>Logout dari PP, kemudian login sebagai PPK (NIP: <span className="font-bold">198001012005011001</span>).</li>
                      <li>Upload DPA, sinkronkan SIRUP, pilih paket RUP, tentukan HPS, lakukan TTE, lalu klik **"Kirim DPP ke PP"**.</li>
                      <li>Logout dan login kembali sebagai PP (NIP: <span className="font-bold">198502022010012002</span>). Paket akan muncul di sini secara real-time!</li>
                    </ol>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-6">
                    <span className="text-xs text-slate-400 block mb-3 uppercase tracking-wider font-bold">Atau Gunakan Paket Contoh (Simulasi)</span>
                    <button 
                      onClick={() => {
                        const mockPack = {
                          packName: 'Pengadaan Belanja Modal Alat Kantor Laptop & Printer Dinas',
                          pagu: 10829000,
                          mak: '7.01.01.2.07.0006.5.2.02.10.0002',
                          volume: '1 Unit Laptop, 1 Unit Printer',
                          spesifikasi: 'Laptop Core i3 & Printer EPSON L121',
                          hpsValue: '10829000',
                          techSpecs: 'Laptop dan Printer untuk operasional sekretariat',
                          dpaName: 'DPA TA. 2026 KEC. BESUK-90-95.pdf',
                          senderName: 'Handik Hariyanto, S.Kom., M.Si',
                          senderNip: '197909102002121004',
                          senderDepartment: 'Kantor Kecamatan Besuk',
                          sentDate: '17 Mei 2026'
                        }
                        setSubmittedPack(mockPack)
                        localStorage.setItem('pbj_submitted_package', JSON.stringify(mockPack))
                      }} 
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-6 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm mx-auto"
                    >
                      🚀 Muat Paket Simulasi (Dummy)
                    </button>
                  </div>
                </div>
              )}
            </div>"""

content = content.replace(old_empty_state, new_empty_state)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(content)

print("Patch applied to PP Inbox.")

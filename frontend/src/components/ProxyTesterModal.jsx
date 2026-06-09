import React, { useState, useEffect } from 'react';

export default function ProxyTesterModal({ isOpen, onClose, onSave }) {
  const [proxyInput, setProxyInput] = useState('');
  const [results, setResults] = useState([]);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedProxy, setSelectedProxy] = useState('');

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('pbj_scraper_proxy');
      if (saved) {
        setSelectedProxy(saved);
        setResults([{ proxy: saved, status: 'saved_locally', latency: '-', code: '-' }]);
      }
    }
  }, [isOpen]);

  const handleTest = async () => {
    const proxies = proxyInput.split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 5);
      
    if (proxies.length === 0) return alert('Masukkan minimal 1 proxy (IP:PORT)');

    setIsTesting(true);
    setResults([]);

    try {
      const res = await fetch('/api/survey/test-proxies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxies })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Gagal menguji proxy');
      
      setResults(data.results || []);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (proxyStr) => {
    localStorage.setItem('pbj_scraper_proxy', proxyStr);
    setSelectedProxy(proxyStr);
    if (onSave) onSave(proxyStr);
    setTimeout(() => onClose(), 500);
  };

  const handleClear = () => {
    localStorage.removeItem('pbj_scraper_proxy');
    setSelectedProxy('');
    if (onSave) onSave('');
    setResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Pengaturan Proxy Scraper</h2>
              <p className="text-xs text-slate-500">Gunakan Proxy untuk melewati blokir WAF LKPP</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Daftar Proxy (IP:PORT)
            </label>
            <textarea
              value={proxyInput}
              onChange={e => setProxyInput(e.target.value)}
              placeholder="Contoh:&#10;206.123.156.224:4042&#10;72.210.252.134:46164"
              className="w-full h-32 p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono bg-slate-50"
              disabled={isTesting}
            />
            <p className="text-[11px] text-slate-500 mt-2">
              Paste maksimal 20 proxy sekaligus. Sistem akan mencoba mengakses E-Katalog menggunakan proxy tersebut.
            </p>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={handleTest}
              disabled={isTesting || !proxyInput.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Sedang Menguji...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 10l2 2 4-4" /></svg> Mulai Uji Proxy</>
              )}
            </button>
            {selectedProxy && (
              <button
                onClick={handleClear}
                className="px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl border border-rose-200 transition-colors"
              >
                Hapus Proxy
              </button>
            )}
          </div>

          {results.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3">Hasil Pengujian</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-slate-600">Proxy</th>
                      <th className="px-4 py-2 font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-2 font-semibold text-slate-600">Latensi</th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((r, i) => (
                      <tr key={i} className={`hover:bg-slate-50 ${selectedProxy === r.proxy ? 'bg-indigo-50/50' : ''}`}>
                        <td className="px-4 py-3 font-mono text-slate-700">{r.proxy}</td>
                        <td className="px-4 py-3">
                          {r.status === 'alive' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">✅ Hidup (Lolols WAF)</span>}
                          {r.status === 'blocked_waf' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700">🛡️ Diblokir WAF</span>}
                          {r.status === 'dead' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-700">❌ Mati / Timeout</span>}
                          {r.status === 'invalid_format' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">Format Salah</span>}
                          {r.status === 'saved_locally' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">Terpasang</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {r.latency !== '-' ? `${r.latency} ms` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(r.status === 'alive' || r.status === 'saved_locally') && (
                            <button
                              onClick={() => handleSave(r.proxy)}
                              disabled={selectedProxy === r.proxy}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                selectedProxy === r.proxy 
                                  ? 'bg-emerald-500 text-white cursor-default'
                                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                              }`}
                            >
                              {selectedProxy === r.proxy ? 'Terpilih' : 'Gunakan'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';

const BATCH_SIZE = 10; // 10 proxy per request ke backend

export default function ProxyTester() {
  const [proxyInput, setProxyInput] = useState('');
  const [results, setResults] = useState([]);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedProxy, setSelectedProxy] = useState('');
  const [parsedCount, setParsedCount] = useState(0);
  const [progress, setProgress] = useState({ current: 0, total: 0, batch: 0 });
  const abortRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('pbj_scraper_proxy');
    if (saved) setSelectedProxy(saved);
  }, []);

  // Parse: support IP:PORT, IP:PORT:USER:PASS, and WebShare copy-paste
  const extractProxies = (text) => {
    const seen = new Set();
    const valid = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Regex mengizinkan opsional prefix socks://, socks5://, atau http://
      const match = line.match(/^(?:(?:socks[45]?|https?):\/\/)?(\d{1,3}(?:\.\d{1,3}){3}):(\d{2,5})(?::([^:\s]+):([^:\s]+))?/);
      
      if (match) {
        let p = line.includes('socks') ? `socks5://${match[1]}:${match[2]}` : `${match[1]}:${match[2]}`;
        
        if (match[3] && match[4]) {
          p += `:${match[3]}:${match[4]}`; // Inline auth
        } else {
          // Deteksi copy-paste dari tabel Webshare (baris 1: IP:PORT, baris 2: Username, baris 3: Password)
          if (i + 2 < lines.length && !lines[i+1].includes(' ') && !lines[i+2].includes(' ')) {
             if (lines[i+1] !== 'Working' && lines[i+2] !== 'Working' && lines[i+1].length > 4) {
               p += `:${lines[i+1]}:${lines[i+2]}`;
               i += 2; // skip username dan password line
             }
          }
        }

        if (!seen.has(p)) { seen.add(p); valid.push(p); }
      }
    }
    return valid;
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setProxyInput(val);
    setParsedCount(extractProxies(val).length);
  };

  const handleTest = async () => {
    const proxies = extractProxies(proxyInput);
    if (proxies.length === 0) return alert('Tidak ada proxy IP:PORT yang valid.\nPastikan format setiap baris dimulai dengan angka IP:PORT');

    abortRef.current = false;
    setIsTesting(true);
    setResults([]);

    const totalBatches = Math.ceil(proxies.length / BATCH_SIZE);
    setProgress({ current: 0, total: proxies.length, batch: 0 });

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      if (abortRef.current) break;

      const batchProxies = proxies.slice(batchIdx * BATCH_SIZE, (batchIdx + 1) * BATCH_SIZE);
      setProgress({ current: batchIdx * BATCH_SIZE, total: proxies.length, batch: batchIdx + 1 });

      try {
        const res = await fetch('/api/survey/test-proxies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proxies: batchProxies })
        });

        if (!res.ok) {
          if (res.status === 504 || res.status === 502 || res.status === 503) {
            // Batch ini timeout — tandai semua sebagai dead dan lanjut
            const fallback = batchProxies.map(p => {
              const [ip, port] = p.split(':');
              return { proxy: p, ip, port, status: 'dead', level: '-', speed: '-', country: '--', https: false, inaproc: false, latency: null };
            });
            setResults(prev => {
              const merged = [...prev, ...fallback];
              return sortResults(merged);
            });
            continue;
          }
          throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();
        if (data.results) {
          setResults(prev => {
            const merged = [...prev, ...data.results];
            return sortResults(merged);
          });
        }
      } catch (err) {
        if (err.message.includes('DOCTYPE') || err.message.includes('not valid JSON')) {
          // Backend down, skip batch ini
          const fallback = batchProxies.map(p => {
            const [ip, port] = p.split(':');
            return { proxy: p, ip, port, status: 'dead', level: '-', speed: '-', country: '--', https: false, inaproc: false, latency: null, error: 'server down' };
          });
          setResults(prev => sortResults([...prev, ...fallback]));
        } else {
          console.error('Batch error:', err.message);
        }
      }
    }

    setProgress(p => ({ ...p, current: proxies.length }));
    setIsTesting(false);
  };

  const handleStop = () => {
    abortRef.current = true;
    setIsTesting(false);
  };

  const sortResults = (list) => {
    return [...list].sort((a, b) => {
      const score = (r) => {
        if (r.inaproc && r.status === 'alive') return 4;
        if (r.status === 'alive') return 3;
        if (r.status === 'blocked_waf') return 2;
        if (r.status === 'dead') return 1;
        return 0;
      };
      return score(b) - score(a) || (a.latency || 9999) - (b.latency || 9999);
    });
  };

  const handleSave = (proxy) => {
    localStorage.setItem('pbj_scraper_proxy', proxy);
    setSelectedProxy(proxy);
    alert(`✅ Proxy ${proxy} tersimpan!\nAkan digunakan otomatis saat Survei HPS.`);
  };

  const handleClear = () => {
    localStorage.removeItem('pbj_scraper_proxy');
    setSelectedProxy('');
    alert('Proxy aktif telah dihapus.');
  };

  const statusBadge = (r) => {
    if (r.status === 'alive') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> Hidup
      </span>
    );
    if (r.status === 'blocked_waf') return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span> WAF
      </span>
    );
    if (r.status === 'invalid') return (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-400">Invalid</span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-600 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span> Mati
      </span>
    );
  };

  const speedBadge = (speed, latency) => {
    const ms = latency ? `${latency}ms` : '';
    if (speed === 'fast') return <span className="text-emerald-600 font-semibold text-xs">⚡ fast {ms && <span className="text-slate-400 font-normal">{ms}</span>}</span>;
    if (speed === 'medium') return <span className="text-amber-600 font-semibold text-xs">🔶 medium {ms && <span className="text-slate-400 font-normal">{ms}</span>}</span>;
    if (speed === 'slow') return <span className="text-rose-500 font-semibold text-xs">🐢 slow {ms && <span className="text-slate-400 font-normal">{ms}</span>}</span>;
    return <span className="text-slate-300 text-xs">—</span>;
  };

  const rowIcon = (r) => {
    if (r.inaproc && r.status === 'alive') return (
      <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>
    );
    if (r.status === 'alive') return (
      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </div>
    );
    if (r.status === 'blocked_waf') return (
      <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
        <span className="text-white text-[9px] font-black">!</span>
      </div>
    );
    return (
      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </div>
    );
  };

  const progressPct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const aliveCount = results.filter(r => r.status === 'alive').length;
  const inaprocCount = results.filter(r => r.inaproc).length;
  const totalBatches = Math.ceil(parsedCount / BATCH_SIZE);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-slate-50 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Pengaturan Proxy Scraper</h1>
              <p className="text-xs text-slate-500 mt-0.5">Uji proxy &amp; temukan yang terbaik untuk menembus INAPROC / E-Katalog LKPP</p>
            </div>
          </div>
          {selectedProxy && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-emerald-700">Proxy Aktif: <code className="font-mono">{selectedProxy}</code></span>
              <button onClick={handleClear} className="text-rose-400 hover:text-rose-600 ml-2 text-xs font-bold">✕</button>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* INPUT */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-700">
                Daftar Proxy <span className="text-slate-400 font-normal">(paste bebas dari website proxy list — berapapun banyaknya)</span>
              </label>
              {parsedCount > 0 && (
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                  {parsedCount} proxy · {totalBatches} batch
                </span>
              )}
            </div>
            <textarea
              value={proxyInput}
              onChange={handleInputChange}
              placeholder={"Paste bebas dari website proxy list:\n\n170.239.207.241:999 CO-N-SI +\n173.10.255.168:8080 US fast Level1\n52.53.222.225:8083\nSocks proxy=...\n\n✅ Teks non-IP diabaikan otomatis\n✅ Semua proxy diproses bertahap (10 per batch)"}
              className="w-full h-44 p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono bg-slate-50 resize-none"
              disabled={isTesting}
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              💡 Tidak ada batasan jumlah proxy. Sistem akan menguji <strong>{BATCH_SIZE} proxy per batch</strong> secara berurutan agar tidak timeout.
            </p>
          </div>

          {/* TOMBOL */}
          <div className="flex gap-3 mb-6">
            {!isTesting ? (
              <button
                onClick={handleTest}
                disabled={parsedCount === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Mulai Uji {parsedCount} Proxy ({totalBatches} batch × {BATCH_SIZE})
              </button>
            ) : (
              <>
                <div className="flex-1 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin shrink-0"/>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-indigo-700 mb-1">
                      Batch {progress.batch}/{totalBatches} — Menguji {progress.current}–{Math.min(progress.current + BATCH_SIZE, progress.total)} dari {progress.total} proxy...
                    </div>
                    <div className="w-full bg-indigo-100 rounded-full h-1.5">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-black text-indigo-600">{progressPct}%</span>
                </div>
                <button
                  onClick={handleStop}
                  className="px-5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl border border-rose-200 transition-colors text-sm"
                >
                  ⏹ Stop
                </button>
              </>
            )}
          </div>

          {/* SUMMARY STATS */}
          {results.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-emerald-600">{aliveCount}</div>
                <div className="text-[11px] font-semibold text-emerald-700">Proxy Hidup</div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-indigo-600">{inaprocCount}</div>
                <div className="text-[11px] font-semibold text-indigo-700">Tembus INAPROC 🎯</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-amber-600">{results.filter(r => r.status === 'blocked_waf').length}</div>
                <div className="text-[11px] font-semibold text-amber-700">Diblokir WAF</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-slate-600">{results.length}</div>
                <div className="text-[11px] font-semibold text-slate-600">Sudah Diuji</div>
              </div>
            </div>
          )}

          {/* TABEL HASIL */}
          {results.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Hasil Pengujian</span>
                {isTesting && (
                  <span className="text-xs text-indigo-500 font-medium animate-pulse">● Memperbarui real-time...</span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      <th className="px-3 py-3 w-8"></th>
                      <th className="px-3 py-3">Proxy (IP)</th>
                      <th className="px-3 py-3">Port</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Level</th>
                      <th className="px-3 py-3">Speed</th>
                      <th className="px-3 py-3 text-center">HTTPS</th>
                      <th className="px-3 py-3 text-center text-indigo-600">INAPROC 🎯</th>
                      <th className="px-3 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((r, i) => {
                      const isBest = r.inaproc && r.status === 'alive';
                      const isActive = selectedProxy === r.proxy;
                      return (
                        <tr
                          key={i}
                          className={`transition-colors ${isBest ? 'bg-indigo-50/60 hover:bg-indigo-50' : isActive ? 'bg-emerald-50/60' : 'hover:bg-slate-50/80'}`}
                        >
                          <td className="px-3 py-2.5">{rowIcon(r)}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-700 text-xs">
                            {r.ip}
                            {isBest && <span className="ml-1.5 text-[9px] font-black text-white bg-indigo-500 px-1.5 py-0.5 rounded uppercase">Best</span>}
                            {isActive && <span className="ml-1.5 text-[9px] font-black text-white bg-emerald-500 px-1.5 py-0.5 rounded uppercase">Aktif</span>}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-400 text-xs">{r.port}</td>
                          <td className="px-3 py-2.5">{statusBadge(r)}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-500">{r.level || '—'}</td>
                          <td className="px-3 py-2.5">{speedBadge(r.speed, r.latency)}</td>
                          <td className="px-3 py-2.5 text-center text-sm">
                            {r.https ? <span className="text-emerald-500 font-bold">✓</span> : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {r.inaproc
                              ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black shadow-sm shadow-indigo-200">✓</span>
                              : <span className="text-slate-200">—</span>
                            }
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {r.status === 'alive' && (
                              <button
                                onClick={() => handleSave(r.proxy)}
                                disabled={isActive}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isActive ? 'bg-emerald-500 text-white cursor-default' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md hover:shadow-indigo-200'
                                }`}
                              >
                                {isActive ? '✓ Aktif' : 'Gunakan'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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

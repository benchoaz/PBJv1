import { useState, useEffect } from 'react'

const PROBOLINGGO_SATKERS = [
  { name: "Unit Kerja Pengadaan Barang/Jasa (UKPBJ)", idSatker: "308386" },
  { name: "Bagian Pengadaan Barang dan Jasa (BPBJ)", idSatker: "308386" },
  { name: "Kecamatan Besuk", idSatker: "67081" },
  { name: "Kecamatan Kraksaan", idSatker: "67082" },
  { name: "Kecamatan Dringu", idSatker: "67083" },
  { name: "Kecamatan Paiton", idSatker: "67084" },
  { name: "Kecamatan Gending", idSatker: "67085" },
  { name: "Kecamatan Banyuanyar", idSatker: "67086" },
  { name: "Kecamatan Maron", idSatker: "67087" },
  { name: "Kecamatan Leces", idSatker: "67088" },
  { name: "Kecamatan Tongas", idSatker: "67089" },
  { name: "Kecamatan Sumberasih", idSatker: "67090" },
  { name: "Kecamatan Wonomerto", idSatker: "67091" },
  { name: "Kecamatan Kuripan", idSatker: "67092" },
  { name: "Kecamatan Bantaran", idSatker: "67093" },
  { name: "Kecamatan Sukapura", idSatker: "67094" },
  { name: "Kecamatan Sumber", idSatker: "67095" },
  { name: "Kecamatan Tegalsiwalan", idSatker: "67096" },
  { name: "Kecamatan Gading", idSatker: "67097" },
  { name: "Kecamatan Pakuniran", idSatker: "67098" },
  { name: "Kecamatan Kotaanyar", idSatker: "67099" },
  { name: "Kecamatan Pajarakan", idSatker: "67100" },
  { name: "Kecamatan Tiris", idSatker: "67101" },
  { name: "Kecamatan Krucil", idSatker: "67102" },
  { name: "Dinas Kesehatan", idSatker: "67001" },
  { name: "Dinas Pekerjaan Umum & Penataan Ruang (PUPR)", idSatker: "67002" },
  { name: "Dinas Pendidikan dan Kebudayaan", idSatker: "67003" },
  { name: "Dinas Lingkungan Hidup (DLH)", idSatker: "67004" },
  { name: "RSUD Waluyo Jati Kraksaan (BLU)", idSatker: "67005" },
  { name: "Dinas Koperasi, Usaha Mikro, Perdagangan dan Perindustrian", idSatker: "67006" },
  { name: "Badan Perencanaan Pembangunan, Penelitian dan Pengembangan Daerah (Bapelitbangda)", idSatker: "67007" },
  { name: "Badan Pengelolaan Keuangan dan Pendapatan Daerah (BPKPD)", idSatker: "67008" },
  { name: "Dinas Perhubungan", idSatker: "67009" },
  { name: "Dinas Pertanian dan Ketahanan Pangan", idSatker: "67010" },
  { name: "Dinas Sosial", idSatker: "67011" },
  { name: "Dinas Pemberdayaan Masyarakat dan Desa (DPMD)", idSatker: "67012" },
  { name: "Satuan Polisi Pamong Praja (Satpol PP)", idSatker: "67013" },
  { name: "Dinas Pariwisata dan Kebudayaan", idSatker: "67014" },
  { name: "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP)", idSatker: "67015" },
  { name: "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM)", idSatker: "67016" },
  { name: "Dinas Komunikasi, Informatika, Statistik dan Persandian", idSatker: "67017" },
  { name: "Dinas Perpustakaan dan Kearsipan", idSatker: "67018" },
  { name: "Dinas Ketahanan Pangan", idSatker: "67019" },
  { name: "Dinas Perikanan", idSatker: "67020" },
  { name: "Dinas Perindustrian dan Perdagangan", idSatker: "67021" },
  { name: "Badan Penanggulangan Bencana Daerah (BPBD)", idSatker: "67022" },
  { name: "Badan Kesatuan Bangsa dan Politik (Bakesbangpol)", idSatker: "67023" },
  { name: "RSUD Tongas", idSatker: "67024" },
  { name: "Sekretariat Daerah", idSatker: "67025" },
  { name: "Sekretariat DPRD", idSatker: "67026" },
  { name: "Inspektorat Daerah", idSatker: "67027" }
];

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentEditUser, setCurrentEditUser] = useState(null)
  
  // Form states
  const [name, setName] = useState('')
  const [role, setRole] = useState('PPK')
  const [nip, setNip] = useState('')
  const [perangkatDaerah, setPerangkatDaerah] = useState('Pemerintah Daerah Kabupaten Probolinggo')
  const [department, setDepartment] = useState('')
  const [idSatker, setIdSatker] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data || [])
      }
    } catch (e) {
      console.error("Failed to fetch users", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Open modal for Adding
  const handleAddClick = () => {
    setCurrentEditUser(null)
    setName('')
    setRole('PPK')
    setNip('')
    setPerangkatDaerah('Pemerintah Daerah Kabupaten Probolinggo')
    setDepartment('')
    setIdSatker('')
    setPassword('')
    setShowPassword(false)
    setIsModalOpen(true)
  }

  // Open modal for Editing
  const handleEditClick = (user) => {
    setCurrentEditUser(user)
    setName(user.name)
    setRole(user.role)
    setNip(user.nip)
    setPerangkatDaerah(user.perangkatDaerah || 'Pemerintah Daerah Kabupaten Probolinggo')
    setDepartment(user.department)
    setIdSatker(user.idSatker || '')
    setPassword('') // Leave blank for edit by default
    setShowPassword(false)
    setIsModalOpen(true)
  }

  // Handle Satker Datalist selection & autofill ID
  const handleSatkerChange = (val) => {
    setDepartment(val);
    const matched = PROBOLINGGO_SATKERS.find(s => s.name.toLowerCase() === val.trim().toLowerCase());
    if (matched) {
      setIdSatker(matched.idSatker);
    }
  };

  // Save (Add or Update) handler
  const handleSave = async (e) => {
    e.preventDefault()
    
    if (!name.trim() || !nip.trim() || !department.trim() || !idSatker.trim() || !perangkatDaerah.trim()) {
      alert('Semua data wajib diisi, termasuk ID Satker dan Perangkat Daerah!')
      return
    }

    if (!currentEditUser && !password.trim()) {
      alert('Password wajib diisi untuk pengguna baru!')
      return
    }

    try {
      if (currentEditUser) {
        // Update existing user
        const payload = {
          name, 
          role, 
          nip, 
          perangkatDaerah,
          department,
          idSatker,
        }
        if (password.trim()) {
          payload.password = password.trim()
        }

        const res = await fetch(`/api/users/${currentEditUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          fetchUsers()
        } else {
          alert('Gagal mengupdate pengguna')
        }
      } else {
        // Create new user
        const payload = {
          name,
          role,
          nip,
          perangkatDaerah,
          department,
          idSatker,
          password: password.trim()
        }
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          fetchUsers()
        } else {
          alert('Gagal menambahkan pengguna baru')
        }
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan jaringan')
    }
  }

  // Delete handler
  const handleDelete = async (id, userName) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}"?`)) {
      try {
        const res = await fetch(`/api/users/${id}`, {
          method: 'DELETE'
        })
        if (res.ok) {
          fetchUsers()
        } else {
          alert('Gagal menghapus pengguna')
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <div className="animate-fade-in pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
          <p className="text-slate-400 mt-1">Kelola hak akses pengguna (PPK, PP, KPA, Admin) untuk otorisasi dokumen pengadaan.</p>
        </div>
        <button onClick={handleAddClick} className="btn-primary text-sm flex items-center gap-2">
          <span>➕</span> Tambah Pengguna
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-panel overflow-hidden animate-slide-up">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Nama & NIP</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Peran (Role)</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Instansi/Dinas</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                  Tidak ada data pengguna ditemukan. Klik "+ Tambah Pengguna" untuk menambahkan.
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-200">{user.name}</div>
                    <div className="text-xs text-slate-400 font-mono">NIP: {user.nip}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs rounded-full border ${
                      user.role === 'PPK' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                      user.role === 'PP' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      user.role === 'KPA' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate" title={user.department}>
                    {user.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    <button 
                      onClick={() => handleEditClick(user)}
                      className="text-indigo-400 hover:text-indigo-300 mr-4 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id, user.name)}
                      className="text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Glassmorphic Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="glass-panel p-8 max-w-md w-full mx-4 animate-slide-up border border-white/20 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-6">
              {currentEditUser ? '📝 Edit Data Pengguna' : '👤 Tambah Pengguna Baru'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-5" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Masukkan nama lengkap..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">NIP (Nomor Induk Pegawai)</label>
                <input 
                  type="text" 
                  className="glass-input font-mono" 
                  value={nip} 
                  onChange={e => setNip(e.target.value)} 
                  placeholder="Masukkan NIP pegawai..."
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Peran Sistem (Role)</label>
                <select 
                  className="glass-input" 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="PPK" className="bg-slate-900 text-slate-200">PPK (Pejabat Pembuat Komitmen)</option>
                  <option value="PP" className="bg-slate-900 text-slate-200">PP (Pejabat Pengadaan)</option>
                  <option value="KPA" className="bg-slate-900 text-slate-200">KPA (Kuasa Pengguna Anggaran)</option>
                  <option value="Admin" className="bg-slate-900 text-slate-200">Admin Sistem</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Perangkat Daerah (K/L/PD)</label>
                <input 
                  type="text"
                  className="glass-input font-semibold text-indigo-200 bg-indigo-900/20" 
                  value={perangkatDaerah} 
                  onChange={e => setPerangkatDaerah(e.target.value)} 
                  placeholder="Contoh: Pemerintah Daerah Kabupaten Probolinggo"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Instansi / Satuan Kerja (Dinas)</label>
                <input 
                  type="text"
                  list="satker-list"
                  className="glass-input" 
                  value={department} 
                  onChange={e => handleSatkerChange(e.target.value)} 
                  placeholder="Pilih atau cari Satuan Kerja (Contoh: Kecamatan Besuk)"
                  required
                />
                <datalist id="satker-list">
                  {PROBOLINGGO_SATKERS.map((s, idx) => (
                    <option key={idx} value={s.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>🎯 ID Satker SIRUP Asli</span>
                </label>
                <input 
                  type="text"
                  className="glass-input font-mono text-amber-200 bg-amber-900/20 border-amber-500/30" 
                  value={idSatker} 
                  onChange={e => setIdSatker(e.target.value)} 
                  placeholder="Masukkan ID angka dari SIRUP (Contoh: 308386)"
                  autoComplete="off"
                  required
                />
                <div className="text-[10px] text-slate-400 mt-1.5 font-medium italic">
                  *Sistem akan menggunakan ID ini untuk menarik data paket dari portal SIRUP secara langsung.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {currentEditUser ? '🔒 Reset / Ubah Password' : '🔒 Password Akses'}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="glass-input pr-10" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder={currentEditUser ? 'Kosongkan jika tidak ingin mengubah password' : 'Masukkan password akses...'}
                    autoComplete="new-password"
                    required={!currentEditUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {currentEditUser && (
                  <div className="text-[10px] text-slate-400 mt-1.5 font-medium italic">
                    *Biarkan kolom password kosong jika tidak ingin melakukan reset password.
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary w-full py-2.5"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary w-full py-2.5"
                >
                  {currentEditUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

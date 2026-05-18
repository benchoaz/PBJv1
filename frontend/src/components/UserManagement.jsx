import { useState, useEffect } from 'react'

const satkerOptions = [
  "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM)",
  "Badan Kesatuan Bangsa dan Politik (Bakesbangpol)",
  "Badan Penanggulangan Bencana Daerah (BPBD)",
  "Badan Pengelolaan Pendapatan, Keuangan dan Aset Daerah (BPPKAD)",
  "Badan Perencanaan, Penelitian dan Pengembangan Daerah (Bappeda)",
  "Bagian Administrasi Pembangunan",
  "Bagian Administrasi Pemerintahan",
  "Bagian Hukum",
  "Bagian Kesejahteraan Rakyat",
  "Bagian Organisasi",
  "Bagian Protokol dan Komunikasi Pimpinan",
  "Bagian Pengadaan Barang dan Jasa (BPBJ)",
  "Bagian Umum",
  "Dinas Pekerjaan Umum & Penataan Ruang (PUPR)",
  "Dinas Kesehatan",
  "Dinas Pendidikan dan Kebudayaan",
  "Dinas Sosial, Pemberdayaan Perempuan dan Perlindungan Anak",
  "Dinas Lingkungan Hidup (DLH)",
  "Dinas Kependudukan dan Pencatatan Sipil (Dispendukcapil)",
  "Dinas Pemberdayaan Masyarakat dan Desa (DPMD)",
  "Dinas Perhubungan (Dishub)",
  "Dinas Komunikasi, Informatika, Persandian dan Statistik (Diskominfo)",
  "Dinas Koperasi, Usaha Mikro, Perdagangan dan Perindustrian (DKUPP)",
  "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP)",
  "Dinas Pemuda, Olahraga dan Pariwisata (Dispopar)",
  "Dinas Perpustakaan dan Kearsipan",
  "Dinas Perikanan",
  "Dinas Pertanian dan Ketahanan Pangan",
  "Dinas Tenaga Kerja (Disnaker)",
  "Dinas Ketahanan Pangan",
  "Dinas Perumahan, Kawasan Permukiman dan Pertanahan (DPKPP)",
  "Satuan Polisi Pamong Praja (Satpol PP)",
  "RSUD Waluyo Jati Kraksaan (BLU)",
  "RSUD Tongas (BLU)",
  "Sekretariat Dewan Perwakilan Rakyat Daerah (DPRD)",
  "Sekretariat Daerah",
  "Inspektorat Daerah",
  "Kecamatan Besuk",
  "Kecamatan Kraksaan",
  "Kecamatan Paiton",
  "Kecamatan Gending",
  "Kecamatan Dringu",
  "Kecamatan Leces",
  "Kecamatan Sumberasih",
  "Kecamatan Tongas",
  "Kecamatan Banyuanyar",
  "Kecamatan Maron",
  "Kecamatan Krejengan",
  "Kecamatan Pajarakan",
  "Kecamatan Kotaanyar",
  "Kecamatan Pakuniran",
  "Kecamatan Gading",
  "Kecamatan Krucil",
  "Kecamatan Tiris",
  "Kecamatan Kuripan",
  "Kecamatan Sumber",
  "Kecamatan Wonomerto",
  "Kecamatan Bantaran",
  "Kecamatan Tegalsiwalan",
  "Kecamatan Lumbang",
  "Kecamatan Sukapura",
  "Puskesmas Bago (Kec. Besuk)",
  "Puskesmas Besuk",
  "Puskesmas Kraksaan",
  "Puskesmas Paiton",
  "Puskesmas Gending",
  "Puskesmas Dringu",
  "Puskesmas Leces",
  "Puskesmas Sumberasih",
  "Puskesmas Tongas",
  "Puskesmas Banyuanyar",
  "Puskesmas Maron",
  "Puskesmas Krejengan",
  "Puskesmas Pajarakan",
  "Puskesmas Kotaanyar",
  "Puskesmas Pakuniran",
  "Puskesmas Gading",
  "Puskesmas Krucil",
  "Puskesmas Tiris",
  "Puskesmas Kuripan",
  "Puskesmas Sumber",
  "Puskesmas Wonomerto",
  "Puskesmas Bantaran",
  "Puskesmas Tegalsiwalan",
  "Puskesmas Lumbang",
  "Puskesmas Sukapura",
  "Puskesmas Curahtulis (Kec. Tongas)",
  "Puskesmas Glagah (Kec. Pakuniran)",
  "Puskesmas Jorongan (Kec. Leces)",
  "Puskesmas Wangkal (Kec. Gading)",
  "Puskesmas Klenang Kidul (Kec. Banyuanyar)",
  "Puskesmas Condong (Kec. Maron)",
  "Puskesmas Gembongan (Kec. Babat)",
  "Puskesmas Kedungjajang",
  "Puskesmas Sembungan",
  "Puskesmas Ranugedang (Kec. Tiris)",
  "Puskesmas Wangkal",
  "Puskesmas Wonomerto",
  "Kantor Kesatuan Bangsa dan Politik",
  "Kantor Satuan Polisi Pamong Praja",
  "Unit Kerja Pengadaan Barang/Jasa (UKPBJ)"
]

export default function UserManagement() {
  // Load initial state from localStorage or default list
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('pbj_users')
    if (saved) return JSON.parse(saved)
    
    const defaultList = [
      { id: 1, name: 'Handik Hariyanto, S.Kom., M.Si', role: 'PPK', nip: '197909102002121004', department: 'Kecamatan Besuk', password: 'admin' },
      { id: 2, name: 'Beni Trisna Wijaya, S.Kom', role: 'PP', nip: '198205192010011010', department: 'Kecamatan Besuk', password: 'admin' },
      { id: 3, name: 'Beni (Super Admin)', role: 'Admin', nip: 'admin', department: 'Unit Kerja Pengadaan Barang/Jasa (UKPBJ)', password: 'admin' },
      { id: 4, name: 'Budi Santoso', role: 'PPK', nip: '198001012005011001', department: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR)', password: 'admin' },
      { id: 5, name: 'Siti Aminah', role: 'PP', nip: '198502022010012002', department: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR)', password: 'admin' },
      { id: 6, name: 'Ahmad Dahlan', role: 'KPA', nip: '197503032000011003', department: 'Dinas Kesehatan', password: 'admin' }
    ]
    localStorage.setItem('pbj_users', JSON.stringify(defaultList))
    return defaultList
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentEditUser, setCurrentEditUser] = useState(null)
  
  // Form states
  const [name, setName] = useState('')
  const [role, setRole] = useState('PPK')
  const [nip, setNip] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')

  // Persist to localStorage whenever users list changes
  useEffect(() => {
    localStorage.setItem('pbj_users', JSON.stringify(users))
  }, [users])

  // Open modal for Adding
  const handleAddClick = () => {
    setCurrentEditUser(null)
    setName('')
    setRole('PPK')
    setNip('')
    setDepartment('Badan Kepegawaian dan Pengembangan Sumber Daya Manusia')
    setPassword('')
    setIsModalOpen(true)
  }

  // Open modal for Editing
  const handleEditClick = (user) => {
    setCurrentEditUser(user)
    setName(user.name)
    setRole(user.role)
    setNip(user.nip)
    setDepartment(user.department)
    setPassword('') // Leave blank for edit by default
    setIsModalOpen(true)
  }

  // Save (Add or Update) handler
  const handleSave = (e) => {
    e.preventDefault()
    
    if (!name.trim() || !nip.trim() || !department.trim()) {
      alert('Semua data wajib diisi!')
      return
    }

    if (!currentEditUser && !password.trim()) {
      alert('Password wajib diisi untuk pengguna baru!')
      return
    }

    if (currentEditUser) {
      // Update existing user (preserve password if not modified)
      setUsers(prev => prev.map(u => {
        if (u.id === currentEditUser.id) {
          return { 
            ...u, 
            name, 
            role, 
            nip, 
            department,
            password: password.trim() ? password.trim() : u.password 
          }
        }
        return u
      }))
    } else {
      // Create new user with password
      const newUser = {
        id: Date.now(),
        name,
        role,
        nip,
        department,
        password: password.trim()
      }
      setUsers(prev => [...prev, newUser])
    }

    setIsModalOpen(false)
  }

  // Delete handler
  const handleDelete = (id, userName) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}"?`)) {
      setUsers(prev => prev.filter(u => u.id !== id))
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
            
            <form onSubmit={handleSave} className="space-y-5">
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
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Instansi / Satuan Kerja (Dinas)</label>
                <input 
                  type="text"
                  list="satker-datalist"
                  className="glass-input" 
                  value={department} 
                  onChange={e => setDepartment(e.target.value)} 
                  placeholder="Ketik/cari dari 100+ Satuan Kerja..."
                  required
                />
                <datalist id="satker-datalist">
                  {satkerOptions.map((opt, i) => (
                    <option key={i} value={opt} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {currentEditUser ? '🔒 Reset / Ubah Password' : '🔒 Password Akses'}
                </label>
                <input 
                  type="password" 
                  className="glass-input" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder={currentEditUser ? 'Kosongkan jika tidak ingin mengubah password' : 'Masukkan password akses...'}
                  required={!currentEditUser}
                />
                {currentEditUser && (
                  <div className="text-[10px] text-slate-400 mt-1 font-medium italic">
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

import { useState, useEffect } from 'react'

// satkerOptions has been removed as the system now relies on real user input

export default function UserManagement() {
  // Load initial state from localStorage or default list
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('pbj_users')
    let list = saved ? JSON.parse(saved) : []
    
    // Filter out unwanted mock users permanently!
    list = list.filter(u => u.name !== 'Budi Santoso' && u.name !== 'Siti Aminah' && u.name !== 'Ahmad Dahlan')
    
    if (!saved || list.length === 0) {
      const defaultList = [
        { id: 1, name: 'Handik Hariyanto, S.Kom., M.Si', role: 'PPK', nip: '197909102002121004', department: 'Kecamatan Besuk', idSatker: '67081', perangkatDaerah: 'Pemerintah Daerah Kabupaten Probolinggo', password: 'admin' },
        { id: 2, name: 'Beni Trisna Wijaya, S.Kom', role: 'PP', nip: '198205192010011010', department: 'Kecamatan Besuk', idSatker: '67081', perangkatDaerah: 'Pemerintah Daerah Kabupaten Probolinggo', password: 'admin' },
        { id: 3, name: 'Beni (Super Admin)', role: 'Admin', nip: 'admin', department: 'Unit Kerja Pengadaan Barang/Jasa (UKPBJ)', idSatker: '308386', perangkatDaerah: 'Pemerintah Daerah Kabupaten Probolinggo', password: 'admin' }
      ]
      localStorage.setItem('pbj_users', JSON.stringify(defaultList))
      return defaultList
    }
    
    localStorage.setItem('pbj_users', JSON.stringify(list))
    return list
  })

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

  // Save (Add or Update) handler
  const handleSave = (e) => {
    e.preventDefault()
    
    if (!name.trim() || !nip.trim() || !department.trim() || !idSatker.trim() || !perangkatDaerah.trim()) {
      alert('Semua data wajib diisi, termasuk ID Satker dan Perangkat Daerah!')
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
            perangkatDaerah,
            department,
            idSatker,
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
        perangkatDaerah,
        department,
        idSatker,
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
                  className="glass-input" 
                  value={department} 
                  onChange={e => setDepartment(e.target.value)} 
                  placeholder="Ketik nama Satuan Kerja (Contoh: Unit Kerja Pengadaan Barang/Jasa)"
                  required
                />
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

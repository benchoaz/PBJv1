import { useState, useEffect, createContext, useContext } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pbj_user')
    if (!saved) return null
    try {
      const parsed = JSON.parse(saved)
      if (parsed && parsed.role) {
        let role = parsed.role
        if (role.toLowerCase() === 'admin') role = 'Admin'
        if (role.toLowerCase() === 'ppk') role = 'PPK'
        if (role.toLowerCase() === 'pp') role = 'PP'
        if (role.toLowerCase() === 'kpa') role = 'KPA'
        parsed.role = role
      }
      return parsed
    } catch (e) {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  const login = async (nip, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: nip, password }),
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    
    // Load registered users from User Management to cross-reference NIP
    const defaultList = [
      { id: 1, name: 'Handik Hariyanto, S.Kom., M.Si', role: 'PPK', nip: '197909102002121004', department: 'Kecamatan Besuk', password: 'admin' },
      { id: 2, name: 'Beni Trisna Wijaya, S.Kom', role: 'PP', nip: '198205192010011010', department: 'Kecamatan Besuk', password: 'admin' },
      { id: 3, name: 'Beni (Super Admin)', role: 'Admin', nip: 'admin', department: 'Unit Kerja Pengadaan Barang/Jasa (UKPBJ)', password: 'admin' },
      { id: 4, name: 'Budi Santoso', role: 'PPK', nip: '198001012005011001', department: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR)', password: 'admin' },
      { id: 5, name: 'Siti Aminah', role: 'PP', nip: '198502022010012002', department: 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR)', password: 'admin' },
      { id: 6, name: 'Ahmad Dahlan', role: 'KPA', nip: '197503032000011003', department: 'Dinas Kesehatan', password: 'admin' }
    ]
    const savedUsers = localStorage.getItem('pbj_users')
    let userList = []
    if (savedUsers) {
      userList = JSON.parse(savedUsers)
    } else {
      userList = defaultList
      localStorage.setItem('pbj_users', JSON.stringify(defaultList))
    }

    let matchedUser = userList.find(u => u.nip.toLowerCase() === nip.trim().toLowerCase())
    
    // Safety fallback for Super Admin NIP to prevent lockout
    if (!matchedUser && nip.trim().toLowerCase() === 'admin') {
      matchedUser = defaultList.find(u => u.nip === 'admin')
    }
    
    // Validate password
    if (matchedUser && matchedUser.password && password !== matchedUser.password) {
      throw new Error('Password salah. Silakan periksa kembali.')
    }
    
    // Auto-detect details or generate default
    let finalRole = matchedUser ? matchedUser.role : 'PPK'
    if (finalRole.toLowerCase() === 'admin') finalRole = 'Admin'
    if (finalRole.toLowerCase() === 'ppk') finalRole = 'PPK'
    if (finalRole.toLowerCase() === 'pp') finalRole = 'PP'
    if (finalRole.toLowerCase() === 'kpa') finalRole = 'KPA'
    
    const enrichedUser = matchedUser ? {
      ...data.user,
      name: matchedUser.name,
      username: matchedUser.name,
      role: finalRole,
      nip: matchedUser.nip,
      department: matchedUser.department
    } : {
      ...data.user,
      name: 'Pegawai Baru',
      username: 'Pegawai Baru',
      role: finalRole,
      nip: nip,
      department: 'Kecamatan Besuk' // Default
    }
    
    setUser(enrichedUser)
    localStorage.setItem('pbj_user', JSON.stringify(enrichedUser))
    return data
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (e) {
      // ignore logout network errors
    }
    setUser(null)
    localStorage.removeItem('pbj_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
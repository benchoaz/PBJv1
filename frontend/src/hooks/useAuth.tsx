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
      // Auto-migrate: if old single department string exists, convert to array
      if (parsed && parsed.department && !parsed.departments) {
        parsed.departments = [parsed.department]
        parsed.activeDepartment = parsed.department
      }
      return parsed
    } catch (e) {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  const login = async (nip, password, customRole, customDepartment) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: nip, password }),
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    
    // ✅ PERBAIKAN: Selalu baca dari API Backend
    let userList = []
    try {
      const usersRes = await fetch('/api/users')
      if (usersRes.ok) {
        userList = await usersRes.json()
      }
    } catch (e) {
      console.error("Failed to fetch users from backend", e)
    }

    let matchedUser = userList.find(u => u.nip.toLowerCase() === nip.trim().toLowerCase())
    
    // Safety fallback for Super Admin NIP to prevent lockout
    if (!matchedUser && nip.trim().toLowerCase() === 'admin') {
      matchedUser = { name: 'Beni (Super Admin)', role: 'Admin', nip: 'admin', department: 'Unit Kerja Pengadaan Barang/Jasa (UKPBJ)', idSatker: '308386', perangkatDaerah: 'Pemerintah Daerah Kabupaten Probolinggo', password: 'admin' }
    }
    
    // Validate password
    if (matchedUser && matchedUser.password && password !== matchedUser.password) {
      throw new Error('Password salah. Silakan periksa kembali.')
    }
    
    // Auto-detect details or generate default
    let finalRole = customRole || (matchedUser ? matchedUser.role : 'PP')
    if (finalRole.toLowerCase() === 'admin') finalRole = 'Admin'
    if (finalRole.toLowerCase() === 'ppk') finalRole = 'PPK'
    if (finalRole.toLowerCase() === 'pp') finalRole = 'PP'
    if (finalRole.toLowerCase() === 'kpa') finalRole = 'KPA'
    
    // Resolve departments array (backward-compatible)
    let userDepartments = []
    if (matchedUser) {
      if (matchedUser.departments && Array.isArray(matchedUser.departments)) {
        userDepartments = matchedUser.departments
      } else if (matchedUser.department) {
        userDepartments = [matchedUser.department]
      }
    }
    if (userDepartments.length === 0) {
      userDepartments = ['Kecamatan Besuk']
    }

    // Determine active department
    let activeDept = userDepartments[0]
    if (customDepartment && userDepartments.includes(customDepartment)) {
      activeDept = customDepartment
    } else if (customDepartment) {
      // If custom department specified but not in list, still use it (override from login)
      activeDept = customDepartment
    }

    const enrichedUser = matchedUser ? {
      ...data.user,
      name: matchedUser.name,
      username: matchedUser.name,
      role: finalRole,
      nip: matchedUser.nip,
      departments: userDepartments,
      department: activeDept,
      activeDepartment: activeDept,
      idSatker: matchedUser.idSatker || '',
      perangkatDaerah: matchedUser.perangkatDaerah || 'Pemerintah Daerah Kabupaten Probolinggo'
    } : {
      ...data.user,
      name: 'User ' + nip,
      username: 'User ' + nip,
      role: finalRole,
      nip: nip,
      departments: customDepartment ? [customDepartment] : ['Kecamatan Besuk'],
      department: customDepartment || 'Kecamatan Besuk',
      activeDepartment: customDepartment || 'Kecamatan Besuk',
      idSatker: '',
      perangkatDaerah: 'Pemerintah Daerah Kabupaten Probolinggo'
    }
    
    setUser(enrichedUser)
    localStorage.setItem('pbj_user', JSON.stringify(enrichedUser))
    return data
  }

  // Switch active department without re-login
  const switchDepartment = (newDept) => {
    if (!user) return
    const updated = {
      ...user,
      department: newDept,
      activeDepartment: newDept
    }
    setUser(updated)
    localStorage.setItem('pbj_user', JSON.stringify(updated))
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
    <AuthContext.Provider value={{ user, loading, login, logout, switchDepartment }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
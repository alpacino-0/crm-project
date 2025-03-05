import { createContext, useContext, useEffect, useState } from "react"

// Kullanıcı tipi
type User = {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

// Giriş bilgileri tipi
type LoginCredentials = {
  email: string
  password: string
  rememberMe?: boolean
}

// Kayıt bilgileri tipi
type SignupCredentials = {
  name: string
  email: string
  password: string
}

// Auth context tipi
type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (credentials: SignupCredentials) => Promise<void>
  logout: () => void
}

// Başlangıç değerleri
const initialState: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
}

// Context oluşturma
const AuthContext = createContext<AuthContextType>(initialState)

// Context sağlayıcı props tipi
interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Uygulama başladığında kullanıcı oturumunu kontrol et
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        // Normalde burada API'ye session kontrolü için istek gönderilir
        // Örnek olarak localStorage'dan token kontrolü yapıyoruz
        const token = localStorage.getItem("auth-token")
        
        if (token) {
          // Örnek bir kullanıcı verisi (gerçek uygulamada API'den gelecek)
          const userData: User = {
            id: "1",
            name: "Ahmet Yılmaz",
            email: "ahmet@firma.com",
            role: "admin",
          }
          setUser(userData)
        }
      } catch (error) {
        console.error("Session kontrolü başarısız:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserSession()
  }, [])

  // Giriş fonksiyonu
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      // Gerçek uygulamada API'ye giriş isteği gönderilir
      console.log("Giriş yapılıyor:", credentials)
      
      // Başarılı giriş simülasyonu
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Örnek bir token ve kullanıcı verisi
      const token = "example-jwt-token"
      const userData: User = {
        id: "1",
        name: "Ahmet Yılmaz",
        email: credentials.email,
        role: "admin",
      }
      
      // Token'ı kaydet ve kullanıcıyı ayarla
      localStorage.setItem("auth-token", token)
      if (credentials.rememberMe) {
        localStorage.setItem("remember-me", "true")
      }
      
      setUser(userData)
    } catch (error) {
      console.error("Giriş başarısız:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Kayıt fonksiyonu
  const signup = async (credentials: SignupCredentials) => {
    setIsLoading(true)
    try {
      // Gerçek uygulamada API'ye kayıt isteği gönderilir
      console.log("Kayıt yapılıyor:", credentials)
      
      // Başarılı kayıt simülasyonu
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Örnek bir token ve kullanıcı verisi
      const token = "example-jwt-token"
      const userData: User = {
        id: "1",
        name: credentials.name,
        email: credentials.email,
        role: "user",
      }
      
      // Token'ı kaydet ve kullanıcıyı ayarla
      localStorage.setItem("auth-token", token)
      setUser(userData)
    } catch (error) {
      console.error("Kayıt başarısız:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Çıkış fonksiyonu
  const logout = () => {
    localStorage.removeItem("auth-token")
    localStorage.removeItem("remember-me")
    setUser(null)
  }

  // Context değeri
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook kullanımı için
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error("useAuth hook'u bir AuthProvider içinde kullanılmalıdır")
  }
  
  return context
} 
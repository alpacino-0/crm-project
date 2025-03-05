import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { LogoutButton } from "@/components/auth/logout-button"
import {
  BarChart3Icon,
  CalendarIcon,
  FileTextIcon,
  HomeIcon,
  SettingsIcon,
  UsersIcon,
  UserIcon,
  ShieldIcon,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

// Ana navigasyon öğeleri
const mainNavItems = [
  {
    title: "Ana Sayfa",
    href: "/",
    icon: HomeIcon,
  },
  {
    title: "Müşteriler",
    href: "/customers",
    icon: UsersIcon,
  },
  {
    title: "İstatistikler",
    href: "/analytics",
    icon: BarChart3Icon,
  },
  {
    title: "Takvim",
    href: "/calendar",
    icon: CalendarIcon,
  },
  {
    title: "Raporlar",
    href: "/reports",
    icon: FileTextIcon,
  },
]

// Ayarlar navigasyon öğeleri
const settingsNavItems = [
  {
    title: "Profil",
    href: "/settings/profile",
    icon: UserIcon,
  },
  {
    title: "Güvenlik",
    href: "/settings/security",
    icon: ShieldIcon,
  },
  {
    title: "Genel Ayarlar",
    href: "/settings/general",
    icon: SettingsIcon,
  },
]

export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  // Aktif bağlantı kontrolü
  const isActive = (href: string) => {
    if (href === "/" && location.pathname !== "/") {
      return false
    }
    return location.pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col border-r">
      <div className="p-6">
        <h2 className="text-xl font-semibold">CRM Sistemi</h2>
        <p className="text-sm text-muted-foreground">Müşteri ilişkileri yönetimi</p>
      </div>
      
      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1 py-2">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="py-2">
          <h3 className="px-4 py-2 text-sm font-semibold">Ayarlar</h3>
          <nav className="flex flex-col gap-1">
            {settingsNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </ScrollArea>

      <div className="mt-auto p-4 border-t">
        {user && (
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}
        <LogoutButton className="w-full justify-start" />
      </div>
    </aside>
  )
}
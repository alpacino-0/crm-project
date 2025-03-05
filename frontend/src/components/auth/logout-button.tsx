import { Button, ButtonProps } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useNavigate } from "react-router-dom"
import { LogOutIcon } from "lucide-react"

interface LogoutButtonProps extends ButtonProps {
  redirectTo?: string
}

export function LogoutButton({ 
  redirectTo = "/auth/login", 
  children, 
  ...props 
}: LogoutButtonProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(redirectTo)
  }

  return (
    <Button 
      variant="ghost" 
      onClick={handleLogout} 
      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
      {...props}
    >
      {children || (
        <>
          <LogOutIcon className="h-5 w-5 mr-2" />
          Çıkış Yap
        </>
      )}
    </Button>
  )
}
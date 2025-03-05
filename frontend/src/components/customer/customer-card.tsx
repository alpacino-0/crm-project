import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PhoneIcon, MailIcon, MapPinIcon, MoreHorizontalIcon } from "lucide-react"

interface CustomerCardProps {
  customer: {
    id: string
    name: string
    email: string
    phone: string
    company: string
    address: string
    avatar?: string
    status: 'active' | 'inactive' | 'lead'
  }
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function CustomerCard({ customer, onView, onEdit, onDelete }: CustomerCardProps) {
  // Statüs renkleri
  const statusColors = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    lead: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={customer.avatar} alt={customer.name} />
              <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{customer.name}</CardTitle>
              <CardDescription>{customer.company}</CardDescription>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[customer.status]}`}>
            {customer.status === 'active' ? 'Aktif' : 
             customer.status === 'inactive' ? 'Pasif' : 'Potansiyel'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center">
            <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{customer.email}</span>
          </div>
          <div className="flex items-center">
            <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{customer.phone}</span>
          </div>
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="truncate">{customer.address}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={() => onView(customer.id)}>
          Görüntüle
        </Button>
        <div className="flex space-x-1">
          <Button variant="outline" size="sm" onClick={() => onEdit(customer.id)}>
            Düzenle
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(customer.id)}>
            Sil
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
} 
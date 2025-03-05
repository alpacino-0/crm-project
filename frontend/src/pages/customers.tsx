import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CustomerCard } from "@/components/customer/customer-card"
import { CustomerDialog } from "@/components/customer/customer-dialog"
import { PlusIcon, SearchIcon } from "lucide-react"

export function Customers() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Filtrele
  const filteredCustomers = mockCustomers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Müşteri Görüntüleme
  const handleViewCustomer = (id: string) => {
    navigate(`/customers/${id}`)
  }
  
  // Müşteri Düzenleme
  const handleEditCustomer = (id: string) => {
    console.log("Edit customer:", id)
    // Gerçek uygulamada burada düzenleme modalını açabilirsiniz
  }
  
  // Müşteri Silme
  const handleDeleteCustomer = (id: string) => {
    console.log("Delete customer:", id)
    // Gerçek uygulamada silme onayı isteyebilirsiniz
  }
  
  // Yeni Müşteri Ekleme
  const handleSaveCustomer = (customerData: any) => {
    console.log("Save customer:", customerData)
    setIsDialogOpen(false)
    // Gerçek uygulamada API çağrısı yapılır
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Müşteriler</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Müşteri ara..."
              className="pl-8 w-full md:w-[260px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Yeni Müşteri
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onView={handleViewCustomer}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
          />
        ))}
        
        {filteredCustomers.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-40 border rounded-lg bg-card">
            <div className="text-center text-muted-foreground">
              <p>Hiç müşteri bulunamadı.</p>
              <Button 
                variant="link" 
                onClick={() => setIsDialogOpen(true)}
                className="mt-2"
              >
                Yeni müşteri ekle
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <CustomerDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveCustomer}
      />
    </div>
  )
}

// Örnek veri, gerçek uygulamada bunlar API'dan gelecektir
const mockCustomers = [
  {
    id: "1",
    name: "Ahmet Yılmaz",
    email: "ahmet@ornek.com",
    phone: "0555 123 4567",
    company: "ABC Teknoloji",
    address: "Atatürk Mah. Cumhuriyet Cad. No:123 İstanbul",
    status: "active" as const,
  },
  {
    id: "2",
    name: "Ayşe Demir",
    email: "ayse@ornek.com",
    phone: "0532 987 6543",
    company: "XYZ Danışmanlık",
    address: "Kültür Mah. İstiklal Cad. No:45 Ankara",
    status: "lead" as const,
  },
  {
    id: "3",
    name: "Mehmet Kaya",
    email: "mehmet@ornek.com",
    phone: "0533 456 7890",
    company: "Kaya İnşaat",
    address: "Bahçelievler Mah. Adnan Menderes Bulvarı No:56 İzmir",
    status: "inactive" as const,
  },
  {
    id: "4",
    name: "Zeynep Çelik",
    email: "zeynep@ornek.com",
    phone: "0544 321 7890",
    company: "Çelik Mobilya",
    address: "Yıldız Mah. Vatan Cad. No:78 Bursa",
    status: "active" as const,
  },
  {
    id: "5",
    name: "Ali Öztürk",
    email: "ali@ornek.com",
    phone: "0542 765 4321",
    company: "Öztürk Market",
    address: "Fatih Mah. Millet Cad. No:12 Antalya",
    status: "lead" as const,
  },
] 
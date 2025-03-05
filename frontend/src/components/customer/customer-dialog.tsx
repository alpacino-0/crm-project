import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CustomerForm } from "./customer-form"

// Müşteri türü
interface Customer {
  id: string
  name: string
  company: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive' | 'lead'
  notes?: string
}

interface CustomerDialogProps {
  customer?: Customer
  isOpen: boolean
  onClose: () => void
  onSave: (customer: Omit<Customer, 'id'>) => void
  isLoading?: boolean
}

export function CustomerDialog({ 
  customer, 
  isOpen, 
  onClose, 
  onSave, 
  isLoading = false 
}: CustomerDialogProps) {
  // Yeni müşteri mi yoksa düzenleme mi
  const isNewCustomer = !customer?.id
  
  const handleSubmit = (data: Omit<Customer, 'id'>) => {
    onSave(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isNewCustomer ? "Yeni Müşteri Ekle" : "Müşteri Bilgilerini Düzenle"}
          </DialogTitle>
          <DialogDescription>
            {isNewCustomer 
              ? "Yeni müşteri bilgilerini doldurun ve kaydedin." 
              : "Müşteri bilgilerini güncelleyin ve değişiklikleri kaydedin."}
          </DialogDescription>
        </DialogHeader>
        
        <CustomerForm 
          initialData={customer}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
} 
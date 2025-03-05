import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeftIcon, MailIcon, PhoneIcon, EditIcon, TrashIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // Gerçek uygulamada API'dan müşteri verisi çekilir
  const customer = mockCustomers.find(c => c.id === id)
  
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-2xl font-bold">Müşteri Bulunamadı</h2>
        <p className="text-muted-foreground mb-4">
          İstediğiniz müşteri kaydı sistemde bulunamadı.
        </p>
        <Button onClick={() => navigate("/customers")}>
          Müşteri Listesine Dön
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/customers")}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Müşteri Detayları</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <EditIcon className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button variant="destructive">
            <TrashIcon className="h-4 w-4 mr-2" />
            Sil
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={customer.avatar} alt={customer.name} />
                <AvatarFallback className="text-2xl">{customer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{customer.name}</CardTitle>
              <CardDescription className="text-lg">{customer.company}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <MailIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Durum</h4>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium 
                  ${customer.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                    customer.status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' : 
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}`}
                >
                  {customer.status === 'active' ? 'Aktif' : 
                   customer.status === 'inactive' ? 'Pasif' : 'Potansiyel'}
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Adres</h4>
                <p className="text-sm text-muted-foreground">
                  {customer.address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="interactions">
            <TabsList className="w-full">
              <TabsTrigger value="interactions" className="flex-1">Etkileşimler</TabsTrigger>
              <TabsTrigger value="proposals" className="flex-1">Teklifler</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">Notlar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="interactions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Son Etkileşimler</CardTitle>
                  <CardDescription>
                    Bu müşteri ile yapılan son görüşmeler ve iletişimler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interactions.map((interaction, index) => (
                      <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium">{interaction.title}</h4>
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {interaction.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{interaction.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {interaction.user} tarafından
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {interaction.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="proposals" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Teklifler</CardTitle>
                  <CardDescription>
                    Bu müşteriye gönderilen teklifler
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {proposals.map((proposal, index) => (
                      <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium">{proposal.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            proposal.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' :
                            proposal.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {proposal.status === 'pending' ? 'Beklemede' :
                             proposal.status === 'accepted' ? 'Kabul Edildi' : 'Reddedildi'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Tutar: {proposal.amount} TL
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Son güncelleme: {proposal.updatedAt}
                          </span>
                          <Button variant="outline" size="sm">
                            Görüntüle
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notlar</CardTitle>
                  <CardDescription>
                    Müşteri hakkında eklenmiş notlar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notes.map((note, index) => (
                      <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium">{note.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {note.date}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{note.content}</p>
                        <div className="text-xs text-muted-foreground">
                          {note.user} tarafından
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Örnek veriler, gerçek uygulamada API'dan gelecektir
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
]

const interactions = [
  {
    title: "Telefon Görüşmesi",
    type: "Telefon",
    description: "Yeni teklifle ilgili detaylar konuşuldu. Müşteri daha düşük bir fiyat talep ediyor.",
    user: "Ayşe Yılmaz",
    date: "22 Ağustos 2023, 14:30"
  },
  {
    title: "E-posta Gönderimi",
    type: "E-posta",
    description: "Revize teklif müşteriye gönderildi. %5 indirim yapıldı.",
    user: "Mehmet Kaya",
    date: "20 Ağustos 2023, 10:15"
  },
  {
    title: "Toplantı",
    type: "Yüz Yüze",
    description: "İlk tanışma toplantısı yapıldı. Müşteri ihtiyaçları belirlendi.",
    user: "Ali Demir",
    date: "15 Ağustos 2023, 09:00"
  }
]

const proposals = [
  {
    title: "Web Sitesi Projesi",
    status: "accepted" as const,
    amount: "25,000",
    createdAt: "10 Ağustos 2023",
    updatedAt: "15 Ağustos 2023"
  },
  {
    title: "Mobil Uygulama Geliştirme",
    status: "pending" as const,
    amount: "40,000",
    createdAt: "22 Ağustos 2023",
    updatedAt: "22 Ağustos 2023"
  },
  {
    title: "SEO Hizmeti",
    status: "rejected" as const,
    amount: "5,000",
    createdAt: "5 Temmuz 2023",
    updatedAt: "10 Temmuz 2023"
  }
]

const notes = [
  {
    title: "Toplantı Sonrası Not",
    content: "Müşteri önümüzdeki ay yeni bir proje için tekrar görüşmek istiyor. Mobil uygulama konusunda ilgili.",
    user: "Ayşe Yılmaz",
    date: "15 Ağustos 2023"
  },
  {
    title: "Müşteri Tercihleri",
    content: "Modern tasarımları tercih ediyor. Mavi ve gri tonlarında kurumsal bir görünüm istiyor.",
    user: "Mehmet Kaya",
    date: "10 Ağustos 2023"
  }
] 
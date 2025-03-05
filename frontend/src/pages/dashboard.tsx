import { DashboardCard } from "@/components/dashboard/dashboard-card"
import { 
  UsersIcon, 
  PhoneIcon, 
  CalendarIcon, 
  PieChartIcon, 
  TrendingUpIcon 
} from "lucide-react"

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <select className="px-2 py-1 border rounded-md text-sm bg-background">
            <option>Son 7 gün</option>
            <option>Son 30 gün</option>
            <option>Son 3 ay</option>
            <option>Son 12 ay</option>
          </select>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Toplam Müşteri"
          value="2,543"
          trend={{ value: 12.5, isPositive: true }}
          icon={<UsersIcon className="h-4 w-4" />}
          variant="blue"
        />
        
        <DashboardCard
          title="Aktif Görüşmeler"
          value="42"
          trend={{ value: 8.2, isPositive: true }}
          icon={<PhoneIcon className="h-4 w-4" />}
          variant="green"
        />
        
        <DashboardCard
          title="Planlanmış Toplantılar"
          value="12"
          trend={{ value: 2.1, isPositive: false }}
          icon={<CalendarIcon className="h-4 w-4" />}
          variant="amber"
        />
        
        <DashboardCard
          title="Satış Oranı"
          value="24%"
          trend={{ value: 5.4, isPositive: true }}
          icon={<PieChartIcon className="h-4 w-4" />}
          variant="purple"
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-7">
        <div className="rounded-lg border bg-card md:col-span-5">
          <div className="p-6">
            <h3 className="text-lg font-medium">Satış Performansı</h3>
            <p className="text-sm text-muted-foreground">
              Son 30 günlük satış performansı grafiği
            </p>
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground text-sm">
                Graf bileşeni burada gösterilecek
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card md:col-span-2">
          <div className="p-6">
            <h3 className="text-lg font-medium">Son Aktiviteler</h3>
            <div className="mt-4 space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className={`h-2 w-2 mt-1.5 rounded-full ${activityColors[activity.type]}`} />
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const activityColors = {
  call: "bg-green-500",
  email: "bg-blue-500",
  meeting: "bg-purple-500",
  task: "bg-amber-500",
}

const activities = [
  {
    title: "Ahmet Yılmaz ile telefon görüşmesi",
    time: "15 dakika önce",
    type: "call",
  },
  {
    title: "ABC Şirketi ile toplantı",
    time: "1 saat önce",
    type: "meeting",
  },
  {
    title: "Teklif gönderildi: XYZ Projesi",
    time: "3 saat önce",
    type: "email",
  },
  {
    title: "Fatih Demir ile bağlantı kuruldu",
    time: "5 saat önce",
    type: "task",
  },
  {
    title: "Destek talebi yanıtlandı",
    time: "Dün",
    type: "email",
  },
] 
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre gereklidir."),
    newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  })

const securitySchema = z.object({
  twoFactorEnabled: z.boolean().default(false),
  sessionTimeout: z.number().min(5).max(120),
})

type PasswordValues = z.infer<typeof passwordSchema>
type SecurityValues = z.infer<typeof securitySchema>

export function SecuritySettings() {
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const securityForm = useForm<SecurityValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
    },
  })

  function onSubmitPassword(values: PasswordValues) {
    console.log(values)
    // Gerçek uygulamada burada API'ye şifre değiştirme isteği gönderilecek
    toast({
      title: "Şifre güncellendi",
      description: "Şifreniz başarıyla değiştirildi.",
    })
    passwordForm.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  function onSubmitSecurity(values: SecurityValues) {
    console.log(values)
    // Gerçek uygulamada burada API'ye güvenlik ayarları güncelleme isteği gönderilecek
    toast({
      title: "Güvenlik ayarları güncellendi",
      description: "Güvenlik tercihleriniz başarıyla kaydedildi.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Güvenlik</h3>
        <p className="text-sm text-muted-foreground">
          Hesap güvenliğinizi ve gizliliğinizi yönetin.
        </p>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="text-sm font-medium mb-4">Şifre Değiştir</h4>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mevcut Şifre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yeni Şifre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yeni Şifre Tekrar</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">Şifreyi Değiştir</Button>
            </div>
          </form>
        </Form>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="text-sm font-medium mb-4">Güvenlik Ayarları</h4>
        <Form {...securityForm}>
          <form onSubmit={securityForm.handleSubmit(onSubmitSecurity)} className="space-y-8">
            <FormField
              control={securityForm.control}
              name="twoFactorEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">İki Faktörlü Doğrulama</FormLabel>
                    <FormDescription>
                      Hesabınıza daha fazla güvenlik eklemek için iki faktörlü doğrulamayı etkinleştirin.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={securityForm.control}
              name="sessionTimeout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oturum Zaman Aşımı (dakika)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={120}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    İnaktif olduğunuzda otomatik çıkış yapılacak süre.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button type="submit">Ayarları Kaydet</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
} 
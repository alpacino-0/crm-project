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
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"

const profileSchema = z.object({
  name: z.string().min(2, {
    message: "Ad en az 2 karakter olmalıdır.",
  }),
  email: z.string().email({
    message: "Geçerli bir e-posta adresi giriniz.",
  }),
  bio: z.string().max(160).optional(),
  avatarUrl: z.string().optional(),
})

type ProfileValues = z.infer<typeof profileSchema>

export function ProfileSettings() {
  // Normalde bu veriler API'den gelecektir
  const defaultValues: Partial<ProfileValues> = {
    name: "Ahmet Yılmaz",
    email: "ahmet@firma.com",
    bio: "CRM Yöneticisi | Satış ve pazarlama konusunda 5+ yıl deneyimli",
    avatarUrl: "",
  }

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })

  function onSubmit(values: ProfileValues) {
    console.log(values)
    // Gerçek uygulamada burada API'ye profil güncelleme isteği gönderilecek
    toast({
      title: "Profil güncellendi",
      description: "Profil bilgileriniz başarıyla kaydedildi.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profil</h3>
        <p className="text-sm text-muted-foreground">
          Bu bilgiler profilinizde gösterilecektir.
        </p>
      </div>
      
      <Separator />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-3">
                <FormLabel>Profil Fotoğrafı</FormLabel>
                <div className="flex items-center gap-6">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={field.value} />
                    <AvatarFallback>AY</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Değiştir
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Kaldır
                    </Button>
                  </div>
                </div>
                <FormDescription>
                  JPG, GIF or PNG. Maksimum 2MB.
                </FormDescription>
              </FormItem>
            )}
          />
          
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İsim</FormLabel>
                  <FormControl>
                    <Input placeholder="Ahmet Yılmaz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl>
                    <Input placeholder="ahmet@firma.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hakkında</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Kendiniz hakkında kısa bilgi"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Profilinizde görünecek kısa biyografiniz.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end">
            <Button type="submit">Değişiklikleri Kaydet</Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 
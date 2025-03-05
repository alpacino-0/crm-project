import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

const forgotPasswordSchema = z.object({
  email: z.string().email({
    message: "Geçerli bir e-posta adresi giriniz.",
  }),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  function onSubmit(values: ForgotPasswordValues) {
    console.log(values)
    // Gerçek uygulamada burada API'ye şifre sıfırlama isteği gönderilecek
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">E-posta Gönderildi</h1>
            <p className="mt-2 text-muted-foreground">
              Şifre sıfırlama talimatlarını içeren bir e-posta gönderdik.
              Lütfen e-posta kutunuzu kontrol edin.
            </p>
          </div>
          <div className="text-center pt-4">
            <Link to="/auth/login">
              <Button variant="outline" className="w-full">
                Giriş Sayfasına Dön
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Şifrenizi mi unuttunuz?</h1>
          <p className="text-muted-foreground mt-2">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı
            gönderelim.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl>
                    <Input placeholder="ornek@firma.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Şifre Sıfırlama Bağlantısı Gönder
            </Button>
          </form>
        </Form>

        <div className="text-center pt-4 text-sm border-t">
          <p>
            <Link to="/auth/login" className="text-primary hover:underline">
              Giriş sayfasına dön
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 
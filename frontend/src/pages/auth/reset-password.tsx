import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Link, useSearchParams } from "react-router-dom"
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

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, {
      message: "Şifre en az 6 karakter olmalıdır.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  function onSubmit(values: ResetPasswordValues) {
    console.log({ ...values, token })
    // Gerçek uygulamada burada API'ye şifre değiştirme isteği gönderilecek
    setIsSubmitted(true)
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Geçersiz veya Süresi Dolmuş Link</h1>
            <p className="text-muted-foreground mt-2">
              Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
            </p>
          </div>
          <div className="text-center pt-4">
            <Link to="/auth/forgot-password">
              <Button className="w-full">
                Yeni Şifre Sıfırlama Bağlantısı İste
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Şifre Başarıyla Değiştirildi</h1>
            <p className="mt-2 text-muted-foreground">
              Yeni şifreniz başarıyla ayarlandı. Artık yeni şifrenizle giriş yapabilirsiniz.
            </p>
          </div>
          <div className="text-center pt-4">
            <Link to="/auth/login">
              <Button className="w-full">
                Giriş Yap
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
          <h1 className="text-2xl font-bold">Şifrenizi Sıfırlayın</h1>
          <p className="text-muted-foreground mt-2">
            Lütfen yeni şifrenizi belirleyin
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yeni Şifre</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şifre Tekrar</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Şifreyi Değiştir
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
} 
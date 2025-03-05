import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cva, type VariantProps } from "class-variance-authority"
import { ReactNode } from "react"

// Kart varyasyonları için stil tanımlaması
const cardVariants = cva("rounded-md", {
  variants: {
    variant: {
      default: "bg-white dark:bg-gray-800",
      blue: "bg-blue-50 dark:bg-blue-950",
      green: "bg-green-50 dark:bg-green-950",
      amber: "bg-amber-50 dark:bg-amber-950",
      purple: "bg-purple-50 dark:bg-purple-950",
      red: "bg-red-50 dark:bg-red-950",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

// Simgeler için stil tanımlaması
const iconVariants = cva("p-2 rounded-md", {
  variants: {
    variant: {
      default: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
      blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
      green: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
      amber: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
      purple: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
      red: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface DashboardCardProps extends VariantProps<typeof cardVariants> {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  footer?: ReactNode
}

export function DashboardCard({
  title,
  value,
  description,
  icon,
  trend,
  footer,
  variant,
}: DashboardCardProps) {
  return (
    <Card className={cardVariants({ variant })}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {icon && <div className={iconVariants({ variant })}>{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
            </span>
            <span className="ml-1">geçen dönemden</span>
          </p>
        )}
        
        {footer && <div className="mt-4">{footer}</div>}
      </CardContent>
    </Card>
  )
} 
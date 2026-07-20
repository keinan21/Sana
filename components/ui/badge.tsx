import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-0.5 text-xs font-bold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-eager-green text-white border-eager-green",
        secondary:
          "bg-storybook-green text-eager-green border-storybook-green",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20",
        outline:
          "border-faded-gray text-pencil-gray bg-transparent",
        success:
          "bg-eager-green/10 text-eager-green border-eager-green/20",
        warning:
          "bg-amber-500/10 text-amber-500 border-amber-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

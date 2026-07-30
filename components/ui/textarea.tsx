import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full rounded-lg border border-border-2 bg-surface-2",
        "px-3 py-2 text-sm text-text-1 placeholder:text-text-3",
        "transition-all duration-150 resize-none",
        "min-h-[80px]",
        "hover:border-text-3",
        "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

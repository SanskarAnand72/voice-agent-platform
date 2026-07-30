import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Shared page header used across all dashboard routes.
 * Provides consistent top spacing, title hierarchy, and action area.
 */
export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        "px-8 py-6 border-b border-border",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold text-text-1 tracking-tight leading-none">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-text-2 leading-relaxed">{description}</p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {children}
        </div>
      )}
    </div>
  )
}

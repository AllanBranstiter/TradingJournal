import { cn } from '@/lib/utils/cn'

interface DashboardShellProps {
  children: React.ReactNode
  className?: string
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl', className)}>
      {children}
    </div>
  )
}

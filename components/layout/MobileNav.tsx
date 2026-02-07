'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useMobileNav } from '@/lib/hooks/useMobileNav'
import { NAVIGATION_ITEMS } from '@/lib/constants/navigation'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export function MobileNav() {
  const pathname = usePathname()
  const { isOpen, close } = useMobileNav()

  // Close mobile nav when route changes
  useEffect(() => {
    close()
  }, [pathname, close])

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden"
        onClick={close}
      />

      {/* Slide-out panel */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r border-background-tertiary bg-background-secondary md:hidden',
          'animate-in slide-in-from-left duration-300'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with Close Button */}
          <div className="flex h-16 items-center justify-between border-b border-background-tertiary px-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-info">
                <span className="text-lg font-bold text-white">M</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-text-primary">
                  Mindful Trader
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-background-tertiary text-accent-info'
                      : 'text-text-secondary hover:bg-background-tertiary/50 hover:text-text-primary'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}

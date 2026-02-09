'use client'

import { Menu, Settings, LogOut, Flame } from 'lucide-react'
import Link from 'next/link'
import { useMobileNav } from '@/lib/hooks/useMobileNav'
import { useGamification } from '@/lib/hooks/useGamification'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth/actions'

export function TopNav() {
  const { toggle } = useMobileNav()
  const { data: gamificationData } = useGamification()

  // Placeholder user data - will be replaced with real auth data later
  const user = {
    email: 'trader@example.com',
    name: 'John Doe',
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-background-tertiary bg-background-secondary">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={toggle}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Mobile Logo */}
        <Link href="/dashboard" className="flex items-center md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-info">
            <span className="text-lg font-bold text-white">M</span>
          </div>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Streak Counter */}
        {gamificationData && gamificationData.current_streak > 0 && (
          <Link href="/dashboard/psychology" className="mr-4">
            <Badge
              variant="outline"
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 text-orange-500 hover:bg-orange-500/20 transition-colors px-3 py-1.5"
            >
              <Flame className="h-4 w-4" />
              <span className="font-semibold">{gamificationData.current_streak}</span>
              <span className="hidden sm:inline text-xs">day streak</span>
            </Badge>
          </Link>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative flex items-center space-x-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent-info text-white">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">
                {user.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

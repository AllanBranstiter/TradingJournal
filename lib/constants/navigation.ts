import { 
  LayoutDashboard, 
  List, 
  PlusCircle, 
  Brain, 
  BarChart3, 
  Upload, 
  Settings,
  type LucideIcon
} from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Trades', href: '/dashboard/trades', icon: List },
  { name: 'Add Trade', href: '/dashboard/trades/new', icon: PlusCircle },
  { name: 'Psychology', href: '/dashboard/psychology', icon: Brain },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Import CSV', href: '/dashboard/import', icon: Upload },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
] as const

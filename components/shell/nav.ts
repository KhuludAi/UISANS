import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarClock,
  Eye,
  FlaskConical,
  HeartPulse,
  LayoutGrid,
  ScanEye,
  ShieldCheck,
  Sparkles,
  User,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'

export type NavStatus = 'live' | 'pending' | 'optional' | 'sim'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  status: NavStatus
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Monitoring',
    items: [
      { href: '/mission', label: 'Mission Control', icon: LayoutGrid, status: 'live' },
      { href: '/astronaut', label: 'Astronaut', icon: User, status: 'live' },
      { href: '/monitoring', label: 'SANS Eye Monitoring', icon: Eye, status: 'live' },
      { href: '/planner', label: 'Adaptive Scan Planner', icon: CalendarClock, status: 'live' },
    ],
  },
  {
    label: 'Integrity',
    items: [
      { href: '/integrity', label: 'Data Integrity', icon: ShieldCheck, status: 'live' },
      { href: '/alerts', label: 'Alerts & Events', icon: AlertTriangle, status: 'live' },
      { href: '/offline', label: 'Offline & Sync', icon: WifiOff, status: 'pending' },
    ],
  },
  {
    label: 'Advanced',
    items: [
      { href: '/oct', label: 'OCT AI Analysis', icon: ScanEye, status: 'pending' },
      { href: '/guidance', label: 'AI Care Guidance', icon: Sparkles, status: 'pending' },
      { href: '/evidence', label: 'Evidence & Constraints', icon: BookOpen, status: 'pending' },
    ],
  },
  {
    label: 'Other',
    items: [
      { href: '/demo', label: 'Demo Mode', icon: FlaskConical, status: 'sim' },
      { href: '/vitals', label: 'Vital Signs', icon: HeartPulse, status: 'optional' },
    ],
  },
]

export const STATUS_LABEL: Record<NavStatus, string> = {
  live: 'Operational',
  pending: 'Integration pending',
  optional: 'Optional',
  sim: 'Simulation',
}

export { Activity }

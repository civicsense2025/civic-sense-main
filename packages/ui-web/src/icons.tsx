import {
  User,
  LogOut,
  BarChart3,
  Settings,
  Crown,
  ChevronDown,
  FileText,
  Users,
  Brain,
  Target,
  BookOpen,
  Zap,
  Flag,
  Compass,
  Activity,
  Layout,
  Shield,
  Sun,
  Moon,
  type LucideIcon
} from "lucide-react"

export type Icon = LucideIcon

export const Icons = {
  user: User,
  logOut: LogOut,
  barChart: BarChart3,
  settings: Settings,
  crown: Crown,
  chevronDown: ChevronDown,
  fileText: FileText,
  users: Users,
  brain: Brain,
  target: Target,
  bookOpen: BookOpen,
  zap: Zap,
  flag: Flag,
  compass: Compass,
  activity: Activity,
  layout: Layout,
  shield: Shield,
  sun: Sun,
  moon: Moon
} as const 
import { CalendarIcon, RoutineIcon } from './icons'
import type { FooterNavigationItem } from './types'

export const FOOTER_NAVIGATION_ITEMS = [
  {
    href: '/',
    label: '캘린더',
    icon: CalendarIcon,
    match: 'exact',
  },
  {
    href: '/routine',
    label: '루틴',
    icon: RoutineIcon,
    match: 'prefix',
  },
] satisfies readonly FooterNavigationItem[]

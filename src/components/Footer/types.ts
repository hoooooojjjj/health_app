import type { ComponentType, SVGProps } from 'react'

export type FooterNavigationItem = {
  href: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  match?: 'exact' | 'prefix'
}

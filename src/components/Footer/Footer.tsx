'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FOOTER_NAVIGATION_ITEMS } from './navigation'
import type { FooterNavigationItem } from './types'
import styles from './Footer.module.css'

function isCurrentPath(pathname: string, item: FooterNavigationItem) {
  if (item.match === 'prefix') {
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  return pathname === item.href
}

export function Footer() {
  const pathname = usePathname()

  return (
    <footer className={styles.footer}>
      <nav aria-label="주요 메뉴">
        <ul className={styles.navigationList}>
          {FOOTER_NAVIGATION_ITEMS.map((item) => {
            const isCurrent = isCurrentPath(pathname, item)
            const Icon = item.icon

            return (
              <li key={item.href} className={styles.navigationItem}>
                <Link
                  href={item.href}
                  className={styles.navigationLink}
                  aria-current={isCurrent ? 'page' : undefined}
                  data-active={isCurrent || undefined}
                >
                  <Icon className={styles.icon} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </footer>
  )
}

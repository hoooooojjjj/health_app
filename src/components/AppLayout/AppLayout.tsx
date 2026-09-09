import type { ReactNode } from 'react'
import styles from './AppLayout.module.css'

type AppLayoutProps = {
  children: ReactNode
  footer?: ReactNode
}

export function AppLayout({ children, footer }: AppLayoutProps) {
  return (
    <div className={styles.viewport}>
      <div className={styles.container}>
        <div className={styles.content}>{children}</div>
        {footer}
      </div>
    </div>
  )
}

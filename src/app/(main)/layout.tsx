import type { ReactNode } from 'react'
import { AppLayout } from '@/components/AppLayout/AppLayout'
import { Footer } from '@/components/Footer/Footer'

type MainLayoutProps = {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return <AppLayout footer={<Footer />}>{children}</AppLayout>
}

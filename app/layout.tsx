import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ment⊖⊕r — Marca em ordem',
  description: 'Mentoor — Marca em ordem',
  generator: 'mentoor.app',
  icons: {
    icon: '/images/mentoor-mark.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${inter.className} brand-theme`}>{children}</body>
    </html>
  )
}

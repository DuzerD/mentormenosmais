import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Brand Plot',
  description: 'Created with v0',
  generator: 'v0.dev',
  icons: {
    icon: '/images/brilho-original-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body>{children}</body>
    </html>
  )
}

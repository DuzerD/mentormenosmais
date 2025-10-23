import type { Metadata } from "next"

import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Mentoor — Marca em ordem",
  description: "Descubra o que falta para a sua marca vender mais fazendo menos.",
  generator: "mentoor.app",
  icons: {
    icon: "/images/mentoor-mark.svg",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} brand-theme`}>{children}</body>
    </html>
  )
}

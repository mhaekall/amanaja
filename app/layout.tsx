import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Amanaja — Serba Ada, Serba Seru',
  description: 'Main game, buat meme, pelajari hal baru, atau coba tools keren — semua gratis, semua bisa kamu share ke medsos.',
  openGraph: {
    title: 'Amanaja — Serba Ada, Serba Seru',
    description: 'Satu tempat buat semua yang seru. Games, edukasi, meme generator, dan tools.',
    siteName: 'Amanaja',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amanaja — Serba Ada, Serba Seru',
    description: 'Main game, buat meme, pelajari hal baru, atau coba tools keren.',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${bricolage.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}

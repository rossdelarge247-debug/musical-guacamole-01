import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Interview Monkey',
    template: '%s — Interview Monkey',
  },
  description:
    'AI interview performance system. Prep smarter, answer better, sound sharper.',
  keywords: ['interview preparation', 'AI interview coach', 'behavioural interview', 'STAR method'],
  authors: [{ name: 'Interview Monkey' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Interview Monkey',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'Interview Monkey',
    title: 'Interview Monkey — AI Interview Performance',
    description: 'Prep smarter, answer better, sound sharper.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2557A7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}

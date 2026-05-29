import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { PwaRegistration } from '@/components/pwa/pwa-registration'
import { ThemeProvider } from '@/lib/theme'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1754af' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
}

export const metadata: Metadata = {
  title: 'Hazin Motors',
  description: 'Garage Management System',
  applicationName: 'Hazin Motors',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hazin Motors',
    startupImage: '/pwa-512x512.png',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: [
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Hazin Motors" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="h-full bg-[transparent] text-[var(--text-strong)]">
        <ThemeProvider>
          <PwaRegistration />
          {children}
          <Toaster
            position="top-right"
            closeButton
            richColors
            toastOptions={{
              classNames: {
                toast: 'rounded-lg border border-[var(--line)] bg-[var(--surface-card)] text-[var(--text-strong)] shadow-lg',
                title: 'font-semibold text-[var(--text-strong)]',
                description: 'text-sm text-[var(--text-muted)]',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}

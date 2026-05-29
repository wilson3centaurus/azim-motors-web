import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { PwaRegistration } from '@/components/pwa/pwa-registration'
import { ThemeProvider } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'Hazin Motors',
  description: 'Garage Management System',
  applicationName: 'Hazin Motors',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hazin Motors',
  },
  formatDetection: {
    telephone: false,
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
                toast: 'rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-raised)] text-[var(--text-strong)] shadow-xl backdrop-blur-sm',
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

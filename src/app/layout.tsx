import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { ThemeProvider } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'Azim Motors',
  description: 'Garage Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-full bg-slate-50 text-slate-900">
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            closeButton
            richColors
            toastOptions={{
              classNames: {
                toast: 'rounded-2xl border border-white/70 bg-white/95 shadow-xl',
                title: 'font-semibold',
                description: 'text-sm',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}

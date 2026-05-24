import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { ThemeProvider } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'Hazim Motors',
  description: 'Garage Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-full bg-[transparent] text-[var(--text-strong)]">
        <ThemeProvider>
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

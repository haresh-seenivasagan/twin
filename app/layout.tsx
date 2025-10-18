import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800']
})
const headingFont = Manrope({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['600', '700', '800']
})

export const metadata: Metadata = {
  title: 'Twin - Your AI Persona & Memory System',
  description: 'Connect your accounts, generate your persona, and let AI remember who you are across all interactions.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning translate="no">
      <body className={`${bodyFont.variable} ${headingFont.variable} page-warm`} suppressHydrationWarning>
        <div className="relative min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
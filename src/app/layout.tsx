import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Trident IMS — Inventory Management System',
  description: 'Seed dispatch and inventory management for Trident',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-slate-950 overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto bg-slate-950">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

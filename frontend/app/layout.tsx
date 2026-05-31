import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'UrbanMind AI',
  description: 'Smart City Infrastructure Intelligence Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950">
        <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center gap-8">
          <span className="text-blue-400 font-bold text-lg">UrbanMind AI</span>
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition">
            Home
          </Link>
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition">
            Dashboard
          </Link>
          <Link href="/complaints" className="text-gray-400 hover:text-white text-sm transition">
            Complaints
          </Link>
          <Link href="/detect" className="text-gray-400 hover:text-white text-sm transition">
            Detect Potholes
          </Link>
          <Link href="/traffic" className="text-gray-400 hover:text-white text-sm transition">
            Traffic
          </Link>
          <Link href="/chat" className="text-gray-400 hover:text-white text-sm transition">
  Ask AI
</Link>
        </nav>
        {children}
      </body>
    </html>
  )
}
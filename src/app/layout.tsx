import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'TurfPro ERP – Smart Turf Management',
  description: 'Modern turf booking and management platform for sports facility owners.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#050814',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="app-bg overflow-hidden h-screen flex flex-col">
        {/* Top Header */}
        <Header />
        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar />
          {/* Main content */}
          <main
            className="flex-1 overflow-y-auto"
            style={{ paddingLeft: 0 }}
          >
            <div className="p-4 md:p-6 min-h-full">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}

import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AstroBuild - Gestión de Taller',
  description: 'Sistema de gestión de tareas para taller de reparación de autos',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/Icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/Icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/Icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/Icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/Icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/Icons/final_192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/Icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { url: '/Icons/final_512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/Icons/final_192x192.png',
    apple: [
      { url: '/Icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AstroBuild',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Honk&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}
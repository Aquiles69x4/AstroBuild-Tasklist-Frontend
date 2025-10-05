/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimizaciones para Vercel
  // output: 'standalone', // Comentado para desarrollo local

  // Variables de entorno
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  },

  // Configuración de imágenes
  images: {
    domains: [],
    unoptimized: true, // Para mejor compatibility con Vercel
  },

  // Optimizaciones de build - commented out due to critters module issue
  // experimental: {
  //   optimizeCss: true,
  // },

  // Configuración de headers para mejor performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Configuración de redirects si es necesario
  async redirects() {
    return []
  },
}

module.exports = nextConfig
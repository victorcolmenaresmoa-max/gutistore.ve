/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Política de seguridad de contenido (CSP): le dice al navegador de dónde
 * puede cargar scripts, estilos, fotos y conexiones. Si alguien lograra
 * inyectar código, el navegador se negaría a ejecutarlo o a enviar datos fuera.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js necesita scripts en línea para arrancar la página.
  // cdnjs: animaciones GSAP de la página /creatina.
  `script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fotos: las propias, las de Supabase Storage y fotos antiguas por HTTPS.
  `img-src 'self' data: blob: https:${isDev ? ' http://localhost:*' : ''}`,
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self'",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  // Obliga a usar HTTPS durante 2 años (también en subdominios).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Nadie puede meter la tienda dentro de un iframe (anti-clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  // El navegador no "adivina" tipos de archivo.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // La tienda no usa cámara, micrófono ni ubicación.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  reactStrictMode: true,
  // No anunciar que el sitio usa Next.js.
  poweredByHeader: false,
  images: {
    // Solo HTTPS: las fotos se suben a Supabase Storage desde el panel.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // El panel y la API nunca se guardan en caché ni se indexan.
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        // Las fotos del hero no cambian de nombre, así que se pueden
        // cachear un año entero. Si reemplazas una foto, cambia el
        // nombre del archivo (creatina-v2.webp) para que el navegador
        // la vuelva a pedir.
        source: '/catalogo/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

module.exports = nextConfig;

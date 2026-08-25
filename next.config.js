/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Permitimos cualquier dominio de imagen porque el admin puede pegar
    // URLs de imágenes de proveedores, Google Drive, Imgur, etc.
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    // Formatos modernos para lo que sirve next/image.
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      {
        // Las fotos del hero no cambian de nombre, así que se pueden
        // cachear un año entero. Si reemplazas una foto, cambia el
        // nombre del archivo (creatina-v2.webp) para que el navegador
        // la vuelva a pedir.
        source: '/catalogo/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

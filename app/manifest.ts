import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GutiStore',
    short_name: 'GutiStore',
    description: 'Tienda multirubro de GutiStore.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0b0d',
    theme_color: '#0b0b0d',
    icons: [{ src: '/guti-store-icon.png', sizes: '512x512', type: 'image/png' }],
  };
}

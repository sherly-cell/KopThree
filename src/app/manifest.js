export default function manifest() {
  return {
    name: 'KopThree & Kitchen',
    short_name: 'KopThree',
    description: 'Aplikasi Pemesanan E-Commerce KopThree',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a', // Warna splash screen pas aplikasi dibuka
    theme_color: '#f59e0b',      // Warna bar atas browser HP (Amber-Gold)
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
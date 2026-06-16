/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**', // 👈 Ini wajib ada untuk mengizinkan semua link gambar Unsplash
      },
    ],
  },
};

export default nextConfig;
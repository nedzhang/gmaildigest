import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [
    'localhost:3000',
    '9002-firebase-studio-1747626833947.cluster-joak5ukfbnbyqspg4tewa33d24.cloudworkstations.dev',
    '9000-firebase-studio-1747626833947.cluster-joak5ukfbnbyqspg4tewa33d24.cloudworkstations.dev',
    'gmaildigest.cogreq.paracognition.dev',
  ], 
  serverExternalPackages: ['pino', 'pino-pretty', 'pdf-parse'],
};

export default nextConfig;

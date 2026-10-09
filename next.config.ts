import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

// Origen de las imágenes: Payload en Hall (cms.soyroman.com)
const CMS_URL = process.env.CMS_URL || process.env.PAYLOAD_PUBLIC_SERVER_URL
// Imágenes en Cloudflare R2 (https://media.soyroman.com)
const MEDIA_PUBLIC_URL = process.env.MEDIA_PUBLIC_URL

const nextConfig: NextConfig = {
  // Hall construye la imagen Docker con NEXT_OUTPUT=standalone; Vercel lo ignora.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [100],
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL, CMS_URL, MEDIA_PUBLIC_URL].filter((u): u is string => Boolean(u)).map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
  async rewrites() {
    return [{ source: '/blog/:slug.md', destination: '/md/blog/:slug' }]
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

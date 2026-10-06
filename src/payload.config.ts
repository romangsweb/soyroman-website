import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { seoPlugin } from '@payloadcms/plugin-seo'
import sharp from 'sharp'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { es } from '@payloadcms/translations/languages/es'
import { en } from '@payloadcms/translations/languages/en'

import { Categories } from './collections/Categories'
import { Experience } from './collections/Experience'
import { Expertise } from './collections/Expertise'
import { Lab } from './collections/Lab'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { Tools } from './collections/Tools'
import { Users } from './collections/Users'

import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { Profile } from './globals/Profile'

import { defaultLexical } from './fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

import type { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import type { Page, Post, Project, Expertise as ExpertiseType } from './payload-types'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const generateTitle: GenerateTitle<Post | Page | Project | ExpertiseType> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Román García` : 'Román García — Director de Marketing B2B'
}

const generateURL: GenerateURL<Post | Page | Project | ExpertiseType> = ({ doc }) => {
  const url = getServerSideURL()
  return doc?.slug ? `${url}/${doc.slug}` : url
}

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  i18n: {
    supportedLanguages: { es, en },
    fallbackLanguage: 'es',
  },
  localization: {
    locales: [
      {
        label: 'Español',
        code: 'es',
      },
      {
        label: 'English',
        code: 'en',
      },
    ],
    defaultLocale: 'es',
    fallback: true,
  },
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),
  collections: [
    Posts,
    Expertise,
    Projects,
    Lab,
    Experience,
    Tools,
    Pages,
    Media,
    Categories,
    Users,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, Profile],
  plugins: [
    seoPlugin({
      generateTitle,
      generateURL,
    }),
    ...(process.env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            collections: {
              media: true,
            },
            token: process.env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : []),
  ],
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

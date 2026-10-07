import React from 'react'
import Link from 'next/link'

import { ScreenCover, postCategory } from '@/components/ScreenCover'
import { dotMatrix } from '@/components/layout/dotFont'
import { filledText } from '@/lib/seo'

const key =
  'inline-flex items-center h-11 px-5 border-2 border-black font-mono text-[10px] uppercase font-bold tracking-widest shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#000] transition-[transform,box-shadow]'

/** Panel de autor al final del artículo: foto (o iniciales en puntos), bio y dos teclas. */
export function AuthorBox({ profile }: { profile: any }) {
  const name = profile?.name || 'Román García'
  const photo = profile?.photo && typeof profile.photo === 'object' && profile.photo.url ? profile.photo : null
  const initials = name.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const m = dotMatrix(initials, '#e85a2a', '#2a2a2a', 4)
  const bio = filledText(profile?.shortBio)

  return (
    <section className="bg-white border-t border-black">
      <div className="container max-w-4xl p-8 md:p-12 border-x border-black">
        <div className="border-2 border-black bg-[#f2f1ec] shadow-[6px_6px_0_#000] grid sm:grid-cols-[160px_1fr]">
          <div className="bg-[#0b0b0b] flex items-center justify-center p-5 border-b-2 sm:border-b-0 sm:border-r-2 border-black">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.url} alt={photo.alt || name} className="w-28 h-28 object-cover grayscale contrast-125 border border-white/20" />
            ) : (
              <svg viewBox={`0 0 ${m.w} ${m.h}`} className="w-28" aria-hidden="true">{m.dots}</svg>
            )}
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-widest opacity-60 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e85a2a]" aria-hidden="true" /> Autor · CH-01
            </div>
            <p className="text-2xl font-semibold tracking-tight">{name}</p>
            {profile?.role && <p className="font-mono text-[11px] uppercase tracking-widest mt-1">{profile.role}</p>}
            {bio && <p className="font-mono text-[13px] leading-relaxed opacity-80 mt-3">{bio}</p>}
            <div className="flex flex-wrap gap-3 mt-5">
              <Link href="/contacto" className={`${key} bg-black text-white`}>Contacto</Link>
              <Link href="/about" className={`${key} bg-white text-black`}>Sobre mí</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Tres artículos relacionados con su pantalla. */
export function RelatedPosts({ posts }: { posts: any[] }) {
  if (!posts.length) return null
  return (
    <section className="bg-[#0b0b0b] text-white border-t border-black">
      <div className="p-8 md:p-12 border-b border-white/15 flex items-center justify-between">
        <h2 className="font-mono text-[11px] uppercase font-bold tracking-widest">// Sigue leyendo</h2>
        <Link href="/blog" className="font-mono text-[10px] uppercase font-bold tracking-widest hover:text-[#e85a2a]">Todo el blog →</Link>
      </div>
      <div className="grid md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-white/15">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="group p-6 md:p-8 hover:bg-[#151515] transition-colors">
            <ScreenCover
              slug={p.slug}
              category={postCategory(p)}
              minutes={p.readingTime}
              figure={p.screenFigure}
              tag={p.screenTag}
              title={p.title}
              speed={1.6}
              className="aspect-[16/9] w-full border border-white/20 group-hover:border-[#e85a2a] transition-colors"
            />
            {p.readingTime && (
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-60 mt-4">{p.readingTime} MIN</p>
            )}
            <h3 className="text-xl font-semibold tracking-tight mt-2 group-hover:text-[#e85a2a] transition-colors">{p.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  )
}

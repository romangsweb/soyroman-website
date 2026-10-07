import React from 'react'
import Link from 'next/link'

import { cms } from '@/lib/cms'
import { CdmxClock } from './DotMatrix'
import { dotMatrix } from './dotFont'
import { CookieLink } from '@/components/analytics/CookieLink'

const GROUPS: [string, [string, string][]][] = [
  ['Trabajo', [['/expertise', 'Expertise'], ['/proyectos', 'Proyectos'], ['/consultoria', 'Consultoría']]],
  ['Contenido', [['/blog', 'Blog'], ['/glosario', 'Glosario'], ['/notas', 'Notas de campo'], ['/recursos', 'Recursos']]],
  ['Sobre mí', [['/about', 'Sobre mí'], ['/cv', 'CV'], ['/uses', 'Herramientas'], ['/privacidad', 'Privacidad']]],
]

const GITHUB = 'M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3'

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase()
  return (
    <span className="relative inline-flex items-center justify-center w-[26px] h-[26px] border-[1.5px] border-current shrink-0" aria-hidden="true">
      {p === 'github' ? (
        <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] fill-current"><path d={GITHUB} /></svg>
      ) : (
        <b className="font-mono text-[10px]">{p === 'linkedin' ? 'in' : p === 'email' ? '@' : p.slice(0, 2)}</b>
      )}
      <span className="absolute -top-px -right-px w-[5px] h-[5px] bg-[#e85a2a]" />
    </span>
  )
}

const LABELS: Record<string, string> = { linkedin: 'LinkedIn', github: 'GitHub', twitter: 'X', instagram: 'Instagram', youtube: 'YouTube' }

export async function FooterComponent() {
  const [footer, profile] = await Promise.all([cms.findGlobal({ slug: 'footer' }), cms.findGlobal({ slug: 'profile' })])
  const p = profile as any
  const available = p?.available !== false
  const status = p?.availabilityText || (available ? 'Aceptando proyectos' : 'Agenda llena')
  const email = p?.email || 'contacto@soyroman.com'
  const msg = 'SOY ROMAN · MARKETING B2B · CDMX · '
  const tk = dotMatrix(msg + msg, '#f4f4f0', '#1d2023', 6)
  const link = 'font-mono text-[10px] uppercase font-bold tracking-widest py-2.5 border-b border-black/10 flex items-center justify-between hover:text-[#e85a2a] hover:pl-1.5 transition-all'

  return (
    <footer className="bg-[#f4f4f4] border-t border-black mt-auto max-w-[1920px] mx-auto w-full">
      <div className="container mx-auto border-x border-black bg-white">
        {/* Cierre: invitación a hablar */}
        <section className="grid grid-cols-1 lg:grid-cols-12 bg-black text-white border-b border-black">
          <div className="lg:col-span-7 p-8 md:p-14">
            <h2 className="text-[clamp(2.4rem,5.5vw,5.2rem)] leading-[0.95] tracking-tighter font-semibold">
              ¿Tienes un reto de <span className="text-[#e85a2a]">marketing B2B</span>?
            </h2>
            <p className="font-mono text-sm leading-relaxed opacity-70 max-w-[46ch] mt-6">
              Generación de demanda, CRM, SEO/AEO y sitios que convierten. Cuéntame qué necesitas y te respondo personalmente.
            </p>
          </div>
          <div className="lg:col-span-5 p-8 md:p-14 flex flex-col justify-center gap-4 border-t lg:border-t-0 lg:border-l border-white/20">
            <Link href="/contacto" className="flex items-center justify-between h-14 px-5 border-2 border-white bg-[#e85a2a] font-mono text-[11px] uppercase font-bold tracking-widest shadow-[4px_4px_0_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#fff] transition-[transform,box-shadow]">
              Agendar una llamada <span aria-hidden="true">▸</span>
            </Link>
            <Link href="/consultoria" className="flex items-center justify-between h-14 px-5 border-2 border-white font-mono text-[11px] uppercase font-bold tracking-widest shadow-[4px_4px_0_#fff] hover:bg-white hover:text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#fff] transition-[transform,box-shadow,background-color,color]">
              Ver cómo trabajo <span aria-hidden="true">▸</span>
            </Link>
            <a href={`mailto:${email}`} className="font-mono text-xs opacity-60 hover:opacity-100 hover:text-[#e85a2a]">{email}</a>
          </div>
        </section>

        {/* El aparato del pie + enlaces */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-b border-black">
          <div className="lg:col-span-5 p-6 md:p-8 bg-[linear-gradient(180deg,#ecebe6,#dedcd5)] border-b lg:border-b-0 lg:border-r border-black">
            <div className="bg-[#07090a] border-2 border-black rounded-xl shadow-[inset_0_0_0_5px_#1b1e20] px-5 py-4 text-[#eceeea] [font-family:var(--font-aldrich),ui-monospace,monospace]">
              <div className="flex justify-between text-[9px] tracking-[0.2em] uppercase text-[#eceeea]/50">
                <span>SOY_ROMAN · SYS</span><b className="font-normal text-[#e85a2a]">● REC</b>
              </div>
              <div className="relative h-14 my-3 overflow-hidden" aria-hidden="true">
                <svg viewBox={`0 0 ${tk.w} ${tk.h}`} className="absolute left-0 top-1 h-[46px] w-auto max-w-none animate-[tickerscroll_16s_linear_infinite] motion-reduce:animate-none">{tk.dots}</svg>
              </div>
              <div className="flex flex-wrap items-end gap-4 border-t border-dashed border-white/20 pt-3">
                <CdmxClock />
                <span className="ml-auto flex items-center gap-2 text-[10px] tracking-[0.14em] uppercase">
                  <i className={`w-2 h-2 rounded-full ${available ? 'bg-[#3ddc84] shadow-[0_0_0_3px_rgba(61,220,132,.25)]' : 'bg-[#e85a2a] shadow-[0_0_0_3px_rgba(232,90,42,.25)]'} animate-[ledrec_2s_steps(1)_infinite] motion-reduce:animate-none`} />
                  {status}
                </span>
              </div>
            </div>
            <div className="h-3.5 mt-4 rounded-md bg-[radial-gradient(circle,#9a978e_2px,transparent_2.4px)] [background-size:10px_10px]" aria-hidden="true" />
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4">
            {GROUPS.map(([title, links]) => (
              <nav key={title} className="p-6 md:p-7 border-r border-b md:border-b-0 border-black last:border-r-0" aria-label={title}>
                <h4 className="font-mono text-[10px] uppercase font-bold tracking-widest opacity-50 mb-3">// {title}</h4>
                {links.map(([href, label]) => <Link key={href} href={href} className={link}>{label}</Link>)}
                {title === 'Sobre mí' && <CookieLink className={link} />}
              </nav>
            ))}
            <div className="p-6 md:p-7">
              <h4 className="font-mono text-[10px] uppercase font-bold tracking-widest opacity-50 mb-3">// Redes</h4>
              {(p?.socialLinks || []).map((s: any, i: number) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className={link}>
                  {LABELS[s.platform] || s.platform}
                  <SocialIcon platform={s.platform} />
                </a>
              ))}
              <a href={`mailto:${email}`} className={link}>Correo <SocialIcon platform="email" /></a>
            </div>
          </div>
        </section>

        <div className="px-5 py-3.5 bg-[#e5e5e5] flex flex-col sm:flex-row gap-2 items-center justify-between text-[9px] font-mono uppercase font-bold tracking-widest">
          <p>{footer?.copyright || `© ${new Date().getFullYear()} Román García`} · CDMX</p>
          <p className="opacity-55">Hecho con Next.js, Payload y un servidor propio</p>
        </div>
      </div>
    </footer>
  )
}

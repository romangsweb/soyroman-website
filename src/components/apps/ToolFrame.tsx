'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { RECURSOS } from '@/data/recursos'
import { MEETINGS } from '@/lib/meetings'
import { PERSON_ID, SITE } from '@/lib/seo'

const useTool = () => {
  const path = usePathname()
  return { path, tool: RECURSOS.find((r) => r.href && r.href === path) }
}

/** Encabezado de cada herramienta: migas, H1 con su nombre y datos estructurados (WebApplication + migas). */
export function ToolIntro() {
  const { path, tool } = useTool()
  if (path === '/recursos') {
    return (
      <div className="ti">
        <h1>Herramientas gratuitas de marketing B2B</h1>
        <p>Calculadoras, diagnósticos y analizadores para planear la demanda, medir el pipeline y revisar tu sitio.</p>
      </div>
    )
  }
  if (!tool?.href) return null
  const url = `${SITE}${tool.href}`
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${url}#app`,
        name: tool.name,
        description: tool.desc,
        url,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: 'es-MX',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'MXN' },
        author: { '@id': PERSON_ID },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Recursos', item: `${SITE}/recursos` },
          { '@type': 'ListItem', position: 3, name: tool.name, item: url },
        ],
      },
    ],
  }
  return (
    <div className="ti">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav className="ti-crumbs" aria-label="Migas de pan">
        <Link href="/recursos">Recursos</Link> <span aria-hidden="true">/</span> <span>{tool.code}</span>
      </nav>
      <h1>{tool.name}</h1>
      <p>{tool.desc}</p>
    </div>
  )
}

/** Cierre de cada herramienta: invitación a revisar el resultado juntos. */
export function ToolCall() {
  const { tool } = useTool()
  if (!tool?.href) return null
  return (
    <section className="ti-call" aria-label="Agendar una revisión">
      <div>
        <b>¿Lo revisamos juntos?</b>
        <span>30 minutos, con tu resultado en la mano: te digo qué haría primero y qué puedes dejar para después.</span>
      </div>
      <div className="ti-call-k">
        <a className="btn or" href={MEETINGS} target="_blank" rel="noopener noreferrer" data-cta="agendar" data-tool={tool.slug}>Agendar 30 minutos ▸</a>
        <Link className="btn" href="/consultoria">Cómo trabajo ▸</Link>
      </div>
    </section>
  )
}

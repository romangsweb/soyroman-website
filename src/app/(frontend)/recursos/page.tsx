import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { AppHeader } from '@/components/apps/Panels'
import { RECURSOS } from '@/data/recursos'
import { canonical } from '@/lib/seo'

// Una sola fuente: el catálogo (también alimenta la home, llms.txt y las recomendaciones)
const APPS = RECURSOS

export default function RecursosPage() {
  return (
    <>
      <AppHeader top="RECUR" bottom="SOS" cable="GRATIS" message="Herramientas para planear y medir marketing B2B" />
      <div className="cards">
        {APPS.map((a, i) =>
          a.href ? (
            <Link key={a.code} href={a.href} className="card">
              <div className="ct"><span>{String(i + 1).padStart(2, '0')} · {a.name}</span><span>▸</span></div>
              <div className="cm">{a.code}</div>
              <p className="cd">{a.desc}</p>
              <div className="cg" aria-hidden="true" />
            </Link>
          ) : (
            <div key={a.code} className="card soon" aria-disabled="true">
              <div className="ct"><span>{String(i + 1).padStart(2, '0')} · {a.name}</span><span>Pronto</span></div>
              <div className="cm" style={{ opacity: 0.45 }}>{a.code}</div>
              <p className="cd">{a.desc}</p>
              <div className="cg" aria-hidden="true" />
            </div>
          ),
        )}
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos'),
  title: 'Recursos',
  description:
    'Calculadoras y herramientas gratuitas de marketing B2B: embudo inverso de leads, presupuesto de marketing, ROAS, ROMI y ROI, diagnóstico RevOps e ICP.',
}

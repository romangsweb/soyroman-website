import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { AppHeader } from '@/components/apps/Panels'

const APPS = [
  { href: '/recursos/embudo-inverso', code: 'EMBUDO I', name: 'Embudo inverso', desc: 'De tu meta de ingresos a los leads, MQL y SQL que necesitas cada mes.' },
  { href: '/recursos/roas-romi-roi', code: 'RENDIMIENTO', name: 'ROAS · ROMI · ROI', desc: 'Los tres indicadores de retorno con sus fórmulas y tus números.' },
  { href: null, code: 'MADUREZ', name: 'Diagnóstico RevOps', desc: '10 preguntas para medir la madurez de tu operación de revenue.' },
  { href: null, code: 'ICP', name: 'Generador de ICP', desc: 'Arma el perfil de tu cliente ideal y descárgalo en PDF.' },
]

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
  title: 'Recursos',
  description: 'Calculadoras y herramientas gratuitas de marketing B2B: embudo inverso de leads, ROAS, ROMI y ROI.',
}

import type { Metadata } from 'next'
import React from 'react'

import { CplApp } from '@/components/apps/CplApp'
import { canonical } from '@/lib/seo'

export default function CplMaximoPage() {
  return (
    <>
      <CplApp />
      <div className="note">
        <b>Cómo funciona:</b> el margen de tu primer negocio por la parte que estás dispuesto a invertir para conseguir el cliente
        da el <b>CAC máximo</b>. Multiplicado por tu conversión de lead a cliente sale el <b>CPL máximo</b>, y por tu conversión de
        visita a lead, el <b>CPC máximo</b> para pujar en anuncios. Elige una variable con las teclas <b>A–G</b>. Los valores por
        defecto son de ejemplo y coinciden con el Embudo inverso y el Planificador de presupuesto.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos/cpl-maximo'),
  title: 'Calculadora de CPL y CPC máximo',
  description: '¿Cuánto puedes pagar por un lead y por un clic sin perder dinero? Calcula tu CAC, CPL y CPC máximos desde tu margen y tu conversión.',
}

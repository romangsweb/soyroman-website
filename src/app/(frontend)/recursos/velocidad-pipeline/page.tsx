import type { Metadata } from 'next'
import React from 'react'

import { VelocityApp } from '@/components/apps/VelocityApp'
import { canonical } from '@/lib/seo'

export default function VelocidadPipelinePage() {
  return (
    <>
      <VelocityApp />
      <div className="note">
        <b>Cómo funciona:</b> la velocidad de pipeline es oportunidades abiertas × ticket promedio × tasa de cierre ÷ días del
        ciclo de venta: cuánto dinero sale de tu pipeline por día. Con la meta del trimestre te dice cuánto tendría que moverse
        cada palanca por separado. En <b>Comparar dos trimestres</b> reparte el cambio entre las cuatro palancas para que sepas
        cuál lo explicó. <b>Límite:</b> la fórmula supone que el pipeline se repone al ritmo en que cierra; usa promedios de tu CRM
        de los últimos 2 o 3 trimestres.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos/velocidad-pipeline'),
  title: 'Calculadora de velocidad de pipeline (sales velocity)',
  description: 'Calcula gratis cuánto dinero sale de tu pipeline por día, qué palanca mover para llegar a la meta del trimestre y qué explicó el cambio contra el trimestre anterior.',
}

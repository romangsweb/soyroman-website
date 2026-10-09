import type { Metadata } from 'next'
import React from 'react'

import { LtvApp } from '@/components/apps/LtvApp'
import { toolMeta } from '@/data/recursosSeo'

export default function LtvCacPage() {
  return (
    <>
      <LtvApp />
      <div className="note">
        <b>Cómo funciona:</b> el CAC es lo que gastaste en marketing y ventas en un periodo dividido entre los clientes nuevos de
        ese periodo. El LTV es el <b>margen</b> (no el ingreso) que deja un cliente mientras se queda: margen mensual × vida
        promedio, donde la vida es 1 ÷ la tasa de cancelación mensual, con un tope de 10 años. En <b>Proyecto + recurrente</b>
        se suma el margen de la implementación inicial. El payback es el mes en que el margen acumulado, ajustado por
        cancelaciones, cubre lo que costó conseguir al cliente. <b>Límite:</b> las referencias son reglas de la industria, no
        estudios con muestra.
      </div>
    </>
  )
}

export const metadata: Metadata = toolMeta('ltv-cac')

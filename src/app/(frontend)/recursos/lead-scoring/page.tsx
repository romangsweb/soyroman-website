import type { Metadata } from 'next'
import React from 'react'

import { ScoringApp } from '@/components/apps/ScoringApp'
import { toolMeta } from '@/data/recursosSeo'

export default function LeadScoringPage() {
  return (
    <>
      <ScoringApp />
      <div className="note">
        <b>Cómo funciona:</b> el modelo tiene dos ejes, <b>perfil</b> (quién es: industria, tamaño, puesto) e <b>interés</b> (qué
        hace: pidió demo, visitó precios, asistió a un webinar). Un lead pasa a ventas cuando suma el umbral y además tiene el
        perfil mínimo. Para calibrarlo, sube tus contactos con una columna que diga si se volvieron cliente: por cada atributo
        comparo su conversión contra el promedio (lift) y sugiero puntos, 10 × log₂ del lift. El archivo se procesa en tu
        navegador. <b>Límite:</b> el lift muestra asociación, no causa; los valores con menos de 30 contactos no se sugieren, y los
        campos que se llenan después de la venta (etapa, negocio) se marcan como posible fuga.
      </div>
    </>
  )
}

export const metadata: Metadata = toolMeta('lead-scoring')

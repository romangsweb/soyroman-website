import type { Metadata } from 'next'
import React from 'react'

import { RoasApp } from '@/components/apps/RoasApp'

export default function RoasPage() {
  return (
    <>
      <RoasApp />
      <div className="note">
        <b>Diferencia clave:</b> el ROAS solo mira ingresos contra inversión en medios; el ROMI descuenta el margen y suma todos los
        costos de marketing, por eso un ROAS alto puede esconder un ROMI negativo. El ROI aquí se calcula sobre ingresos, sin margen.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  title: 'Calculadora de ROAS, ROMI y ROI',
  description: 'Calcula ROAS, ROMI y ROI de tus campañas con sus fórmulas y entiende por qué un ROAS alto no siempre es rentable.',
}

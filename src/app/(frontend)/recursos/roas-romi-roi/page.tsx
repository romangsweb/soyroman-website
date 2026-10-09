import type { Metadata } from 'next'
import React from 'react'

import { RoasApp } from '@/components/apps/RoasApp'
import { toolMeta } from '@/data/recursosSeo'

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

export const metadata: Metadata = toolMeta('roas-romi-roi')

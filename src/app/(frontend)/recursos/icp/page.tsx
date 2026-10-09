import type { Metadata } from 'next'
import React from 'react'

import { IcpApp } from '@/components/apps/IcpApp'
import { toolMeta } from '@/data/recursosSeo'

export default function IcpPage() {
  return (
    <>
      <IcpApp />
      <div className="note">
        <b>Cómo usarlo:</b> responde pensando en tus mejores clientes actuales, no en los que te gustaría tener. Las implicaciones
        son reglas de referencia (ticket, ciclo y tamaño de empresa) para decidir canal y forma de venta; ajústalas con tus datos.
      </div>
    </>
  )
}

export const metadata: Metadata = toolMeta('icp')

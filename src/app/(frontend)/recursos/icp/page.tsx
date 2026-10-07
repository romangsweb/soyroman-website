import type { Metadata } from 'next'
import React from 'react'

import { IcpApp } from '@/components/apps/IcpApp'

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

export const metadata: Metadata = {
  title: 'Generador de perfil de cliente ideal (ICP)',
  description: 'Define tu perfil de cliente ideal B2B en 6 pasos: industria, tamaño, ticket, ciclo de compra, quién decide y qué los dispara. Descárgalo en PDF.',
}

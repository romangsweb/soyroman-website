import type { Metadata } from 'next'
import React from 'react'

import { AppHeader } from '@/components/apps/Panels'
import { RecursosGrid } from '@/components/apps/RecursosGrid'
import { RECURSOS } from '@/data/recursos'
import { canonical } from '@/lib/seo'

// Una sola fuente: el catálogo (también alimenta la home, llms.txt y las recomendaciones)
export default function RecursosPage() {
  return (
    <>
      <AppHeader top="RECUR" bottom="SOS" cable="GRATIS" message={`${RECURSOS.filter((r) => r.href).length} herramientas para planear, medir y diagnosticar marketing B2B`} />
      <RecursosGrid items={RECURSOS} />
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos'),
  title: 'Recursos: herramientas gratuitas de marketing B2B',
  description:
    'Calculadoras, diagnósticos y analizadores gratuitos de marketing B2B: embudo y presupuesto, pipeline, auditor AEO, velocidad, correo, stack, competidores y búsquedas.',
}

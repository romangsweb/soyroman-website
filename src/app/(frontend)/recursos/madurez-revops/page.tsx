import type { Metadata } from 'next'
import React from 'react'

import { MaturityApp } from '@/components/apps/MaturityApp'
import { toolMeta } from '@/data/recursosSeo'

export default function MadurezRevOpsPage() {
  return (
    <>
      <MaturityApp />
      <div className="note">
        <b>Cómo funciona:</b> 10 preguntas en cinco áreas (datos y CRM, procesos, alineación, medición y tecnología). Cada
        respuesta va del 1 (no existe) al 5 (optimizado). La puntuación de cada área es el promedio de sus respuestas llevado a
        una escala de 0 a 100. No hay respuestas correctas: sirve para decidir por dónde empezar.
      </div>
    </>
  )
}

export const metadata: Metadata = toolMeta('madurez-revops')

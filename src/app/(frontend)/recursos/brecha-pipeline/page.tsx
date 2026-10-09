import type { Metadata } from 'next'
import React from 'react'

import { PipelineApp } from '@/components/apps/PipelineApp'
import { toolMeta } from '@/data/recursosSeo'

export default function BrechaPipelinePage() {
  return (
    <>
      <PipelineApp />
      <div className="note">
        <b>Cómo funciona:</b> el forecast ponderado suma lo que ya ganaste y cada etapa multiplicada por su probabilidad de
        ganarse <b>dentro del trimestre</b> (no "algún día": así el forecast no se infla). La <b>brecha</b> es lo que falta para la
        meta y la <b>cobertura</b> divide tu pipeline abierto entre lo que falta. Puedes renombrar las etapas como las llamas en tu
        CRM. La <b>probabilidad de llegar</b> simula 10,000 trimestres: cada etapa se parte en negocios del tamaño de tu ticket y
        cada uno se gana o no según su probabilidad. Los montos y probabilidades por defecto son de ejemplo: usa los de tu histórico.
      </div>
    </>
  )
}

export const metadata: Metadata = toolMeta('brecha-pipeline')

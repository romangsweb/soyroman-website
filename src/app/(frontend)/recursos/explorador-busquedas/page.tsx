import type { Metadata } from 'next'
import React from 'react'

import { KeywordApp } from '@/components/apps/KeywordApp'
import { canonical } from '@/lib/seo'

export default function ExploradorBusquedasPage() {
  return (
    <>
      <KeywordApp />
      <div className="note">
        <b>Cómo funciona:</b> escribe tu palabra en el buscador de Google con unas 30 variantes (preguntas como qué, cómo o
        cuánto, y términos de compra como mejor, precio o alternativas) y junta todas las sugerencias que aparecen. Esas son
        búsquedas que la gente hace de verdad. Cada una lleva una señal de popularidad según qué tan arriba la sugiere Google y
        en cuántas variantes se repite. Después, Gemini las agrupa en temas por intención y propone qué pieza de contenido
        escribir para cada uno. <b>Límite:</b> Google no publica el volumen de búsqueda en el autocompletado, así que la señal
        sirve para comparar entre búsquedas, no para saber cuántas personas buscan cada una.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos/explorador-busquedas'),
  title: 'Explorador de búsquedas: qué busca la gente sobre tu tema en Google',
  description: 'Encuentra gratis las búsquedas y preguntas reales alrededor de una palabra, agrupadas por intención, con ideas de contenido para cada tema.',
}

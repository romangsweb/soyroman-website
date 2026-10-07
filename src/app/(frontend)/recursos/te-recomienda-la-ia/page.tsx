import type { Metadata } from 'next'
import React from 'react'

import { AiApp } from '@/components/apps/AiApp'
import { canonical } from '@/lib/seo'

export default function TeRecomiendaLaIaPage() {
  return (
    <>
      <AiApp />
      <div className="note">
        <b>Cómo funciona:</b> le hace a Gemini, el modelo de Google, cinco preguntas que haría un comprador de tu servicio en tu
        mercado (quién lo ofrece, quién es mejor, cuánto cuesta, a quién contactar y qué revisar). Gemini responde con lo que
        aprendió de internet en su entrenamiento, como un chat sin búsqueda. Después se cuenta en cuántas respuestas apareces,
        en qué lugar y qué competidores menciona. Le pedimos que escriba cada empresa con su sitio web para poder identificarla.
        <b>Límites:</b> mide un solo motor y sin búsqueda en vivo, así que un sitio muy nuevo puede no aparecer aunque esté bien
        posicionado en Google; ChatGPT o Perplexity pueden responder distinto.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos/te-recomienda-la-ia'),
  title: '¿Te recomienda la IA? Revisa si Gemini menciona tu empresa',
  description: 'Descubre gratis si la IA recomienda tu empresa cuando alguien busca tu servicio: menciones, posición y competidores que menciona.',
}

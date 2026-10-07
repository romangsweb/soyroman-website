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
        mercado (quién lo ofrece, quién es mejor, cuánto cuesta, a quién contactar y qué revisar). Gemini busca en Google antes
        de responder. Después se cuenta en cuántas respuestas apareces, en qué lugar, qué competidores menciona y qué páginas
        consultó. Le pedimos que escriba cada empresa con su sitio web para poder identificarla. <b>Límites:</b> mide un solo
        motor, y las respuestas de la IA cambian con el tiempo; ChatGPT o Perplexity pueden responder distinto.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos/te-recomienda-la-ia'),
  title: '¿Te recomienda la IA? Revisa si Gemini menciona tu empresa',
  description: 'Descubre gratis si la IA recomienda tu empresa cuando alguien busca tu servicio: menciones, posición, competidores y fuentes que cita.',
}

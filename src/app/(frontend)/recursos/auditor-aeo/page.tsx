import type { Metadata } from 'next'
import React from 'react'

import { AeoApp } from '@/components/apps/AeoApp'

export default function AuditorAeoPage() {
  return (
    <>
      <AeoApp />
      <div className="note">
        <b>Cómo funciona:</b> el auditor visita tu sitio como lo haría un bot de IA y revisa nueve puntos en tres grupos.
        <b> Acceso:</b> si robots.txt y tu servidor dejan entrar a los bots de búsqueda con IA. <b>Lectura:</b> si tu contenido llega en el
        HTML sin depender de JavaScript, con título, descripción y llms.txt. <b>Estructura:</b> datos estructurados, sitemap, canónica e
        idioma. La prueba de JavaScript es una aproximación: cuenta el texto que llega en el HTML, no simula un navegador.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  title: 'Auditor AEO: ¿tu sitio está listo para la IA?',
  description:
    'Revisa gratis si ChatGPT, Claude, Perplexity y Google pueden leer y citar tu sitio: robots.txt, bots de IA, llms.txt, datos estructurados y más.',
}

import type { Metadata } from 'next'
import React from 'react'

import { StackApp } from '@/components/apps/StackApp'
import { canonical } from '@/lib/seo'

export default function RadiografiaStackPage() {
  return (
    <>
      <StackApp />
      <div className="note">
        <b>Cómo funciona:</b> el analizador lee la portada del sitio, sus encabezados y los registros DNS del dominio (MX, SPF y
        DMARC) y busca las señales de unas 80 herramientas de marketing B2B en ocho bandas: CMS, analítica, CRM, publicidad,
        conversión, privacidad, infraestructura y correo. Después traduce lo encontrado en un diagnóstico. <b>Límite:</b> las
        herramientas que se cargan desde Google Tag Manager no aparecen en el HTML y pueden no detectarse.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos/radiografia-stack'),
  title: 'Radiografía de stack de marketing: ¿qué tecnología usa un sitio?',
  description: 'Descubre gratis qué CMS, analítica, CRM, píxeles, chat y herramientas de correo usa un sitio web, con un diagnóstico de lo que le falta.',
}

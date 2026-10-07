import type { Metadata } from 'next'
import React from 'react'

import { CompareApp } from '@/components/apps/CompareApp'
import { canonical } from '@/lib/seo'

export default function ComparadorPage() {
  return (
    <>
      <CompareApp />
      <div className="note">
        <b>Cómo funciona:</b> corre al mismo tiempo tres herramientas sobre cada dominio: el <b>auditor AEO</b> (qué tan bien
        leen el sitio los buscadores con IA), la <b>radiografía de stack</b> (CRM, analítica, publicidad, agenda y correo) y los
        <b> datos de usuarios reales de Chrome</b> (velocidad móvil). Después pone los resultados lado a lado y señala dónde
        ganas y dónde pierdes. <b>Límite:</b> todo sale de señales públicas; las herramientas cargadas desde Tag Manager y los
        sitios con poco tráfico pueden mostrar datos incompletos.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos/comparador-competidores'),
  title: 'Comparador de competidores: velocidad, IA y stack de marketing lado a lado',
  description: 'Compara gratis tu sitio con hasta dos competidores: velocidad real, preparación para buscadores con IA, CRM, publicidad y correo.',
}

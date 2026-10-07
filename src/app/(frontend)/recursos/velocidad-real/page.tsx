import type { Metadata } from 'next'
import React from 'react'

import { SpeedApp } from '@/components/apps/SpeedApp'
import { canonical } from '@/lib/seo'

export default function VelocidadRealPage() {
  return (
    <>
      <SpeedApp />
      <div className="note">
        <b>Cómo funciona:</b> primero consulta el Chrome UX Report, el informe público de Google con los tiempos de carga que
        vivieron las visitas reales del sitio en los últimos 28 días. Después pide a PageSpeed Insights una prueba de
        laboratorio, que simula una visita y estima cuánto tiempo ahorra cada arreglo. <b>Core Web Vitals</b> son tres de esas
        métricas (carga, interacción y estabilidad) y Google las usa como señal para posicionar. <b>Límite:</b> los sitios con
        poco tráfico no tienen datos de campo; en ese caso solo verás el laboratorio.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos/velocidad-real'),
  title: 'Velocidad real de un sitio: Core Web Vitals con datos de usuarios',
  description: 'Mide gratis qué tan rápido carga un sitio para sus visitas reales (LCP, INP y CLS) y qué arreglar primero, en móvil y escritorio.',
}

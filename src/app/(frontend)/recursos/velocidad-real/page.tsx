import type { Metadata } from 'next'
import React from 'react'

import { SpeedApp } from '@/components/apps/SpeedApp'
import { toolMeta } from '@/data/recursosSeo'

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

export const metadata: Metadata = toolMeta('velocidad-real')

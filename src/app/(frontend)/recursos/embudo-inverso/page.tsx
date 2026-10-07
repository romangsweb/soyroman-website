import type { Metadata } from 'next'
import React from 'react'

import { FunnelApp } from '@/components/apps/FunnelApp'
import { canonical } from '@/lib/seo'

export default function EmbudoInversoPage() {
  return (
    <>
      <FunnelApp />
      <div className="note">
        <b>Cómo funciona:</b> el cálculo va de abajo hacia arriba. Tu meta anual entre el ticket promedio da los negocios que
        necesitas; cada tasa de conversión multiplica hacia atrás hasta llegar a las visitas. Elige una variable con las teclas
        <b> A–G</b>, escribe el valor y pulsa <b>ENTER</b>, o muévela con el fader. El dato de MQL → SQL (6.5 %) es real; las demás
        tasas son valores de ejemplo: sustitúyelas por las de tu CRM.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos/embudo-inverso'),
  title: 'Calculadora de embudo inverso',
  description: 'Calcula cuántos leads, MQL, SQL y visitas necesitas al mes para llegar a tu meta de ingresos B2B.',
}

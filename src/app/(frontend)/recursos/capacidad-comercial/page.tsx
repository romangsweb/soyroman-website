import type { Metadata } from 'next'
import React from 'react'

import { CapacityApp } from '@/components/apps/CapacityApp'
import { canonical } from '@/lib/seo'

export default function CapacidadComercialPage() {
  return (
    <>
      <CapacityApp />
      <div className="note">
        <b>Cómo funciona:</b> de tu meta de ingresos nuevos y tu ticket salen los negocios que necesitas; con tu tasa de cierre y
        el paso de SQL a oportunidad, las oportunidades y reuniones calificadas por mes. Después se divide entre lo que entrega un
        SDR y lo que puede trabajar un vendedor, y se compara con la cuota: el número mayor manda y te dice cuál es tu cuello de
        botella. La línea de tiempo muestra cuándo empieza a cerrar alguien que contratas hoy (rampa + ciclo de venta).
        <b> Límite:</b> los valores por defecto son de ejemplo; sustitúyelos por los de tu equipo.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos/capacidad-comercial'),
  title: 'Plan de capacidad comercial: ¿cuántos SDR y vendedores necesitas?',
  description: 'Calcula gratis cuántos SDR y vendedores necesitas para tu meta, cuál es tu cuello de botella y cuándo empieza a cerrar alguien que contratas hoy.',
}

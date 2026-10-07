import type { Metadata } from 'next'
import React, { Suspense } from 'react'

import { BudgetApp } from '@/components/apps/BudgetApp'
import { canonical } from '@/lib/seo'

export default function PresupuestoPage() {
  return (
    <>
      <Suspense fallback={null}>
        <BudgetApp />
      </Suspense>
      <div className="note">
        <b>Cómo funciona:</b> tu meta entre el ticket da los clientes que necesitas; con la conversión de lead a cliente salen los
        leads, y con el costo por lead, la inversión en medios. A eso se suman tus costos fijos (herramientas, contenido, equipo).
        Elige una variable con las teclas <b>A–J</b> y reparte los medios con los faders. Los valores por defecto son de ejemplo y
        coinciden con el <b>Embudo inverso</b>: si llegas desde ahí, se cargan tus números. El <b>adelanto de caja</b> es lo que
        inviertes antes del primer ingreso, porque la venta tarda varios meses.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos/presupuesto-marketing'),
  title: 'Planificador de presupuesto de marketing B2B',
  description:
    'Calcula tu presupuesto anual de marketing B2B desde tu meta de ingresos: inversión por canal, CAC, ROMI y adelanto de caja.',
}

import type { Metadata } from 'next'
import React from 'react'

import { PlannerApp } from '@/components/apps/PlannerApp'
import { canonical } from '@/lib/seo'

export default function PlaneadorMarketingPage() {
  return (
    <>
      <PlannerApp />
      <div className="note">
        <b>Cómo funciona:</b> el plan empieza en la cuota de venta de cada unidad por trimestre y en qué parte origina marketing.
        Con tus tasas del embudo calcula hacia atrás el pipeline, las oportunidades, SQL, MQL y leads, y los recorre según el
        ciclo de venta para decirte <b>en qué mes</b> hay que generarlos. Después compara eso contra las actividades que
        planeaste (pestaña Cobertura), revisa el presupuesto y te deja capturar lo real de cada mes. El Excel trae las mismas
        hojas con fórmulas: si cambias una cuota o una tasa, se recalcula todo.
        <b> Límite:</b> el reparto de leads de cada actividad es parejo entre sus meses, y las tasas son promedios; úsalas de tu
        CRM. Lo que capturas se guarda solo en este navegador.
      </div>
    </>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/recursos/planeador-marketing'),
  title: 'Planeador de marketing B2B en Excel: de la cuota de venta a los leads por mes',
  description: 'Arma tu plan de marketing anual gratis: cuota por trimestre, leads que necesitas cada mes, actividades, presupuesto, KPIs, riesgos y seguimiento. Se descarga en Excel con fórmulas.',
}

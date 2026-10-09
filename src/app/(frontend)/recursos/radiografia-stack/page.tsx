import type { Metadata } from 'next'
import React from 'react'

import { StackApp } from '@/components/apps/StackApp'
import { toolMeta } from '@/data/recursosSeo'

export default function RadiografiaStackPage() {
  return (
    <>
      <StackApp />
      <div className="note">
        <b>Cómo funciona:</b> el analizador lee la portada del sitio, sus encabezados, los registros DNS del dominio (MX, SPF y
        DMARC) y, si el sitio usa Google Tag Manager, su contenedor público, donde están configuradas las etiquetas de
        analítica y publicidad. Busca las señales de unas 80 herramientas de marketing B2B en ocho bandas: CMS, analítica, CRM,
        publicidad, conversión, privacidad, infraestructura y correo, y traduce lo encontrado en un diagnóstico. Lo detectado
        dentro de Tag Manager aparece marcado como <i>vía GTM</i>. <b>Límite:</b> lo que se carga por otros gestores de
        etiquetas o desde el servidor puede no detectarse.
      </div>
    </>
  )
}

export const metadata: Metadata = toolMeta('radiografia-stack')

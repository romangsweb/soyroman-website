import type { Metadata } from 'next'
import React from 'react'

import { CrmAuditApp } from '@/components/apps/CrmAuditApp'
import { toolMeta } from '@/data/recursosSeo'

export default function AuditoriaCrmPage() {
  return (
    <>
      <CrmAuditApp />
      <div className="note">
        <b>Cómo funciona:</b> exporta tus contactos a CSV desde tu CRM (HubSpot, Salesforce, Pipedrive, Zoho o cualquier otro) y
        cárgalo aquí. El análisis corre <b>en tu navegador</b>: el archivo no se sube a ningún servidor y nadie más lo ve. Detecta
        las columnas por su nombre y revisa duplicados por correo, duplicados probables por nombre y empresa, correos inválidos o
        personales, contactos sin propietario, sin etapa del ciclo de vida y sin actividad en el último año. Si pides el plan por
        correo, solo se envían las cifras resumidas. <b>Límite:</b> analiza hasta 100,000 filas; la calificación de salud es
        propia de soyroman y sirve para comparar tu base contra sí misma en el tiempo.
      </div>
    </>
  )
}

export const metadata: Metadata = toolMeta('auditoria-crm')

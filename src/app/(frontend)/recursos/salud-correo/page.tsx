import type { Metadata } from 'next'
import React from 'react'

import { MailApp } from '@/components/apps/MailApp'
import { toolMeta } from '@/data/recursosSeo'

export default function SaludCorreoPage() {
  return (
    <>
      <MailApp />
      <div className="note">
        <b>Cómo funciona:</b> consulta los registros DNS públicos del dominio. <b>SPF</b> dice qué servidores pueden enviar en
        su nombre, <b>DKIM</b> firma cada correo, <b>DMARC</b> le dice al receptor qué hacer con los correos que fallan y
        <b> MTA-STS</b>, <b>TLS-RPT</b> y <b>BIMI</b> agregan cifrado, reportes y logo. También busca el dominio en tres listas
        negras públicas. Desde 2024, Gmail y Yahoo exigen SPF, DKIM y DMARC a quien envía correos masivos. <b>Límites:</b> DKIM
        se busca en los selectores más comunes, así que puede existir con uno propio aunque no aparezca, y algunas listas negras
        no responden a consultas desde servidores en la nube.
      </div>
    </>
  )
}

export const metadata: Metadata = toolMeta('salud-correo')

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { LoginForm } from '@/components/taller/LoginForm'
import { currentUser } from '@/lib/auth'

import '../recursos/apps.css'

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser().catch(() => null)) redirect('/taller')
  const { error } = await searchParams
  return (
    <div className="te-app border-x border-black max-w-[1920px] mx-auto">
      <div className="te-wrap tl-enter">
        <span className="tl-kicker">MI TALLER · GRATIS</span>
        <h1>Guarda tus resultados y vuelve a ellos</h1>
        <ul>
          <li>Historial de cada herramienta para comparar trimestre contra trimestre.</li>
          <li>Reabre cualquier resultado con tus números cargados.</li>
          <li>Pronto: perfil de empresa que precarga las herramientas y radar de IA mensual.</li>
        </ul>
        {error && <p className="tl-err" role="alert">El enlace ya se usó o venció. Pide uno nuevo.</p>}
        <LoginForm callbackURL="/taller" />
      </div>
    </div>
  )
}

export const metadata: Metadata = { title: 'Entrar a Mi taller', robots: { index: false, follow: false } }

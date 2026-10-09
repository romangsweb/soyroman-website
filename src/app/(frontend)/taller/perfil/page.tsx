import { redirect } from 'next/navigation'
import React from 'react'

import { getMyProfile } from '@/actions/tallerProfile'
import { SignOut } from '@/components/taller/ClaimPending'
import { DeleteAccount } from '@/components/taller/DeleteAccount'
import { ProfileForm } from '@/components/taller/ProfileForm'
import { TallerNav } from '@/components/taller/TallerNav'
import { currentUser } from '@/lib/auth'
import { completeness } from '@/lib/taller/profile'

export default async function PerfilPage() {
  const user = await currentUser()
  if (!user) redirect('/entrar')
  const profile = await getMyProfile()

  return (
    <>
      <div className="tl-head">
        <div>
          <span className="tl-kicker">MI TALLER · SE LLENA UNA VEZ</span>
          <h1>Perfil de empresa</h1>
          <p>Estos datos precargan las herramientas. Puedes cambiarlos dentro de cualquier herramienta sin tocar tu perfil.</p>
        </div>
        <SignOut />
      </div>
      <TallerNav active="perfil" profilePct={completeness(profile?.data ?? {})} />
      <ProfileForm initial={profile} />
      <section className="tl-account" aria-labelledby="tl-acc">
        <h2 id="tl-acc" className="tl-h2">Tu cuenta</h2>
        <p>{user.email}</p>
        <div className="tl-links">
          <a className="btn" href="/next/taller/export">Descargar mis datos</a>
          <DeleteAccount />
        </div>
      </section>
    </>
  )
}

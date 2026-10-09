import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { ForgetItem } from '@/components/taller/ForgetItem'
import { TallerNav } from '@/components/taller/TallerNav'
import { currentUser } from '@/lib/auth'
import { fecha } from '@/lib/taller/dates'
import { libraryFor } from '@/lib/taller/queries'

const href = (kind: string, slug: string) => (kind === 'term' ? `/glosario/${slug}` : `/blog/${slug}`)
const kindLabel = (kind: string) => (kind === 'term' ? 'GLOSARIO' : 'ARTÍCULO')

export default async function BibliotecaPage() {
  const user = await currentUser()
  if (!user) redirect('/entrar')
  const { saved, read } = await libraryFor(user.id)

  return (
    <>
      <div className="tl-head">
        <div>
          <span className="tl-kicker">MI TALLER</span>
          <h1>Biblioteca</h1>
          <p>Lo que guardas desde el blog y el glosario, y lo que ya leíste.</p>
        </div>
      </div>
      <TallerNav active="biblioteca" admin={user.role === 'admin'} />

      <section aria-labelledby="tl-sav">
        <h2 id="tl-sav" className="tl-h2">Guardados <small>· {saved.length}</small></h2>
        {saved.length ? (
          <ul className="tl-list">
            {saved.map((r) => (
              <li key={r.id}>
                <span className="tl-list-k">{kindLabel(r.kind)}</span>
                <Link href={href(r.kind, r.slug)}>{r.title || r.slug}</Link>
                <small>{r.readAt ? 'leído' : 'por leer'} · {fecha(r.savedAt!)}</small>
                <ForgetItem id={r.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="tl-empty">Aún no guardas nada. En cualquier artículo o término del glosario pulsa «Guardar en mi biblioteca».</p>
        )}
      </section>

      <section aria-labelledby="tl-read">
        <h2 id="tl-read" className="tl-h2">Leídos recientemente <small>· {read.length}</small></h2>
        {read.length ? (
          <ul className="tl-list">
            {read.slice(0, 30).map((r) => (
              <li key={r.id}>
                <span className="tl-list-k">{kindLabel(r.kind)}</span>
                <Link href={href(r.kind, r.slug)}>{r.title || r.slug}</Link>
                <small>{fecha(r.readAt!)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tl-empty">Lo que leas con tu sesión abierta aparecerá aquí.</p>
        )}
      </section>
    </>
  )
}

'use client'

import Link from 'next/link'
import React, { useActionState } from 'react'

import { submitLead, type LeadState } from '@/actions/lead'
import { ArrowUpRight } from '@/components/icons'
import { SERVICES } from '@/data/services'

const input =
  'w-full px-4 py-4 bg-[#f4f4f4] border border-black text-sm font-mono focus:outline-none focus:bg-white focus:border-[#e85a2a] transition-all'
const label = 'block text-[10px] font-mono font-bold uppercase tracking-widest mb-3 opacity-60'

type Props = { origin?: string; showService?: boolean }

export function ContactForm({ origin = 'Contacto', showService = true }: Props) {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, { status: 'idle' })

  if (state.status === 'ok') {
    return (
      <div role="status" className="border border-black bg-white p-8 md:p-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-3 h-3 bg-[#e85a2a]" />
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-60">Mensaje recibido</p>
        </div>
        <p className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">Gracias, te respondo pronto.</p>
        <p className="font-mono text-sm opacity-70">Normalmente contesto en uno o dos días hábiles.</p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-8 relative z-10" noValidate={false}>
      <input type="hidden" name="origin" value={origin} />
      {/* Campo trampa para bots: oculto a personas y lectores de pantalla */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Sitio web</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label htmlFor="name" className={label}>Nombre</label>
          <input id="name" name="name" type="text" required autoComplete="name" className={input} placeholder="Tu nombre" />
        </div>
        <div>
          <label htmlFor="company" className={label}>Empresa</label>
          <input id="company" name="company" type="text" autoComplete="organization" className={input} placeholder="Empresa" />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={label}>Correo</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={input} placeholder="tu@empresa.com" />
      </div>

      {showService && (
        <div>
          <label htmlFor="service" className={label}>Servicio de interés</label>
          <select id="service" name="service" className={input} defaultValue="">
            <option value="">Aún no lo sé</option>
            {SERVICES.map((s) => (
              <option key={s.id} value={s.title}>{s.title}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="message" className={label}>Mensaje</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className={`${input} resize-none`}
          placeholder="Cuéntame tu situación: qué vendes, cómo consigues clientes hoy y qué te gustaría lograr."
        />
      </div>

      {state.status === 'error' && (
        <p role="alert" className="font-mono text-sm text-[#e85a2a] border border-[#e85a2a] px-4 py-3">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full group/btn flex items-center justify-between px-8 py-6 bg-black text-white font-mono font-bold uppercase tracking-widest text-xs hover:bg-[#e85a2a] transition-colors border border-black disabled:opacity-60 disabled:cursor-wait"
      >
        <span>{pending ? 'Enviando…' : 'Enviar'}</span>
        <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
      </button>

      <p className="font-mono text-[11px] leading-relaxed opacity-60">
        Al enviar aceptas el{' '}
        <Link href="/privacidad" className="underline hover:text-[#e85a2a]">aviso de privacidad</Link>. Uso tus datos solo
        para responderte.
      </p>
    </form>
  )
}

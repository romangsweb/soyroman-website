'use client'

import React, { useState } from 'react'

import { deleteRun } from '@/actions/taller'

/** Borra una corrida (pide confirmar con un segundo clic, sin diálogos del navegador). */
export function DeleteRun({ id }: { id: string }) {
  const [armed, setArmed] = useState(false)
  return (
    <button type="button" className="tl-del" onClick={() => (armed ? deleteRun(id) : setArmed(true))} onBlur={() => setArmed(false)}>
      {armed ? '¿Borrar? Clic otra vez' : 'Borrar'}
    </button>
  )
}

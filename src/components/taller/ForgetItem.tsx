'use client'

import React from 'react'

import { forgetItem } from '@/actions/tallerLibrary'

export function ForgetItem({ id }: { id: string }) {
  return <button type="button" className="tl-del" onClick={() => forgetItem(id)}>Quitar</button>
}

'use client'

import Link from 'next/link'
import React, { useMemo, useState } from 'react'

import { Device, ListMode, defaults, fmt, type Param, type Values } from './Device'
import { AppHeader, Library } from './Panels'

const PARAMS: Param[] = [
  { id: 'spend', key: 'A', label: 'Inversión en medios', unit: '$', min: 100, max: 5000000, step: 100, val: 20000, log: true, hint: 'USD' },
  { id: 'other', key: 'B', label: 'Otros costos de marketing', unit: '$', min: 0, max: 5000000, step: 100, val: 5000, hint: 'herramientas, agencia, equipo' },
  { id: 'rev', key: 'C', label: 'Ingresos atribuidos', unit: '$', min: 0, max: 50000000, step: 1000, val: 120000, hint: 'USD' },
  { id: 'margin', key: 'D', label: 'Margen bruto', unit: '%', min: 1, max: 100, step: 1, val: 40, hint: 'porcentaje' },
]

export function RoasApp() {
  const [v, setV] = useState<Values>(() => defaults(PARAMS))
  const o = useMemo(() => {
    const cost = v.spend + v.other
    return { cost, roas: v.rev / v.spend, romi: ((v.rev * v.margin) / 100 - cost) / cost * 100, roi: (v.rev - cost) / cost * 100 }
  }, [v])
  const neg = (x: number, s: string) => (x < 0 ? <b style={{ color: 'var(--or)', fontWeight: 400 }}>{s}</b> : s)
  const term = (slug: string, label: React.ReactNode) => <Link href={`/glosario/${slug}`} style={{ color: 'inherit' }}>{label}</Link>

  return (
    <>
      <AppHeader
        top="ROAS"
        bottom="ROMI"
        cable="GLOSARIO"
        message={o.romi < 0
          ? `ROAS de ${fmt(o.roas, 1)}x, pero con tu margen el ROMI es negativo`
          : `Cada dólar en marketing regresa ${fmt(1 + o.romi / 100, 2)} dólares de margen`}
      />
      <div className="scene">
        <Device
          model="RENDIMIENTO"
          sub="roas · romi · roi"
          tab="Inversión → retorno"
          planLabel="GLOS."
          params={PARAMS}
          values={v}
          onChange={setV}
          big={<>{fmt(o.roas, 1)}<span style={{ fontSize: '.35em', opacity: 0.55 }}>x ROAS</span></>}
          readings={[['ROMI', neg(o.romi, `${fmt(o.romi)}%`)], ['ROI', neg(o.roi, `${fmt(o.roi)}%`)], ['Costo total', `$${fmt(o.cost)}`]]}
          onPlan={() => { window.location.href = '/glosario/roas' }}
        />
        <div>
          <Library
            title="Fórmulas"
            blanks={2}
            rows={[
              { active: true, label: <>{term('roas', 'ROAS')} = ingresos ÷ medios<br /><small style={{ opacity: 0.6, textTransform: 'none' }}>${fmt(v.rev)} ÷ ${fmt(v.spend)}</small></>, value: `${fmt(o.roas, 1)}x` },
              { label: <>{term('romi', 'ROMI')} = (ingresos × margen − costo) ÷ costo<br /><small style={{ opacity: 0.6, textTransform: 'none' }}>(${fmt((v.rev * v.margin) / 100)} − ${fmt(o.cost)}) ÷ ${fmt(o.cost)}</small></>, value: neg(o.romi, `${fmt(o.romi)}%`) },
              { label: <>{term('roi', 'ROI')} = (ingresos − costo) ÷ costo<br /><small style={{ opacity: 0.6, textTransform: 'none' }}>(${fmt(v.rev)} − ${fmt(o.cost)}) ÷ ${fmt(o.cost)}</small></>, value: neg(o.roi, `${fmt(o.roi)}%`) },
            ]}
          />
          <ListMode params={PARAMS} values={v} onChange={setV} />
        </div>
      </div>
    </>
  )
}

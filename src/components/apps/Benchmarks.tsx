'use client'

import React from 'react'

import type { Source } from '@/data/benchmarks'

export type BenchRow = {
  label: string
  yours: string
  ref: string
  status: 'low' | 'ok' | 'high' | 'fit' | 'nofit' | 'none'
  note?: string
}

const TXT = { low: 'abajo', ok: 'en rango', high: 'arriba', fit: 'cabe', nofit: 'no cabe', none: '—' } as const

/** Panel "Referencia de la industria": tu número contra una referencia con fuente. */
export function Benchmarks({ title, rows, sources, caveat }: { title: string; rows: BenchRow[]; sources: Source[]; caveat?: string }) {
  return (
    <section className="bm" aria-label={title}>
      <div className="bm-h"><b>Referencia</b><span>{title}</span></div>
      <table className="bm-t">
        <thead><tr><th>Métrica</th><th>Tú</th><th>Referencia</th><th /></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}{r.note && <small>{r.note}</small>}</td>
              <td>{r.yours}</td>
              <td>{r.ref}</td>
              <td><span className={`bm-s ${r.status}`}>{TXT[r.status]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bm-f">
        {sources.map((s) => (
          <p key={s.name}>
            <b>Fuente:</b> {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a> : s.name}. {s.note}
          </p>
        ))}
        {caveat && <p>{caveat}</p>}
      </div>
    </section>
  )
}

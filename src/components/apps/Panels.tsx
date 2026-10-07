import React from 'react'

/** Cabecera de un aplicativo: etiqueta tipo sticker, cable con rótulo y banner naranja de estado. */
export function AppHeader({ top, bottom, cable, message }: { top: string; bottom: string; cable: string; message: React.ReactNode }) {
  return (
    <div className="head">
      <div>
        <div className="sticker">
          <div className="big">
            RG<i className="screw s1" /><i className="screw s2" /><i className="screw s3" /><i className="screw s4" />
          </div>
          <div className="lab">
            <div className="t">{top}<i className="screw" style={{ left: 8 }} /><i className="screw" style={{ right: 8 }} /></div>
            <div className="b">
              {bottom}
              <i className="screw" style={{ left: 8, top: 8 }} /><i className="screw" style={{ right: 8, top: 8 }} />
              <i className="screw" style={{ left: 8, bottom: 8 }} /><i className="screw" style={{ right: 8, bottom: 8 }} />
            </div>
          </div>
        </div>
        <div className="ver">V 1.0 · RECURSOS</div>
      </div>
      <div className="cable" aria-hidden="true"><div className="wire" /><div className="tag">{cable}</div><div className="plug" /></div>
      <div className="banner"><div className="sq" /><div className="msg" aria-live="polite">{message}</div></div>
    </div>
  )
}

export type Row = { label: React.ReactNode; value?: React.ReactNode; meter?: number; won?: boolean; active?: boolean }

/** Hoja tipo "sample library": lomo naranja, filas numeradas y pila de hojas detrás. */
export function Library({ title, rows, blanks = 0, children }: { title: string; rows: Row[]; blanks?: number; children?: React.ReactNode }) {
  return (
    <div className="libwrap">
      {[0, 1, 2, 3, 4].map((i) => <div key={i} className="sheet" />)}
      <div className="lib">
        <div className="spine" />
        <div className="lib-main">
          <div className="lib-h"><h2>{title}</h2><span>ooo</span><span aria-hidden="true">↑</span><span aria-hidden="true">↓</span></div>
          {children ?? (
            <ol className="rows">
              {rows.map((r, i) => (
                <li key={i} className={`${r.active ? 'act ' : ''}${r.won ? 'won' : ''}`}>
                  <span className="rad" />
                  <span className="num">{i + 1}</span>
                  <span className="name">
                    {r.label}
                    {r.meter !== undefined && <i style={{ width: `${Math.max(3, Math.min(100, r.meter))}%` }} />}
                  </span>
                  <span className="val">{r.value}</span>
                </li>
              ))}
              {Array.from({ length: blanks }).map((_, i) => (
                <li key={`b${i}`} className="blank"><span className="rad" /><span className="num">{rows.length + i + 1}</span><span /><span /></li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

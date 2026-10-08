import type { Metadata } from 'next'
import React from 'react'

import { CERTS, CV_KPIS, CV_SUMMARY, LANGS, TOOLS, UNIVERSITY, cleanAchievements, yearRange } from '@/data/cv'
import { cms } from '@/lib/cms'

/**
 * Versión de una hoja A4 del CV para generar el PDF (Imprimir → Guardar como PDF, o Chromium headless).
 * El PDF resultante se sube en Payload → Profile → CV File.
 */
export const metadata: Metadata = { title: 'CV · Román García', robots: { index: false, follow: false } }

const CSS = `
@page{size:A4;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{background:#a8b1b8}
.page{width:210mm;min-height:297mm;margin:0 auto;background:#f4f4f1;padding:11mm 12mm;display:flex;flex-direction:column;gap:5mm;color:#111}
@media screen{.page{margin:24px auto;box-shadow:0 10px 30px rgba(0,0,0,.25)}}
@media print{body{background:#f4f4f1}}
.top{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:start;border-bottom:2px solid #111;padding-bottom:4mm}
.sys{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#6c757b;display:flex;gap:8px;align-items:center}.sys i{width:8px;height:8px;background:#e85a2a;display:inline-block}
h1{font-size:38px;font-weight:400;margin:8px 0 2px;letter-spacing:-.01em}
.role{font-size:13px;letter-spacing:.06em;text-transform:uppercase}
.lcd{background:#0b0d0c;color:#3ddc84;border:2px solid #111;border-radius:6px;padding:10px 12px;font-size:10px;line-height:1.7;min-width:230px}.lcd span{color:#6c7}
.sum{font-size:11.5px;line-height:1.65;margin:0;border-left:3px solid #e85a2a;padding-left:10px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);border:2px solid #111}
.kpis div{padding:9px;border-right:2px solid #111;background:#fff}.kpis div:last-child{border:0}
.kpis b{display:block;font-size:19px;font-weight:400;color:#e85a2a}.kpis span{font-size:8.5px;letter-spacing:.06em;text-transform:uppercase;line-height:1.4;display:block}
.grid{display:grid;grid-template-columns:1fr 54mm;gap:6mm;flex:1}
h2{font-size:9px;letter-spacing:.2em;text-transform:uppercase;font-weight:400;margin:0 0 8px;color:#6c757b}h2 em{color:#e85a2a;font-style:normal}
.job{display:grid;grid-template-columns:78px 1fr;gap:10px;border-top:1px solid #000;padding:8px 0;break-inside:avoid}
.yr{font-size:8.5px;background:#111;color:#fff;padding:3px 4px;align-self:start;text-align:center;letter-spacing:.02em;white-space:nowrap}.yr.now{background:#e85a2a}
.job h3{margin:0;font-size:13px;font-weight:400}.co{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:#6c757b;margin:2px 0 4px}
.job ul{margin:0;padding:0;list-style:none}.job li{font-size:10.5px;line-height:1.5;padding-left:12px;position:relative}.job li::before{content:">";position:absolute;left:0;color:#e85a2a}
.side{display:flex;flex-direction:column;gap:5mm}
.box{border:2px solid #111;background:#fff;padding:9px}
.chips{display:flex;flex-wrap:wrap;gap:4px}.chips span{font-size:8.5px;letter-spacing:.06em;text-transform:uppercase;border:1px solid #111;padding:2px 5px;background:#e5e5e2}
.cert{font-size:10px;line-height:1.5;margin:0 0 6px}.cert b{font-weight:400;display:block;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#e85a2a}
.lang{display:flex;justify-content:space-between;align-items:center;font-size:10px;padding:3px 0;border-top:1px dashed #999}.lang:first-child{border:0}
.meter{display:flex;gap:2px}.meter i{width:8px;height:8px;border:1px solid #111;display:inline-block}.meter i.on{background:#e85a2a}
.foot{display:flex;justify-content:space-between;align-items:center;border-top:2px solid #111;padding-top:3mm;font-size:9px;letter-spacing:.1em;text-transform:uppercase}
.dots{width:120px;height:18px;background:radial-gradient(circle,#111 1.6px,transparent 2px) 0 0/6px 6px}
`

export default async function CvPrintPage() {
  const experiences = await cms.find({ collection: 'experience', sort: 'order', limit: 50, depth: 0 })
  const docs = experiences.docs as any[]
  const work = docs.filter((e) => e.type !== 'education')
  const edu = docs.find((e) => e.type === 'education')
  const updated = new Date().toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="page">
        <div className="top">
          <div>
            <div className="sys"><i />SYS.05 // Currículum</div>
            <h1>Román García</h1>
            <div className="role">Director de marketing B2B</div>
          </div>
          <div className="lcd">
            &gt; contacto@soyroman.com<br />&gt; soyroman.com<br />&gt; linkedin.com/in/román-garcía<br />&gt; github.com/romangsweb<br />
            <span>&gt; Ciudad de México</span>
          </div>
        </div>
        <p className="sum">{CV_SUMMARY}</p>
        <div className="kpis">{CV_KPIS.map(([n, t]) => <div key={t}><b>{n}</b><span>{t}</span></div>)}</div>
        <div className="grid">
          <div>
            <h2><em>//</em> Experiencia</h2>
            {work.map((e) => {
              const items = cleanAchievements(e.achievements)
              return (
                <div key={e.id} className="job">
                  <span className={`yr${e.endDate ? '' : ' now'}`}>{yearRange(e.startDate, e.endDate)}</span>
                  <div>
                    <h3>{e.position}</h3>
                    <div className="co">{e.company}</div>
                    {items.length > 0 && <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="side">
            <div>
              <h2><em>//</em> Formación</h2>
              <div className="box">
                <p className="cert" style={{ margin: 0 }}>
                  <b>{edu ? yearRange(edu.startDate, edu.endDate) : '2012 — 2017'}</b>
                  {edu?.position || 'Licenciatura en Marketing, especialidad en Publicidad'} · {UNIVERSITY}
                </p>
              </div>
            </div>
            <div>
              <h2><em>//</em> Certificaciones</h2>
              <div className="box">
                {CERTS.map((c, i) => (
                  <p key={c.org} className="cert" style={i === CERTS.length - 1 ? { margin: 0 } : undefined}><b>{c.org}</b>{c.text}</p>
                ))}
              </div>
            </div>
            <div>
              <h2><em>//</em> Herramientas</h2>
              <div className="box chips">{TOOLS.map((t) => <span key={t}>{t}</span>)}</div>
            </div>
            <div>
              <h2><em>//</em> Idiomas</h2>
              <div className="box">
                {LANGS.map(([l, n]) => (
                  <div key={l} className="lang">
                    <span>{l}</span>
                    <span className="meter">{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < n ? 'on' : ''} />)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="foot"><span>soyroman.com/cv</span><span className="dots" /><span>Actualizado {updated}</span></div>
      </div>
    </>
  )
}

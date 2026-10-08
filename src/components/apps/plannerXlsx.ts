/**
 * Excel del planeador (PLAN·01) con fórmulas vivas: si cambias una cuota o una tasa
 * (celdas amarillas) se recalcula todo el libro. Recibe ExcelJS ya cargado para que la
 * librería solo se descargue cuando alguien pide el archivo.
 */
import type * as ExcelJSNS from 'exceljs'

import { LEVELS, MONTHS, QN, STAGES, STATUS, TYPES, leadsM, monthly, qOf, type Plan } from './planner'

type XL = typeof ExcelJSNS
type WS = ExcelJSNS.Worksheet
type R = ExcelJSNS.Row

export const colL = (n: number) => {
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}
const solid = (argb: string): ExcelJSNS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const INK = solid('FF111111')
const ORANGE = solid('FFE85A2A')
const SOFT = solid('FFF4F4F1')
const INPUT = solid('FFFFF3B0')
const WHITE_BOLD: Partial<ExcelJSNS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } }
const GREY: Partial<ExcelJSNS.Font> = { color: { argb: 'FF6C757B' } }
const head = (r: R) => r.eachCell((c) => { c.font = WHITE_BOLD; c.fill = INK })
const f = (formula: string) => ({ formula })

export function buildWorkbook(ExcelJS: XL, p: Plan) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'soyroman.com'
  const U = p.units
  const n = U.length
  const money = (p.cur === 'USD' ? '"US$"' : '"$"') + '#,##0'
  const int = '#,##0'
  const pct = '0%'
  const MC = "'Meta comercial'"
  const LM = "'Leads mensual'"
  const PM = "'Plan mensual'"
  const pctRule = (ws: WS, ref: string) =>
    ws.addConditionalFormatting({
      ref,
      rules: [
        { type: 'cellIs', operator: 'lessThan', formulae: [0.8], priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF8C9B8' } } } },
        { type: 'cellIs', operator: 'greaterThan', formulae: [0.9999], priority: 2, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFC8F0D8' } } } },
      ],
    })

  // Hojas en el orden en que se leen
  const rs = wb.addWorksheet('Resumen ejecutivo')
  const mc = wb.addWorksheet('Meta comercial')
  const es = wb.addWorksheet('Estrategia')
  const ac = wb.addWorksheet('Actividades')
  const pm = wb.addWorksheet('Plan mensual')
  const lm = wb.addWorksheet('Leads mensual')
  const cb = wb.addWorksheet('Cobertura')
  const sc = wb.addWorksheet('Escenarios')
  const pr = wb.addWorksheet('Presupuesto')
  const kp = wb.addWorksheet('KPIs')
  const sg = wb.addWorksheet('Seguimiento')
  const rk = wb.addWorksheet('Riesgos')

  // ───── Meta comercial
  mc.columns = [{ width: 42 }, ...Array.from({ length: 27 }, () => ({ width: 12 }))]
  mc.addRow([`${p.name} ${p.year} · Meta comercial`]).font = { bold: true, size: 14 }
  mc.addRow(['Las celdas amarillas son supuestos: cámbialas y todo el libro se recalcula.']).font = GREY
  mc.addRow(['Supuestos del embudo por unidad']).font = { bold: true }
  head(mc.addRow(['Unidad', '% de la venta que origina marketing', 'Oportunidad → venta', 'SQL → oportunidad', 'MQL → SQL', 'Lead → MQL', 'Ticket promedio', 'Ciclo de venta (meses)', 'Cobertura implícita', 'Conversión lead → venta']))
  mc.getRow(4).alignment = { wrapText: true, vertical: 'top' }
  mc.getRow(4).height = 42
  const UR: Record<string, number> = {}
  U.forEach((u) => {
    const r = mc.addRow([u.name, u.r.mk / 100, u.r.wr / 100, u.r.so / 100, u.r.ms / 100, u.r.lm / 100, u.r.tk, u.r.cy])
    const rn = r.number
    UR[u.name] = rn
    for (let k = 2; k <= 8; k++) {
      r.getCell(k).fill = INPUT
      r.getCell(k).numFmt = k <= 6 ? pct : k === 7 ? money : '0'
    }
    r.getCell(9).value = f(`IFERROR(1/C${rn},0)`)
    r.getCell(9).numFmt = '0.0"x"'
    r.getCell(10).value = f(`F${rn}*E${rn}*D${rn}*C${rn}`)
    r.getCell(10).numFmt = '0.00%'
  })
  const RS = 5
  const RE = 4 + n
  mc.addRow([])
  const qh = mc.addRow(['Cuota de venta', ...QN, 'Total', 'Pipeline abierto (cierra en Q1)', 'Q1 del año siguiente (para planear Q4)'])
  head(qh)
  qh.alignment = { wrapText: true, vertical: 'top' }
  qh.height = 42
  const QR: Record<string, number> = {}
  U.forEach((u) => {
    const r = mc.addRow([u.name, ...u.quota, null, u.open || 0, u.next || 0])
    QR[u.name] = r.number
    r.getCell(6).value = f(`SUM(B${r.number}:E${r.number})`)
    for (let k = 2; k <= 8; k++) {
      r.getCell(k).numFmt = money
      if (k !== 6) r.getCell(k).fill = INPUT
    }
  })
  const qt = mc.addRow(['Total'])
  for (let k = 2; k <= 8; k++) {
    const L = colL(k)
    qt.getCell(k).value = f(`SUM(${L}${QR[U[0].name]}:${L}${QR[U[n - 1].name]})`)
    qt.getCell(k).numFmt = money
  }
  qt.font = { bold: true }

  type Block = { rows: Record<string, number>; total: number; head: R }
  const B: Record<string, Block> = {}
  const block = (key: string, title: string, fx: (u: string, L: string, q: number) => string, nf: string, next?: (u: string) => string) => {
    mc.addRow([])
    const h = mc.addRow([title, ...QN, 'Total', ...(next ? ['Q1 año sig.'] : [])])
    head(h)
    const rows: Record<string, number> = {}
    U.forEach((u) => {
      const r = mc.addRow([u.name])
      rows[u.name] = r.number
      for (let q = 0; q < 4; q++) {
        r.getCell(2 + q).value = f(fx(u.name, colL(2 + q), q))
        r.getCell(2 + q).numFmt = nf
      }
      r.getCell(6).value = f(`SUM(B${r.number}:E${r.number})`)
      r.getCell(6).numFmt = nf
      if (next) {
        r.getCell(7).value = f(next(u.name))
        r.getCell(7).numFmt = nf
      }
    })
    const t = mc.addRow(['Total'])
    for (let k = 2; k <= (next ? 7 : 6); k++) {
      const L = colL(k)
      t.getCell(k).value = f(`SUM(${L}${rows[U[0].name]}:${L}${rows[U[n - 1].name]})`)
      t.getCell(k).numFmt = nf
    }
    t.font = { bold: true }
    B[key] = { rows, total: t.number, head: h }
  }
  const ur = (u: string) => UR[u]
  block('mq', 'Venta que origina marketing', (u, L) => `${L}${QR[u]}*$B$${ur(u)}`, money)
  block(
    'pipe',
    'Pipeline a generar',
    (u, L, q) => (q === 0 ? `IFERROR(MAX(0,${L}${B.mq.rows[u]}/$C$${ur(u)}-$G$${QR[u]}),0)` : `IFERROR(${L}${B.mq.rows[u]}/$C$${ur(u)},0)`),
    money,
    (u) => `IFERROR($H$${QR[u]}*$B$${ur(u)}/$C$${ur(u)},0)`,
  )
  block('opp', 'Oportunidades', (u, L) => `IFERROR(${L}${B.pipe.rows[u]}/$G$${ur(u)},0)`, '#,##0.0')
  block('sql', 'SQL', (u, L) => `IFERROR(${L}${B.opp.rows[u]}/$D$${ur(u)},0)`, int)
  block('mql', 'MQL', (u, L) => `IFERROR(${L}${B.sql.rows[u]}/$E$${ur(u)},0)`, int)
  block(
    'leads',
    'Leads (por trimestre de cierre)',
    (u, L) => `IFERROR(${L}${B.mql.rows[u]}/$F$${ur(u)},0)`,
    int,
    (u) => `IFERROR(G${B.pipe.rows[u]}/$G$${ur(u)}/$D$${ur(u)}/$E$${ur(u)}/$F$${ur(u)},0)`,
  )

  mc.addRow([])
  mc.addRow(['Calendario de generación: en qué mes hay que generar cada lead (se recorre según el ciclo de venta de cada unidad)']).font = { bold: true }
  head(mc.addRow(['Mes', ...MONTHS.map((m) => `${m} (año ant.)`), ...MONTHS, ...MONTHS.slice(0, 3).map((m) => `${m} (año sig.)`)]))
  const closeRow = (label: string, src: number, nf: string) => {
    const r = mc.addRow([label])
    for (let j = 0; j < 27; j++) {
      r.getCell(2 + j).value = j < 12 ? 0 : f(`${j >= 24 ? 'G' : colL(2 + Math.floor((j - 12) / 3))}${src}/3`)
      r.getCell(2 + j).numFmt = nf
    }
    r.font = GREY
    return r.number
  }
  const genRow = (label: string, cr: number, u: string, nf: string) => {
    const r = mc.addRow([label])
    for (let j = 0; j < 24; j++) {
      r.getCell(2 + j).value = f(`IF(${j + 1}+$H$${ur(u)}<=27,INDEX($B${cr}:$AB${cr},${j + 1}+$H$${ur(u)}),0)`)
      r.getCell(2 + j).numFmt = nf
    }
    return r.number
  }
  const GEN: Record<string, number> = {}
  const PGEN: Record<string, number> = {}
  U.forEach((u) => {
    GEN[u.name] = genRow(`Leads a generar · ${u.name}`, closeRow(`Leads que cierran · ${u.name}`, B.leads.rows[u.name], int), u.name, int)
    PGEN[u.name] = genRow(`Pipeline a generar · ${u.name}`, closeRow(`Pipeline que cierra · ${u.name}`, B.pipe.rows[u.name], money), u.name, money)
  })
  const totalRow = (label: string, rows: Record<string, number>, nf: string) => {
    const r = mc.addRow([label])
    for (let j = 0; j < 24; j++) {
      const L = colL(2 + j)
      const c = r.getCell(2 + j)
      c.value = f(U.map((u) => `${L}${rows[u.name]}`).join('+'))
      c.numFmt = nf
      c.fill = ORANGE
      c.font = WHITE_BOLD
    }
    r.getCell(1).font = { bold: true }
    return r.number
  }
  const genT = totalRow('Leads a generar · TOTAL', GEN, int)
  const pgenT = totalRow('Pipeline a generar · TOTAL', PGEN, money)
  mc.views = [{ state: 'frozen', xSplit: 1 }]

  // ───── Estrategia
  es.columns = [{ width: 32 }, { width: 100 }]
  head(es.addRow(['Sección', 'Contenido']))
  ;(
    [
      ['Resumen ejecutivo', 'exec'], ['Fortalezas', 'f'], ['Debilidades', 'd'], ['Oportunidades', 'o'], ['Amenazas', 'a'],
      ['Cliente ideal (ICP) y comité de compra', 'icp'], ['Propuesta de valor y mensajes', 'vp'], ['Competidores', 'comp'], ['Supuestos del plan', 'sup'],
    ] as const
  ).forEach(([l, k]) => {
    const r = es.addRow([l, p.str[k] || ''])
    r.getCell(1).font = { bold: true }
    r.getCell(1).alignment = { vertical: 'top' }
    r.getCell(2).alignment = { wrapText: true, vertical: 'top' }
  })

  // ───── Actividades
  ac.columns = [5, 16, 36, 18, 18, 9, 14, 8, 8, 14, 14, 13, 11, 16, 13].map((width) => ({ width }))
  head(ac.addRow(['#', 'Unidad', 'Actividad', 'Tipo', 'Etapa del embudo', 'Q', 'Responsable', 'Inicio', 'Fin', 'Presupuesto', 'Gasto real', 'Distribución', 'Meta leads', 'Pipeline esperado', 'Estado']))
  const lk = (col: string, r: number) => `INDEX(${MC}!$${col}$${RS}:$${col}$${RE},MATCH($B${r},${MC}!$A$${RS}:$A$${RE},0))`
  const list = (xs: readonly string[]) => ({ type: 'list' as const, allowBlank: true, formulae: [`"${xs.join(',')}"`] })
  p.acts.forEach((a, i) => {
    const r = ac.addRow([i + 1, a.u, a.n, TYPES[a.t][0], STAGES[a.g], qOf(a), a.o, MONTHS[a.s], MONTHS[a.e], a.b, a.real || null, a.d, a.l])
    const rn = r.number
    r.getCell(14).value = f(`IFERROR(M${rn}*${lk('F', rn)}*${lk('E', rn)}*${lk('D', rn)}*${lk('G', rn)},0)`)
    r.getCell(15).value = a.st
    ;[10, 11, 14].forEach((k) => (r.getCell(k).numFmt = money))
    r.getCell(11).fill = INPUT
    r.getCell(2).dataValidation = list(U.map((u) => u.name))
    r.getCell(5).dataValidation = list(Object.values(STAGES))
    r.getCell(6).dataValidation = list(['Q1', 'Q2', 'Q3', 'Q4', 'Anual'])
    r.getCell(15).dataValidation = list(STATUS)
  })
  const aEnd = Math.max(ac.lastRow!.number, 2)
  const at = ac.addRow(['', '', 'TOTAL'])
  ;[10, 11, 13, 14].forEach((k) => {
    const L = colL(k)
    at.getCell(k).value = f(`SUM(${L}2:${L}${aEnd})`)
    at.getCell(k).numFmt = k === 13 ? int : money
  })
  at.font = { bold: true }
  ac.autoFilter = { from: 'A1', to: 'O1' }
  ac.views = [{ state: 'frozen', ySplit: 1 }]

  // ───── Plan mensual y Leads mensual (meses E–P, Q1–Q4 en Q–T, total en U)
  const monthSheet = (ws: WS, val: (a: Plan['acts'][number]) => number[], nf: string) => {
    ws.columns = [{ width: 5 }, { width: 16 }, { width: 36 }, { width: 18 }, ...MONTHS.map(() => ({ width: 10 })), ...QN.map(() => ({ width: 12 })), { width: 13 }]
    head(ws.addRow(['#', 'Unidad', 'Actividad', 'Tipo', ...MONTHS, ...QN, 'TOTAL']))
    p.acts.forEach((a, i) => {
      const r = ws.addRow([i + 1, a.u, a.n, TYPES[a.t][0], ...val(a).map((v) => v || null)])
      const rn = r.number
      for (let q = 0; q < 4; q++) {
        r.getCell(17 + q).value = f(`SUM(${colL(5 + q * 3)}${rn}:${colL(7 + q * 3)}${rn})`)
        r.getCell(17 + q).fill = SOFT
      }
      r.getCell(21).value = f(`SUM(E${rn}:P${rn})`)
      for (let k = 5; k <= 21; k++) r.getCell(k).numFmt = nf
      r.getCell(4).fill = solid('FF' + TYPES[a.t][1].slice(1).toUpperCase())
    })
    const end = Math.max(ws.lastRow!.number, 2)
    const tr = ws.addRow(['', '', 'TOTAL GENERAL', ''])
    for (let k = 5; k <= 21; k++) {
      const L = colL(k)
      tr.getCell(k).value = f(`SUM(${L}2:${L}${end})`)
      tr.getCell(k).numFmt = nf
    }
    tr.font = { bold: true }
    ws.addRow([])
    ws.addRow(['', '', 'TOTAL POR UNIDAD']).font = { bold: true }
    const byUnit: Record<string, number> = {}
    U.forEach((u) => {
      const r = ws.addRow(['', '', u.name])
      byUnit[u.name] = r.number
      for (let k = 5; k <= 21; k++) {
        const L = colL(k)
        r.getCell(k).value = f(`SUMIF($B$2:$B$${end},$C${r.number},${L}$2:${L}$${end})`)
        r.getCell(k).numFmt = nf
      }
    })
    ws.views = [{ state: 'frozen', xSplit: 4, ySplit: 1 }]
    return { total: tr.number, byUnit }
  }
  const PMr = monthSheet(pm, monthly, money)
  const LMr = monthSheet(lm, (a) => leadsM(a).map((v) => Math.round(v * 10) / 10), '#,##0.0')

  // ───── Cobertura
  cb.columns = [{ width: 18 }, { width: 32 }, { width: 14 }, ...QN.map(() => ({ width: 12 })), { width: 13 }]
  cb.addRow(['Cobertura de leads: necesarios (según cuota y ciclo de venta) vs. planeados en actividades']).font = { bold: true, size: 13 }
  cb.addRow(['Los trimestres son de generación del lead, no de cierre.']).font = GREY
  head(cb.addRow(['Unidad', 'Concepto', 'Año anterior', ...QN, 'Año']))
  const NEED: Record<string, number> = {}
  let totNeed = 0
  const cbBlock = (label: string, gr: number, lr: number) => {
    const nr = cb.addRow([label, 'Leads necesarios'])
    const nn = nr.number
    nr.getCell(3).value = f(`SUM(${MC}!B${gr}:M${gr})`)
    for (let q = 0; q < 4; q++) nr.getCell(4 + q).value = f(`SUM(${MC}!${colL(14 + q * 3)}${gr}:${colL(16 + q * 3)}${gr})`)
    nr.getCell(8).value = f(`SUM(D${nn}:G${nn})`)
    const pl = cb.addRow(['', 'Leads planeados'])
    const pn = pl.number
    for (let q = 0; q < 4; q++) pl.getCell(4 + q).value = f(`${LM}!${colL(17 + q)}${lr}`)
    pl.getCell(8).value = f(`SUM(D${pn}:G${pn})`)
    const br = cb.addRow(['', 'Brecha (planeados − necesarios)'])
    for (let k = 4; k <= 8; k++) br.getCell(k).value = f(`${colL(k)}${pn}-${colL(k)}${nn}`)
    const cr = cb.addRow(['', 'Cobertura'])
    for (let k = 4; k <= 8; k++) {
      cr.getCell(k).value = f(`IF(${colL(k)}${nn}=0,"",${colL(k)}${pn}/${colL(k)}${nn})`)
      cr.getCell(k).numFmt = pct
    }
    pctRule(cb, `D${cr.number}:H${cr.number}`)
    ;[nr, pl, br].forEach((r) => { for (let k = 3; k <= 8; k++) r.getCell(k).numFmt = int })
    cb.addRow([])
    return nn
  }
  U.forEach((u) => (NEED[u.name] = cbBlock(u.name, GEN[u.name], LMr.byUnit[u.name])))
  totNeed = cbBlock('TOTAL', genT, LMr.total)
  ;[totNeed, totNeed + 1, totNeed + 2, totNeed + 3].forEach((r) => (cb.getRow(r).font = { bold: true }))

  // ───── Escenarios
  sc.columns = [{ width: 46 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 50 }]
  sc.addRow(['Escenarios: ¿y si la conversión de lead a venta sale peor o mejor?']).font = { bold: true, size: 13 }
  sc.addRow(['El factor multiplica la conversión total lead → venta de cada unidad. Base = 100%.']).font = GREY
  head(sc.addRow(['Concepto', 'Conservador', 'Base', 'Agresivo', 'Cómo se calcula']))
  const fr = sc.addRow(['Factor sobre la conversión', p.scen.low / 100, 1, p.scen.high / 100])
  ;[2, 3, 4].forEach((k) => { fr.getCell(k).numFmt = pct; if (k !== 3) fr.getCell(k).fill = INPUT })
  const F = fr.number
  const scRow = (label: string, fx: (L: string) => string, nf: string, how: string) => {
    const r = sc.addRow([label, null, null, null, how])
    ;[2, 3, 4].forEach((k) => { r.getCell(k).value = f(fx(colL(k))); r.getCell(k).numFmt = nf })
    r.getCell(5).font = GREY
    return r.number
  }
  const sNeed = scRow('Leads a generar dentro del año', (L) => `IFERROR(Cobertura!$H$${totNeed}/${L}${F},0)`, int, 'Necesarios ÷ factor')
  const sPlan = scRow('Leads planeados en actividades', () => `${LM}!$U$${LMr.total}`, int, 'No cambia con el escenario')
  const sCov = scRow('Cobertura de leads', (L) => `IFERROR(${L}${sPlan}/${L}${sNeed},0)`, pct, 'Planeados ÷ necesarios')
  pctRule(sc, `B${sCov}:D${sCov}`)
  const salesBase = U.map((u) => `${LM}!$U$${LMr.byUnit[u.name]}*${MC}!$J$${ur(u.name)}*${MC}!$G$${ur(u.name)}`).join('+')
  const sSales = scRow('Venta esperada de los leads planeados', (L) => `(${salesBase})*${L}${F}`, money, 'Leads × conversión × ticket, por unidad (cierra según el ciclo)')
  const sTarget = scRow('Venta que debe originar marketing', () => `${MC}!$F$${B.mq.total}`, money, 'Cuota × % de marketing')
  const sOf = scRow('% de la meta de marketing', (L) => `IFERROR(${L}${sSales}/${L}${sTarget},0)`, pct, '')
  pctRule(sc, `B${sOf}:D${sOf}`)

  // ───── Presupuesto
  pr.columns = [{ width: 36 }, ...U.map(() => ({ width: 18 })), { width: 18 }]
  pr.addRow([`${p.name} ${p.year} · Presupuesto`]).font = { bold: true, size: 14 }
  pr.addRow([`Moneda: ${p.cur}`]).font = GREY
  pr.addRow([])
  head(pr.addRow(['Concepto', ...U.map((u) => u.name), 'TOTAL']))
  const L = (i: number) => colL(2 + i)
  const totCol = (r: R) => { r.getCell(n + 2).value = f(`SUM(B${r.number}:${L(n - 1)}${r.number})`); r.getCell(n + 2).numFmt = money }
  const inputRow = (label: string, vals: number[], bold = false) => {
    const r = pr.addRow([label, ...vals])
    totCol(r)
    for (let i = 0; i < n; i++) { r.getCell(i + 2).numFmt = money; r.getCell(i + 2).fill = INPUT }
    if (bold) r.font = { bold: true }
    return r.number
  }
  const a1 = inputRow('Presupuesto asignado', U.map((u) => u.budget), true)
  const f1 = inputRow('(+) Cofinanciamiento', U.map((u) => u.fund))
  const tRows = Object.values(TYPES).map(([label]) => {
    const r = pr.addRow([`(−) ${label}`])
    U.forEach((u, i) => {
      r.getCell(i + 2).value = f(`SUMIFS(Actividades!$J$2:$J$${aEnd},Actividades!$B$2:$B$${aEnd},"${u.name.replace(/"/g, '""')}",Actividades!$D$2:$D$${aEnd},"${label}")`)
      r.getCell(i + 2).numFmt = money
    })
    totCol(r)
    return r.number
  })
  const lib = pr.addRow(['PRESUPUESTO LIBRE'])
  for (let i = 0; i <= n; i++) {
    const c = lib.getCell(i + 2)
    c.value = f(`${L(i)}${a1}+${L(i)}${f1}-SUM(${L(i)}${tRows[0]}:${L(i)}${tRows[tRows.length - 1]})`)
    c.numFmt = money
    c.fill = ORANGE
    c.font = WHITE_BOLD
  }
  lib.getCell(1).font = { bold: true }
  const plannedOf = (i: number) => `SUM(${L(i)}${tRows[0]}:${L(i)}${tRows[tRows.length - 1]})`
  const ratioRow = (label: string, fx: (i: number) => string, nf: string) => {
    const r = pr.addRow([label])
    for (let i = 0; i <= n; i++) { r.getCell(i + 2).value = f(fx(i)); r.getCell(i + 2).numFmt = nf }
    return r.number
  }
  ratioRow('% libre vs asignado', (i) => `IF(${L(i)}${a1}=0,0,${L(i)}${lib.number}/${L(i)}${a1})`, '0.0%')
  const realRow = ratioRow('Gasto real a la fecha', (i) => (i < n ? `SUMIF(Actividades!$B$2:$B$${aEnd},"${U[i].name.replace(/"/g, '""')}",Actividades!$K$2:$K$${aEnd})` : '0'), money)
  pr.getRow(realRow).getCell(n + 2).value = f(`SUM(B${realRow}:${L(n - 1)}${realRow})`)
  ratioRow('% ejecutado del planeado', (i) => `IFERROR(${L(i)}${realRow}/${plannedOf(i)},0)`, '0.0%')
  ratioRow('Gasto planeado vs cuota de venta', (i) => `IFERROR(${plannedOf(i)}/${MC}!F${i < n ? QR[U[i].name] : qt.number},0)`, '0.0%')
  pr.addRow([])
  head(pr.addRow(['Gasto por trimestre', ...QN, 'Año']))
  const gq = pr.addRow(['Planeado'])
  for (let q = 0; q < 4; q++) { gq.getCell(2 + q).value = f(`${PM}!${colL(17 + q)}${PMr.total}`); gq.getCell(2 + q).numFmt = money }
  gq.getCell(6).value = f(`SUM(B${gq.number}:E${gq.number})`)
  gq.getCell(6).numFmt = money

  // ───── KPIs (por trimestre en que se genera)
  kp.columns = [{ width: 44 }, ...QN.map(() => ({ width: 14 })), { width: 14 }, { width: 12 }, { width: 20 }]
  kp.addRow(['KPIs · meta por trimestre en que se genera']).font = { bold: true, size: 13 }
  head(kp.addRow(['KPI', ...QN, 'Año', 'Frecuencia', 'Fuente']))
  const COLS = ['D', 'E', 'F', 'G', 'H']
  const kRow = (label: string, fx: (c: string, i: number) => string, nf: string, fq: string, src: string) => {
    const r = kp.addRow([label])
    COLS.forEach((c, i) => { r.getCell(2 + i).value = f(fx(c, i)); r.getCell(2 + i).numFmt = nf })
    r.getCell(7).value = fq
    r.getCell(8).value = src
    return r.number
  }
  const chain = (c: string, cols: string[]) => U.map((u) => `Cobertura!${c}${NEED[u.name]}${cols.map((k) => `*${MC}!$${k}$${ur(u.name)}`).join('')}`).join('+')
  kRow('Leads', (c) => `Cobertura!${c}${totNeed}`, int, 'Mensual', 'CRM / formularios')
  kRow('MQL', (c) => chain(c, ['F']), int, 'Mensual', 'CRM')
  kRow('SQL', (c) => chain(c, ['F', 'E']), int, 'Mensual', 'CRM')
  kRow('Oportunidades creadas', (c) => chain(c, ['F', 'E', 'D']), '#,##0.0', 'Mensual', 'CRM')
  kRow('Pipeline creado', (c) => chain(c, ['F', 'E', 'D', 'G']), money, 'Mensual', 'CRM')
  kRow('Venta originada por marketing (por Q de cierre)', (_, i) => `${MC}!${colL(2 + i)}${B.mq.total}`, money, 'Trimestral', 'CRM')
  kRow('Costo por lead planeado', (_, i) => `IFERROR(${PM}!${colL(17 + i)}${PMr.total}/${LM}!${colL(17 + i)}${LMr.total},0)`, money, 'Trimestral', 'Finanzas + CRM')

  // ───── Seguimiento (real vs plan)
  sg.columns = [{ width: 10 }, ...Array.from({ length: 19 }, () => ({ width: 12 }))]
  sg.addRow(['Seguimiento mensual: real contra plan. Captura lo real en las celdas amarillas.']).font = { bold: true, size: 13 }
  sg.addRow(['Las metas del embudo son las del mes en que hay que generar (ya movidas por el ciclo de venta).']).font = GREY
  head(sg.addRow(['Mes', 'Gasto plan', 'Gasto real', '% ejecutado', 'Leads meta', 'Leads en actividades', 'Leads reales', '% vs meta', 'MQL meta', 'MQL reales', '% vs meta', 'SQL meta', 'SQL reales', '% vs meta', 'Oport. meta', 'Oport. reales', '% vs meta', 'Pipeline meta', 'Pipeline real', '% vs meta']))
  sg.getRow(3).alignment = { wrapText: true, vertical: 'top' }
  sg.getRow(3).height = 32
  const genChain = (L: string, cols: string[]) => U.map((u) => `${MC}!${L}${GEN[u.name]}${cols.map((k) => `*${MC}!$${k}$${ur(u.name)}`).join('')}`).join('+')
  const act = (k: keyof Plan['actual'], m: number) => p.actual[k]?.[m] ?? null
  const first = 4
  MONTHS.forEach((mo, m) => {
    const mcL = colL(14 + m) // mes del plan en el calendario de generación
    const r = sg.addRow([mo, null, act('spend', m), null, null, null, act('leads', m), null, null, act('mql', m), null, null, act('sql', m), null, null, act('opp', m), null, null, act('pipe', m)])
    const rn = r.number
    r.getCell(2).value = f(`${PM}!${colL(5 + m)}${PMr.total}`)
    r.getCell(5).value = f(`${MC}!${mcL}${genT}`)
    r.getCell(6).value = f(`${LM}!${colL(5 + m)}${LMr.total}`)
    r.getCell(9).value = f(genChain(mcL, ['F']))
    r.getCell(12).value = f(genChain(mcL, ['F', 'E']))
    r.getCell(15).value = f(genChain(mcL, ['F', 'E', 'D']))
    r.getCell(18).value = f(`${MC}!${mcL}${pgenT}`)
    ;[[4, 3, 2], [8, 7, 5], [11, 10, 9], [14, 13, 12], [17, 16, 15], [20, 19, 18]].forEach(([c, real, plan]) => {
      r.getCell(c).value = f(`IF(OR(${colL(real)}${rn}="",${colL(plan)}${rn}=0),"",${colL(real)}${rn}/${colL(plan)}${rn})`)
      r.getCell(c).numFmt = pct
    })
    ;[3, 7, 10, 13, 16, 19].forEach((c) => (r.getCell(c).fill = INPUT))
    ;[2, 3, 18, 19].forEach((c) => (r.getCell(c).numFmt = money))
    ;[5, 6, 7, 9, 10, 12, 13].forEach((c) => (r.getCell(c).numFmt = int))
    ;[15, 16].forEach((c) => (r.getCell(c).numFmt = '#,##0.0'))
  })
  const last = first + 11
  const st = sg.addRow(['Total'])
  for (let c = 2; c <= 20; c++) {
    const Lc = colL(c)
    if ([4, 8, 11, 14, 17, 20].includes(c)) {
      st.getCell(c).value = f(`IF(${colL(c - 1)}${st.number}=0,"",${colL(c - 1)}${st.number}/SUMIF(${colL(c - 1)}${first}:${colL(c - 1)}${last},"<>",${colL(c === 4 ? 2 : c === 8 ? 5 : c - 2)}${first}:${colL(c === 4 ? 2 : c === 8 ? 5 : c - 2)}${last}))`)
      st.getCell(c).numFmt = pct
    } else {
      st.getCell(c).value = f(`SUM(${Lc}${first}:${Lc}${last})`)
      st.getCell(c).numFmt = [2, 3, 18, 19].includes(c) ? money : int
    }
  }
  st.font = { bold: true }
  ;['D', 'H', 'K', 'N', 'Q', 'T'].forEach((c) => pctRule(sg, `${c}${first}:${c}${st.number}`))
  sg.views = [{ state: 'frozen', xSplit: 1, ySplit: 3 }]

  // ───── Riesgos
  rk.columns = [{ width: 46 }, { width: 13 }, { width: 13 }, { width: 62 }, { width: 16 }]
  head(rk.addRow(['Riesgo', 'Probabilidad', 'Impacto', 'Qué haremos', 'Responsable']))
  p.risks.forEach((x) => {
    const r = rk.addRow([x.r, x.p, x.i, x.m, x.o])
    ;[2, 3].forEach((k) => (r.getCell(k).dataValidation = list(LEVELS)))
    r.getCell(4).alignment = { wrapText: true }
  })

  // ───── Resumen ejecutivo (todo con fórmulas)
  rs.columns = [{ width: 46 }, { width: 22 }, { width: 62 }]
  rs.addRow([p.name]).font = { bold: true, size: 18 }
  rs.addRow([`Año ${p.year} · moneda ${p.cur} · hecho con soyroman.com/recursos/planeador-marketing`]).font = GREY
  rs.addRow([])
  const ex = rs.addRow(['Resumen', p.str.exec || ''])
  rs.mergeCells(`B${ex.number}:C${ex.number}`)
  ex.getCell(2).alignment = { wrapText: true, vertical: 'top' }
  ex.getCell(1).alignment = { vertical: 'top' }
  ex.height = 48
  rs.addRow([])
  head(rs.addRow(['Indicador', 'Valor', 'Cómo se calcula']))
  const base = (rs.lastRow!.number) + 1
  const at_ = (i: number) => base + i
  const lines: [string, string, string, string][] = [
    ['Cuota de venta del año', `${MC}!F${qt.number}`, money, 'Suma de cuotas por unidad y trimestre'],
    ['Venta que debe originar marketing', `${MC}!F${B.mq.total}`, money, 'Cuota × % de marketing de cada unidad'],
    ['Pipeline a generar', `${MC}!F${B.pipe.total}`, money, 'Venta de marketing ÷ tasa de cierre − pipeline abierto'],
    ['Oportunidades', `${MC}!F${B.opp.total}`, '#,##0', 'Pipeline ÷ ticket'],
    ['SQL', `${MC}!F${B.sql.total}`, int, ''],
    ['MQL', `${MC}!F${B.mql.total}`, int, ''],
    ['Leads a generar dentro del año', `Cobertura!H${totNeed}`, int, 'Por mes de generación; incluye los que alimentan el Q1 del año siguiente'],
    ['Leads planeados en actividades', `${LM}!U${LMr.total}`, int, 'Suma de metas de leads'],
    ['Cobertura de leads del año', `IFERROR(B${at_(7)}/B${at_(6)},0)`, pct, 'Planeados ÷ necesarios (escenario base)'],
    ['Cobertura en escenario conservador', `Escenarios!B${sCov}`, pct, 'Si la conversión sale peor (hoja Escenarios)'],
    ['Presupuesto planeado', `${PM}!U${PMr.total}`, money, ''],
    ['Gasto real a la fecha', `Actividades!K${at.number}`, money, ''],
    ['Gasto planeado vs cuota de venta', `IFERROR(B${at_(10)}/B${at_(0)},0)`, '0.0%', ''],
    ['Pipeline esperado de las actividades', `Actividades!N${at.number}`, money, 'Leads × tasas de su unidad × ticket'],
    ['Pipeline esperado por peso invertido', `IFERROR(B${at_(13)}/B${at_(10)},0)`, '0.0"x"', ''],
  ]
  lines.forEach(([label, fx, nf, how]) => {
    const r = rs.addRow([label, f(fx), how])
    r.getCell(2).numFmt = nf
    r.getCell(2).font = { bold: true }
    r.getCell(3).font = GREY
  })
  pctRule(rs, `B${at_(8)}:B${at_(9)}`)

  // ───── Detalle por tipo
  ;(
    [['evento', 'Eventos y ferias'], ['webinar', 'Webinars'], ['caso', 'Casos de éxito'], ['social', 'Contenido y redes'], ['abm', 'ABM']] as const
  ).forEach(([k, title]) => {
    const xs = p.acts.filter((a) => a.t === k)
    if (!xs.length) return
    const w = wb.addWorksheet(title)
    w.columns = [5, 16, 36, 9, 14, 8, 14, 10, 14].map((width) => ({ width }))
    head(w.addRow(['#', 'Unidad', 'Actividad', 'Q', 'Responsable', 'Mes', 'Presupuesto', 'Leads', 'Estado']))
    xs.forEach((a, i) => { w.addRow([i + 1, a.u, a.n, qOf(a), a.o, MONTHS[a.s], a.b, a.l, a.st]).getCell(7).numFmt = money })
  })

  return wb
}

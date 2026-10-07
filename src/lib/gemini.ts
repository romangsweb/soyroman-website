// Solo servidor: llamada genérica a Gemini (sin búsqueda) con modelos de respaldo

import { AuditError } from './aeoAudit'

const MODELS = () => [...new Set([process.env.GEMINI_MODEL || 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-flash-lite-latest'])]
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Pide a Gemini una respuesta en JSON. Si un modelo está saturado (503) o sin cuota (429) prueba el siguiente. */
export async function geminiJson<T>(prompt: string, system: string, timeoutMs = 25_000): Promise<T> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new AuditError('Gemini no está configurado.')
  let last = ''
  for (const model of MODELS()) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    }).catch(() => null)
    if (!res) { last = `${model} timeout`; continue }
    if (res.status === 429 || res.status >= 500) { last = `${model} ${res.status}`; await wait(800); continue }
    if (!res.ok) throw new Error(`gemini ${model} ${res.status} ${(await res.text()).slice(0, 300)}`)
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim()
    try {
      return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '')) as T
    } catch {
      last = `${model} json`
      continue
    }
  }
  throw new Error(`gemini sin respuesta (${last})`)
}

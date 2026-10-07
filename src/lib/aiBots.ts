/**
 * Bots de IA por user-agent. Orden: primero los que actúan por encargo de una persona
 * (más específicos), luego búsqueda y al final entrenamiento.
 * kind: training = rastreo para entrenar · search = índice de búsqueda · user = consulta en vivo.
 */
export type AiBot = { name: string; company: string; kind: 'training' | 'search' | 'user'; re: RegExp }

export const AI_BOTS: AiBot[] = [
  { name: 'ChatGPT-User', company: 'OpenAI', kind: 'user', re: /ChatGPT-User/i },
  { name: 'Claude-User', company: 'Anthropic', kind: 'user', re: /Claude-User/i },
  { name: 'Perplexity-User', company: 'Perplexity', kind: 'user', re: /Perplexity-User/i },
  { name: 'DuckAssistBot', company: 'DuckDuckGo', kind: 'user', re: /DuckAssistBot/i },
  { name: 'MistralAI-User', company: 'Mistral', kind: 'user', re: /MistralAI-User/i },
  { name: 'OAI-SearchBot', company: 'OpenAI', kind: 'search', re: /OAI-SearchBot/i },
  { name: 'Claude-SearchBot', company: 'Anthropic', kind: 'search', re: /Claude-SearchBot/i },
  { name: 'PerplexityBot', company: 'Perplexity', kind: 'search', re: /PerplexityBot/i },
  { name: 'Google-CloudVertexBot', company: 'Google', kind: 'search', re: /Google-CloudVertexBot/i },
  { name: 'Applebot', company: 'Apple', kind: 'search', re: /Applebot/i },
  { name: 'GPTBot', company: 'OpenAI', kind: 'training', re: /GPTBot/i },
  { name: 'ClaudeBot', company: 'Anthropic', kind: 'training', re: /ClaudeBot|anthropic-ai/i },
  { name: 'Meta-ExternalAgent', company: 'Meta', kind: 'training', re: /meta-external(agent|fetcher)/i },
  { name: 'Bytespider', company: 'ByteDance', kind: 'training', re: /Bytespider/i },
  { name: 'CCBot', company: 'Common Crawl', kind: 'training', re: /CCBot/i },
]

export const matchAiBot = (ua: string) => (ua ? AI_BOTS.find((b) => b.re.test(ua)) : undefined)

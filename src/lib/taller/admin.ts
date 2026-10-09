import { sql } from 'drizzle-orm'

import { getDb } from '@/db'

/*
 * Números del panel de admin. Excluye la actividad de las cuentas con rol admin (la tuya);
 * los eventos anónimos no se pueden excluir. Los conteos de eventos no son personas únicas.
 */

const n = (x: unknown) => Number(x ?? 0) || 0
type Row = Record<string, unknown>

export async function adminStats(days: number) {
  const db = getDb()
  const since = sql`now() - make_interval(days => ${days})`
  const human = sql`(e.user_id is null or e.user_id not in (select id from "user" where role = 'admin'))`
  const rows = async (q: ReturnType<typeof sql>) => ((await db.execute(q)) as unknown as { rows: Row[] }).rows

  const [kpi] = await rows(sql`
    select
      count(*) filter (where type = 'tool_view') as views,
      count(*) filter (where type = 'tool_start') as starts,
      count(*) filter (where type = 'tool_complete') as completes,
      count(*) filter (where type = 'generate_lead') as leads,
      count(*) filter (where type = 'agendar') as agendas,
      count(distinct anon_id) filter (where type in ('tool_view', 'tool_start')) as people,
      count(distinct user_id) as active_users
    from event e where e.ts >= ${since} and ${human}`)

  const [acc] = await rows(sql`
    select
      count(*) filter (where created_at >= ${since}) as new_users,
      count(*) as total_users
    from "user" where role <> 'admin'`)

  const [ret] = await rows(sql`
    select count(*) as returning from (
      select user_id from event e
      where e.ts >= ${since} and e.user_id is not null and ${human}
      group by user_id having count(distinct date_trunc('day', e.ts)) >= 2
    ) x`)

  const [runs] = await rows(sql`
    select count(*) as saves, count(distinct r.user_id) as savers
    from tool_run r join "user" u on u.id = r.user_id
    where r.created_at >= ${since} and u.role <> 'admin'`)

  const tools = await rows(sql`
    select tool_slug,
      count(*) filter (where type = 'tool_view') as views,
      count(*) filter (where type = 'tool_start') as starts,
      count(*) filter (where type = 'tool_complete') as completes,
      count(*) filter (where type = 'generate_lead') as leads,
      count(*) filter (where type = 'share') as shares,
      count(*) filter (where type = 'agendar') as agendas,
      count(distinct anon_id) as people
    from event e where e.ts >= ${since} and e.tool_slug is not null and ${human}
    group by tool_slug`)

  const saves = await rows(sql`
    select r.tool_slug, count(*) as saves
    from tool_run r join "user" u on u.id = r.user_id
    where r.created_at >= ${since} and u.role <> 'admin'
    group by r.tool_slug`)

  const intent = await rows(sql`
    select u.email, u.created_at,
      count(r.id) as runs,
      count(distinct r.tool_slug) as tools,
      max(r.created_at) as last_run,
      p.data->>'industry' as industry,
      p.data->>'size' as size
    from "user" u
    left join tool_run r on r.user_id = u.id and r.created_at >= ${since}
    left join company_profile p on p.user_id = u.id
    where u.role <> 'admin'
    group by u.id, u.email, u.created_at, p.data
    order by runs desc, last_run desc nulls last
    limit 15`)

  const [consent] = await rows(sql`
    select count(*) as profiles, count(*) filter (where consent_benchmarks) as consented
    from company_profile p join "user" u on u.id = p.user_id where u.role <> 'admin'`)

  const savesBy = new Map(saves.map((r) => [String(r.tool_slug), n(r.saves)]))
  const toolRows = tools.map((r) => ({
    slug: String(r.tool_slug),
    views: n(r.views),
    starts: n(r.starts),
    completes: n(r.completes),
    leads: n(r.leads),
    shares: n(r.shares),
    agendas: n(r.agendas),
    people: n(r.people),
    saves: savesBy.get(String(r.tool_slug)) ?? 0,
  }))
  for (const [slug, s] of savesBy) if (!toolRows.some((t) => t.slug === slug)) toolRows.push({ slug, views: 0, starts: 0, completes: 0, leads: 0, shares: 0, agendas: 0, people: 0, saves: s })
  toolRows.sort((a, b) => b.starts - a.starts || b.views - a.views)

  return {
    views: n(kpi?.views),
    starts: n(kpi?.starts),
    completes: n(kpi?.completes),
    leads: n(kpi?.leads),
    agendas: n(kpi?.agendas),
    people: n(kpi?.people),
    activeUsers: n(kpi?.active_users),
    newUsers: n(acc?.new_users),
    totalUsers: n(acc?.total_users),
    returning: n(ret?.returning),
    saves: n(runs?.saves),
    savers: n(runs?.savers),
    tools: toolRows,
    intent: intent.map((r) => ({
      email: String(r.email),
      createdAt: new Date(String(r.created_at)),
      runs: n(r.runs),
      tools: n(r.tools),
      lastRun: r.last_run ? new Date(String(r.last_run)) : null,
      industry: r.industry ? String(r.industry) : null,
      size: r.size != null ? n(r.size) : null,
    })),
    profiles: n(consent?.profiles),
    consented: n(consent?.consented),
  }
}

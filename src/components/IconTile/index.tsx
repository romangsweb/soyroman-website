import React from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Compass,
  Cpu,
  Database,
  Globe,
  Grid3x3,
  Laptop,
  LayoutTemplate,
  Magnet,
  Megaphone,
  PenTool,
  Search,
  Server,
  Users,
  Workflow,
  Wrench,
} from 'lucide-react'

import { cn } from '@/utilities/ui'

/** Iconos por clave (slug de Expertise, id de servicio o categoría de herramienta). */
export const ICONS: Record<string, LucideIcon> = {
  // Expertise
  'generacion-demanda-b2b': Magnet,
  'seo-aeo-geo': Search,
  'paid-media': Megaphone,
  'crm-revops': Workflow,
  'web-herramientas': LayoutTemplate,
  'liderazgo-equipos': Users,
  'motores-ia': Cpu,
  // Servicios
  revops: Workflow,
  'seo-aeo': Search,
  implementacion: Wrench,
  mentoria: Compass,
  // Categorías de herramientas
  analytics: Activity,
  web: Globe,
  'ia-data': Database,
  infrastructure: Server,
  design: PenTool,
  ads: Megaphone,
  workspace: Laptop,
}

type Props = {
  name: string
  size?: 'sm' | 'md' | 'lg'
  accent?: boolean
  className?: string
}

const SIZES = { sm: ['w-8 h-8', 16], md: ['w-12 h-12', 22], lg: ['w-16 h-16', 28] } as const

/** Icono de línea dentro de un recuadro con borde, con esquina de acento naranja (estilo industrial). */
export function IconTile({ name, size = 'md', accent = true, className }: Props) {
  const Icon = ICONS[name] || Grid3x3
  const [box, px] = SIZES[size]
  return (
    <span className={cn('relative inline-flex items-center justify-center border border-current shrink-0', box, className)}>
      <Icon size={px} strokeWidth={1.5} aria-hidden="true" />
      {accent && <span className="absolute -top-px -right-px w-1.5 h-1.5 bg-[#e85a2a]" />}
    </span>
  )
}

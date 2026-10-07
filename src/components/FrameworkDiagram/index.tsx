import React from 'react'

type Step = { step: string; description?: string | null }

/**
 * Los pasos del framework de un área de expertise, dibujados como diagrama de
 * flujo: horizontal en escritorio, en rejilla en móvil. El último paso va en naranja.
 */
export function FrameworkDiagram({ steps, title }: { steps: Step[]; title: string }) {
  if (!steps?.length) return null
  return (
    <figure className="p-8 md:p-16 bg-white border-b border-black overflow-hidden">
      <figcaption className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/45 mb-8">
        FIG.03 // Framework · {title}
      </figcaption>
      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-none lg:grid-flow-col lg:auto-cols-fr lg:gap-6">
        {steps.map((s, i) => {
          const last = i === steps.length - 1
          return (
            <li
              key={i}
              className={`relative border border-black p-5 min-h-[128px] flex flex-col justify-between ${
                last ? 'bg-[#e85a2a] text-white' : 'bg-white'
              }`}
            >
              <span className={`font-mono text-xs font-bold tracking-[0.15em] ${last ? 'text-white' : 'text-[#e85a2a]'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-mono text-xs xl:text-sm font-bold uppercase tracking-wider mt-6 leading-snug">
                {s.step}
              </span>
              {!last && (
                <span aria-hidden="true" className="hidden lg:block absolute top-1/2 -right-6 w-6 h-px bg-black">
                  <span className="absolute -right-px -top-[3px] w-[7px] h-[7px] border-t border-r border-black rotate-45" />
                </span>
              )}
            </li>
          )
        })}
      </ol>
      <p className="mt-6 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-black/45">↺ Ciclo de mejora</p>
    </figure>
  )
}

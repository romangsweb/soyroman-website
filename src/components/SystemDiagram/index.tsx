import React from 'react'

/**
 * Diagrama del sistema de demanda B2B (hero de inicio): canales → sitio → CRM →
 * pipeline, con puntos que fluyen. La animación se oculta si el visitante pidió
 * reducir el movimiento.
 */
const CHANNELS = ['PAID MEDIA', 'SEO / AEO', 'CONTENIDO', 'EVENTOS']

export function SystemDiagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 420"
      className={className}
      role="img"
      aria-label="Diagrama: los canales alimentan el sitio, el sitio al CRM y el CRM al pipeline, medidos por la analítica"
    >
      <defs>
        <pattern id="sd-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(0,0,0,.14)" />
        </pattern>
      </defs>
      <rect width="520" height="420" fill="url(#sd-dots)" />

      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="11" fontWeight="700" letterSpacing="1.5">
        {CHANNELS.map((c, i) => (
          <g key={c} transform={`translate(24,${40 + i * 70})`}>
            <rect width="120" height="44" fill="#fff" stroke="#000" />
            <text x="12" y="27">{c}</text>
          </g>
        ))}
        <g transform="translate(206,128)">
          <rect width="110" height="78" fill="#000" />
          <text x="14" y="34" fill="#fff">SITIO</text>
          <text x="14" y="56" fill="#e85a2a" fontSize="10">FORMULARIOS</text>
        </g>
        <g transform="translate(372,128)">
          <rect width="124" height="78" fill="#fff" stroke="#000" strokeWidth="2" />
          <rect x="118" y="-1" width="7" height="7" fill="#e85a2a" />
          <text x="14" y="34">CRM</text>
          <text x="14" y="56" fill="rgba(0,0,0,.55)" fontSize="10">MQL → SQL</text>
        </g>
        <g transform="translate(372,300)">
          <rect width="124" height="64" fill="#e85a2a" />
          <text x="14" y="38" fill="#fff">PIPELINE</text>
        </g>
        <g transform="translate(206,300)">
          <rect width="110" height="64" fill="#fff" stroke="#000" strokeDasharray="4 3" />
          <text x="14" y="38">ANALÍTICA</text>
        </g>
      </g>

      <g fill="none" stroke="#000" strokeWidth="1.2">
        <path id="sd-p1" d="M144 62 H175 V167 H206" />
        <path id="sd-p2" d="M144 132 H175 V167 H206" />
        <path id="sd-p3" d="M144 202 H175 V167 H206" />
        <path id="sd-p4" d="M144 272 H175 V167 H206" />
        <path id="sd-p5" d="M316 167 H372" />
        <path id="sd-p6" d="M434 206 V300" />
        <path d="M372 332 H316" strokeDasharray="4 3" />
        <path d="M261 300 V206" strokeDasharray="4 3" />
      </g>

      <g fill="#e85a2a" className="motion-reduce:hidden">
        {[
          ['sd-p1', '3.2s', '0s'],
          ['sd-p2', '3.6s', '-0.8s'],
          ['sd-p3', '3.0s', '-1.4s'],
          ['sd-p4', '3.8s', '-2.3s'],
          ['sd-p5', '1.6s', '0s'],
          ['sd-p6', '1.8s', '-0.6s'],
        ].map(([id, dur, begin]) => (
          <circle key={id} r="3.5">
            <animateMotion dur={dur} begin={begin} repeatCount="indefinite">
              <mpath href={`#${id}`} />
            </animateMotion>
          </circle>
        ))}
      </g>

      <text
        x="24"
        y="400"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="10"
        fill="rgba(0,0,0,.45)"
        letterSpacing="1.5"
      >
        FIG.01 // SISTEMA DE DEMANDA B2B
      </text>
    </svg>
  )
}

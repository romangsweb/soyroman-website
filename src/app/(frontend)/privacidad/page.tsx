import React from 'react'
import type { Metadata } from 'next'
import { canonical } from '@/lib/seo'

/*
 * Aviso de privacidad simplificado (LFPDPPP, México).
 * BORRADOR: debe revisarlo un abogado antes de considerarse definitivo.
 */
export default function PrivacidadPage() {
  return (
    <div className="bg-[#f4f4f4] text-black font-sans min-h-screen border-x border-black max-w-[1920px] mx-auto">
      <section className="border-b border-black bg-[#e5e5e5]">
        <div className="p-8 md:p-16">
          <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60 mb-8">Legal</p>
          <h1 className="text-[clamp(2.5rem,6vw,5rem)] leading-[1] tracking-tight font-semibold">Aviso de privacidad</h1>
        </div>
      </section>
      <section className="bg-white">
        <div className="max-w-3xl p-8 md:p-16 font-mono text-sm leading-relaxed space-y-6">
          <p>
            <strong>Responsable.</strong> Román García, con domicilio en la Ciudad de México, es responsable del tratamiento
            de los datos personales que proporcionas en este sitio. Contacto: contacto@soyroman.com.
          </p>
          <p>
            <strong>Datos que recabo.</strong> Nombre, correo electrónico, empresa y el contenido de tu mensaje, cuando llenas
            un formulario. Además, datos técnicos de navegación (página de origen, dirección IP y cookies de analítica).
          </p>
          <p>
            <strong>Finalidades.</strong> Responder tu solicitud, enviarte la información o propuesta que pediste y dar
            seguimiento comercial a esa solicitud. No vendo ni cedo tus datos.
          </p>
          <p>
            <strong>Encargados.</strong> Los datos de los formularios se almacenan en HubSpot, que actúa como proveedor de
            CRM, y el sitio se aloja en Vercel. Para medir el uso del sitio uso Google Analytics y el seguimiento de HubSpot,
            que solo instalan cookies si las aceptas en el aviso de cookies (puedes cambiar tu elección desde el enlace
            &quot;Cookies&quot; del pie de página). Ambos pueden procesar datos fuera de México bajo sus propias políticas de
            protección.
          </p>
          <p>
            <strong>Cuenta de Mi taller.</strong> Si creas una cuenta para guardar tus resultados, guardo tu correo (y, si
            entras con Google, el nombre y la foto de tu cuenta de Google), los resultados que decides guardar con los datos
            que capturaste en cada herramienta, y la fecha. Los uso solo para mostrarte tu historial. Esos datos se almacenan
            en Neon (base de datos) y los correos de acceso se envían con Resend; ambos pueden procesarlos fuera de México.
            Mientras no tengas cuenta, lo que apartas para guardar queda solo en tu navegador. Si llenas tu perfil de
            empresa, guardo esos datos para precargar las herramientas y anoto en HubSpot tu industria, tamaño de empresa y
            dominio. Solo si lo autorizas en tu perfil, tus resultados se usan de forma anónima y agregada para calcular
            medianas por industria y tamaño; nunca se muestran resultados individuales. Desde tu perfil puedes descargar
            tus datos o borrar tu cuenta y todo lo guardado en cualquier momento.
          </p>
          <p>
            <strong>Derechos ARCO.</strong> Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos, así
            como revocar tu consentimiento, escribiendo a contacto@soyroman.com con el asunto &quot;Derechos ARCO&quot;.
          </p>
          <p>
            <strong>Cambios.</strong> Cualquier cambio a este aviso se publicará en esta página.
          </p>
          <p className="opacity-60">Última actualización: octubre de 2026.</p>
        </div>
      </section>
    </div>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/privacidad'),
  title: 'Aviso de privacidad',
  description: 'Aviso de privacidad de soyroman.com.',
}

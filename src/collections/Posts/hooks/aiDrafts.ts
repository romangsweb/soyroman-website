import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'

import {
  BlockquoteFeature,
  BlocksFeature,
  convertMarkdownToLexical,
  editorConfigFactory,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  OrderedListFeature,
  UnorderedListFeature,
  type FeatureProviderServer,
} from '@payloadcms/richtext-lexical'

import { isBot } from '../../../access/authenticated'
import { Banner } from '../../../blocks/Banner/config'
import { MediaBlock } from '../../../blocks/MediaBlock/config'

/** Mismas features que el campo `content`, para que el Markdown produzca nodos válidos. */
export const postContentFeatures = ({
  rootFeatures,
}: {
  rootFeatures: FeatureProviderServer<any, any, any>[]
}) => [
  ...rootFeatures,
  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
  // Formato de artículo: listas, citas y código en línea (el editor raíz solo trae párrafo, negrita, cursiva, subrayado y liga)
  UnorderedListFeature(),
  OrderedListFeature(),
  BlockquoteFeature(),
  InlineCodeFeature(),
  BlocksFeature({ blocks: [Banner, MediaBlock] }),
  FixedToolbarFeature(),
  InlineToolbarFeature(),
  HorizontalRuleFeature(),
]

/**
 * Si llega `markdownSource`, lo convierte a Lexical en `content`.
 * Corre en beforeValidate para que `content` (requerido) ya exista al validar.
 */
export const markdownToContent: CollectionBeforeValidateHook = async ({ data, req }) => {
  const md = typeof data?.markdownSource === 'string' ? data.markdownSource.trim() : ''
  if (!data || !md) return data

  const editorConfig = await editorConfigFactory.fromFeatures({
    config: req.payload.config,
    features: postContentFeatures,
  })

  // El título va en su campo: los H1 del cuerpo bajan a H2 (el editor solo admite h2–h4)
  const markdown = md.replace(/^#\s+/gm, '## ').replace(/^#{5,6}\s+/gm, '#### ')

  data.content = convertMarkdownToLexical({ editorConfig, markdown })
  delete data.markdownSource
  return data
}

/** Garantía del lado del servidor: lo que escribe el bot SIEMPRE queda como borrador. */
export const botDraftsOnly: CollectionBeforeChangeHook = ({ data, req }) => {
  if (isBot(req.user)) {
    data._status = 'draft'
    data.publishedAt = null
  }
  return data
}

import {
  RichText as ConvertRichText,
  LinkJSXConverter,
} from '@payloadcms/richtext-lexical/react'
import type { SerializedLinkNode } from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { cn } from '@/utilities/ui'

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = (value as any).slug
  if (relationTo === 'posts') return `/blog/${slug}`
  if (relationTo === 'expertise') return `/expertise/${slug}`
  if (relationTo === 'projects') return `/proyectos/${slug}`
  return `/${slug}`
}

const jsxConverters = ({ defaultConverters }: any) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
})

type Props = {
  data: SerializedEditorState
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, ...rest } = props
  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        'payload-richtext',
        {
          'mx-auto prose md:prose-md dark:prose-invert': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}

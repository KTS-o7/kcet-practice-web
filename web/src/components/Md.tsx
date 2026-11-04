import 'katex/dist/katex.min.css'
import { memo } from 'react'
import { renderBlock, renderInline } from '../lib/markdown'

/** Question stem: paragraphs + display math. */
export const MdBlock = memo(function MdBlock({ text, className = '' }: { text: string; className?: string }) {
  return <div className={`prose-q ${className}`} dangerouslySetInnerHTML={{ __html: renderBlock(text) }} />
})

/** Options and one-line excerpts. */
export const MdInline = memo(function MdInline({ text, className = '' }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
})

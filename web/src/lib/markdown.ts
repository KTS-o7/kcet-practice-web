import katex from 'katex'
import 'katex/contrib/mhchem'

// Tiny renderer for question stems/options: paragraphs, line breaks, **bold**,
// $inline$ and $$display$$ math. Everything that isn't math is HTML-escaped.

const cache = new Map<string, string>()

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function tex(src: string, display: boolean): string {
  return katex.renderToString(src, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' })
}

function inlineText(s: string): string {
  let out = esc(s.replace(/\\\$/g, '$'))
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\n/g, '<br>')
  return out
}

/** Render a run of text that may contain $inline$ math (no display math, no paragraphs). */
function inline(s: string): string {
  let out = ''
  let i = 0
  while (i < s.length) {
    const start = findDollar(s, i)
    if (start < 0) {
      out += inlineText(s.slice(i))
      break
    }
    const end = findDollar(s, start + 1)
    if (end < 0) {
      out += inlineText(s.slice(i))
      break
    }
    out += inlineText(s.slice(i, start))
    out += tex(s.slice(start + 1, end), false)
    i = end + 1
  }
  return out
}

function findDollar(s: string, from: number): number {
  for (let i = from; i < s.length; i++) {
    if (s[i] === '$' && s[i - 1] !== '\\') return i
  }
  return -1
}

type Block = { kind: 'p'; text: string } | { kind: 'math'; tex: string }

function blocks(src: string): Block[] {
  const out: Block[] = []
  const parts = src.split(/\$\$([\s\S]+?)\$\$/g)
  parts.forEach((part, idx) => {
    if (idx % 2 === 1) {
      out.push({ kind: 'math', tex: part.trim() })
      return
    }
    for (const para of part.split(/\n\s*\n/)) {
      const t = para.replace(/^\n+|\n+$/g, '')
      if (t.trim()) out.push({ kind: 'p', text: t })
    }
  })
  return out
}

/** Block-level HTML for a question stem. */
export function renderBlock(src: string): string {
  const key = 'b' + src
  const hit = cache.get(key)
  if (hit) return hit
  const html = blocks(src ?? '')
    .map((b) => (b.kind === 'math' ? `<div class="math-display">${tex(b.tex, true)}</div>` : `<p>${inline(b.text)}</p>`))
    .join('')
  cache.set(key, html)
  return html
}

/** Inline HTML for an option or a one-line excerpt (display math is rendered inline). */
export function renderInline(src: string): string {
  const key = 'i' + src
  const hit = cache.get(key)
  if (hit) return hit
  const html = (src ?? '')
    .split(/\$\$([\s\S]+?)\$\$/g)
    .map((part, idx) => (idx % 2 === 1 ? tex(part.trim(), false) : inline(part.replace(/\n\s*\n/g, '\n'))))
    .join('')
  cache.set(key, html)
  return html
}

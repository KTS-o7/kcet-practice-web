import { MagnifyingGlassPlusIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Dialog } from './Dialog'

export function QuestionImages({ images, compact = false }: { images: string[] | null; compact?: boolean }) {
  const [zoom, setZoom] = useState<string | null>(null)
  if (!images?.length) return null
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {images.map((name, i) => (
        <button
          key={name}
          type="button"
          onClick={() => setZoom(name)}
          className="group relative overflow-hidden rounded-[10px] border border-line bg-raised p-2 transition-colors hover:border-accent/50"
          aria-label={`Diagram ${i + 1}, open larger`}
        >
          <img
            src={`/img/${encodeURIComponent(name)}`}
            alt={`Diagram ${i + 1} for this question`}
            loading="lazy"
            decoding="async"
            className={`block w-auto max-w-full object-contain dark:brightness-[0.92] ${
              compact ? 'max-h-[180px]' : 'max-h-[min(280px,34dvh)]'
            }`}
          />
          <span
            aria-hidden
            className="absolute right-2 bottom-2 grid h-7 w-7 place-items-center rounded-md bg-surface/90 text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <MagnifyingGlassPlusIcon size={16} />
          </span>
        </button>
      ))}
      <Dialog open={zoom != null} onClose={() => setZoom(null)} title="Diagram" labelledBy="zoom-h" wide>
        {zoom && (
          <img
            src={`/img/${encodeURIComponent(zoom)}`}
            alt="Diagram, enlarged"
            className="mx-auto block max-h-[calc(100dvh-160px)] w-auto max-w-full rounded-md bg-white object-contain"
          />
        )}
      </Dialog>
    </div>
  )
}

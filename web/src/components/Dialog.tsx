import { XIcon } from '@phosphor-icons/react'
import { useEffect, useRef, type ReactNode } from 'react'

/** Native modal dialog: focus trap, Esc and inert background come free. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  sheet = false,
  wide = false,
  labelledBy,
  className = '',
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  sheet?: boolean
  wide?: boolean
  labelledBy?: string
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      d.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`k-dialog ${sheet ? 'k-sheet' : ''} ${className}`}
      style={wide && !sheet ? { maxWidth: 'min(960px, calc(100vw - 32px))' } : undefined}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col">
          {title !== undefined && (
            <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
              <h2 id={labelledBy} className="text-h2">
                {title}
              </h2>
              <button type="button" className="btn btn-ghost btn-icon btn-sm -mt-1 -mr-2 text-muted" onClick={onClose} aria-label="Close">
                <XIcon size={18} />
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

import { CheckIcon, CopyIcon, DownloadSimpleIcon, LifebuoyIcon } from '@phosphor-icons/react'
import { useState } from 'react'

/** Shows a one-time recovery code and makes the student confirm they saved it before moving on. */
export function RecoveryCodeCard({
  code,
  name,
  title = 'Save your recovery code',
  intro,
  doneLabel = 'Continue',
  onDone,
}: {
  code: string
  name: string
  title?: string
  intro?: string
  doneLabel?: string
  onDone: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const copy = () =>
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })

  const download = () => {
    const text = `Kaagada recovery code\n\nName: ${name}\nRecovery code: ${code}\n\nIf you forget your password, use "Forgot password?" on the login page with this code.\nIt works once; you get a new one after using it.\n`
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `kaagada-recovery-${name.replace(/[^\p{L}\p{N}_-]+/gu, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-accent-tint text-accent">
          <LifebuoyIcon size={20} weight="duotone" />
        </span>
        <h2 className="text-h2">{title}</h2>
      </div>
      <p className="mt-2 text-label font-normal text-muted">
        {intro ??
          'If you ever forget your password, this code is the only way back into your account. There’s no email reset. Keep it somewhere safe: a photo, a notes app, or on paper.'}
      </p>
      <p
        className="mt-4 rounded-[10px] border border-dashed border-line-strong bg-paper px-4 py-3 text-center font-mono text-[22px] font-semibold tracking-[0.12em] select-all num"
        aria-label={`Recovery code ${code.split('').join(' ')}`}
      >
        {code}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
          {copied ? <CheckIcon size={15} aria-hidden /> : <CopyIcon size={15} aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={download}>
          <DownloadSimpleIcon size={15} aria-hidden /> Download as a file
        </button>
      </div>
      <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-label">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        <span>I’ve saved this code somewhere safe.</span>
      </label>
      <button type="button" className="btn btn-primary mt-4 h-11 w-full" disabled={!saved} onClick={onDone}>
        {doneLabel}
      </button>
    </div>
  )
}

import { CheckCircleIcon } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import { Dialog } from './Dialog'

const REASONS = ['The answer key looks wrong', 'Text or maths is garbled', 'Diagram missing or unclear', 'Options are wrong']

export function ReportDialog({ qid, label, open, onClose }: { qid: string; label: string; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const send = useMutation({
    mutationFn: () => api.report(qid, [reason, note.trim()].filter(Boolean).join(' — ')),
  })
  const close = () => {
    onClose()
    setTimeout(() => {
      setReason(null)
      setNote('')
      send.reset()
    }, 200)
  }
  const canSend = !!reason || note.trim().length > 0

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Report a problem"
      labelledBy="report-h"
      footer={
        send.isSuccess ? (
          <button type="button" className="btn btn-primary" onClick={close}>
            Done
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" onClick={close}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={!canSend || send.isPending} onClick={() => send.mutate()}>
              {send.isPending ? 'Sending' : 'Send report'}
            </button>
          </>
        )
      }
    >
      {send.isSuccess ? (
        <div className="flex gap-3" role="status">
          <CheckCircleIcon size={22} className="mt-0.5 shrink-0 text-correct" aria-hidden />
          <p>Thanks. It’s logged, and this question will be checked against the source paper.</p>
        </div>
      ) : (
        <>
          <p className="text-label font-normal text-muted">{label}</p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="What looks wrong">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={reason === r}
                onClick={() => setReason(reason === r ? null : r)}
                className={`rounded-full border px-3 py-1.5 text-label transition-colors duration-100 ${
                  reason === r ? 'border-accent bg-accent-tint text-ink' : 'border-line-strong hover:border-accent/50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <label htmlFor="report-note" className="label mt-4 mb-1.5 block">
            Details <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="report-note"
            className="field"
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. I think the answer should be B because…"
          />
          {send.error && (
            <p role="alert" className="mt-2 text-label text-wrong">
              {send.error.message}
            </p>
          )}
        </>
      )}
    </Dialog>
  )
}

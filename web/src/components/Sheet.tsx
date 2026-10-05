import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/** Bottom sheet on phones, side panel on larger screens. Native <dialog> handles focus and Esc. */
export function Sheet({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className="m-0 mt-auto max-h-[94vh] w-full max-w-none overflow-hidden rounded-t-md border-t border-line-strong bg-bg p-0 text-fg sm:my-0 sm:ml-auto sm:mr-0 sm:h-full sm:max-h-none sm:w-[440px] sm:rounded-none sm:border-l sm:border-t-0"
    >
      <div className="flex max-h-[94vh] flex-col sm:h-full sm:max-h-none">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="title text-xl">{title}</h2>
          <button type="button" onClick={onClose} className="icon-btn h-9 w-9" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </dialog>
  )
}

import { useEffect, useRef, useState } from 'react'

/**
 * Bouton "Exporter ▾" avec menu CSV / PDF.
 * Props:
 *   onExport(format: 'csv' | 'pdf') — appelé au choix
 *   label  — texte du bouton (défaut "Exporter")
 *   variant — 'outline' (défaut) | 'ghost'
 */
export default function ExportDropdown({ onExport, label = 'Exporter', variant = 'outline' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Fermer si clic en dehors
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const base =
    variant === 'ghost'
      ? 'flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors'
      : 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center gap-1'

  const pick = (fmt) => {
    setOpen(false)
    onExport(fmt)
  }

  return (
    <div className="relative" ref={ref}>
      <button className={base} onClick={() => setOpen((v) => !v)}>
        {/* Download icon */}
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {label}
        {/* Chevron */}
        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <button
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={() => pick('csv')}
          >
            {/* CSV icon */}
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exporter en <strong>CSV</strong></span>
          </button>
          <div className="border-t border-slate-100" />
          <button
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={() => pick('pdf')}
          >
            {/* PDF icon */}
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Exporter en <strong>PDF</strong></span>
          </button>
        </div>
      )}
    </div>
  )
}


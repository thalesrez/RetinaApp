'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ZoomIn } from 'lucide-react'

interface ImagemClinicaProps {
  url: string
  legenda?: string | null
  tipo?: string | null
}

export function ImagemClinica({ url, legenda, tipo }: ImagemClinicaProps) {
  const [expanded, setExpanded] = useState(false)
  const tipoLabel = tipo?.toUpperCase() ?? 'IMAGEM'

  return (
    <>
      <button
        onClick={() => setExpanded(true)}
        className="relative w-full rounded-xl overflow-hidden bg-slate-800 group"
        aria-label={`Expandir imagem ${tipoLabel}`}
      >
        <Image
          src={url}
          alt={legenda ?? `Imagem clínica — ${tipoLabel}`}
          width={800}
          height={500}
          className="w-full h-48 object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="absolute top-2 left-2">
          <span className="text-xs font-mono font-bold bg-slate-900/80 text-brand-300 px-2 py-0.5 rounded">
            {tipoLabel}
          </span>
        </div>
      </button>
      {legenda && (
        <p className="text-xs text-slate-500 text-center mt-1">{legenda}</p>
      )}

      {/* Modal fullscreen */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-slate-800 hover:bg-slate-700"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <Image
            src={url}
            alt={legenda ?? `Imagem clínica — ${tipoLabel}`}
            width={1200}
            height={900}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {legenda && (
            <p className="absolute bottom-6 left-0 right-0 text-center text-sm text-slate-400 px-4">
              {legenda}
            </p>
          )}
        </div>
      )}
    </>
  )
}

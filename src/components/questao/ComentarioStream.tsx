'use client'

import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { BadgeReferencia } from './BadgeReferencia'
import { Lightbulb } from 'lucide-react'

interface ComentarioStreamProps {
  questionId: string
  referencia: string | null
  // Se já existe comentário em cache, exibir diretamente sem chamar API
  comentarioCached?: string | null
}

type StreamState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

export function ComentarioStream({ questionId, referencia, comentarioCached }: ComentarioStreamProps) {
  const [texto, setTexto] = useState(comentarioCached ?? '')
  const [state, setState] = useState<StreamState>(comentarioCached ? 'done' : 'idle')
  const [refFinal, setRefFinal] = useState(referencia)
  const startedRef = useRef(false)

  useEffect(() => {
    // Se já tem cache, não chamar API
    if (comentarioCached || startedRef.current) return
    startedRef.current = true
    setState('loading')

    fetch('/api/ia/comentario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId }),
    }).then(async (res) => {
      if (!res.ok || !res.body) {
        setState('error')
        return
      }

      setState('streaming')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.token) {
              setTexto((prev) => prev + payload.token)
            }
            if (payload.done) {
              setState('done')
              if (payload.referencia) setRefFinal(payload.referencia)
            }
            if (payload.error === 'limite_atingido') {
              setState('error')
              setTexto(payload.message)
            }
          } catch {
            // linha malformada — ignorar
          }
        }
      }
    }).catch(() => setState('error'))
  }, [questionId, comentarioCached])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-brand-400 shrink-0" />
        <h3 className="text-sm font-semibold text-slate-200">Comentário</h3>
      </div>

      {state === 'loading' && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      )}

      {(state === 'streaming' || state === 'done') && texto && (
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap animate-fade-in">
          {texto}
          {state === 'streaming' && (
            <span className="inline-block w-0.5 h-4 bg-brand-400 ml-0.5 animate-pulse align-middle" />
          )}
        </p>
      )}

      {state === 'error' && !texto && (
        <p className="text-sm text-slate-500 italic">
          Comentário temporariamente indisponível. Tente novamente.
        </p>
      )}

      {state === 'done' && (
        <BadgeReferencia referencia={refFinal} />
      )}
    </div>
  )
}

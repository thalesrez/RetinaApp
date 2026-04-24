'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

const MENSAGEM_INICIAL: Mensagem = {
  role: 'assistant',
  content: 'Olá! Sou seu tutor especialista em retina e vítreo. Posso explicar conceitos, discutir questões ou aprofundar qualquer tema da prova de título. Como posso ajudar?',
}

function TutorInner() {
  const searchParams = useSearchParams()
  const questaoId = searchParams.get('questaoId') ?? undefined

  const [mensagens, setMensagens] = useState<Mensagem[]>([MENSAGEM_INICIAL])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll para o final
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  // Auto-resize textarea
  function ajustarAltura() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  async function enviarMensagem() {
    const texto = input.trim()
    if (!texto || enviando) return

    const novasMensagens: Mensagem[] = [
      ...mensagens,
      { role: 'user', content: texto },
    ]
    setMensagens(novasMensagens)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setEnviando(true)

    // Placeholder da resposta do assistente (streaming)
    setMensagens((prev) => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      const res = await fetch('/api/ia/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Envia apenas as últimas 10 mensagens (contexto suficiente, evita tokens excessivos)
          messages: novasMensagens.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          questaoId,
        }),
      })

      if (!res.ok || !res.body) {
        setMensagens((prev) => {
          const arr = [...prev]
          arr[arr.length - 1] = { role: 'assistant', content: 'Desculpe, não consegui processar sua pergunta.' }
          return arr
        })
        return
      }

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
              setMensagens((prev) => {
                const arr = [...prev]
                const last = arr[arr.length - 1]
                arr[arr.length - 1] = { ...last, content: last.content + payload.token }
                return arr
              })
            }
            if (payload.done) {
              setMensagens((prev) => {
                const arr = [...prev]
                arr[arr.length - 1] = { ...arr[arr.length - 1], streaming: false }
                return arr
              })
            }
            if (payload.error === 'limite_atingido') {
              setMensagens((prev) => {
                const arr = [...prev]
                arr[arr.length - 1] = { role: 'assistant', content: payload.message, streaming: false }
                return arr
              })
            }
          } catch {
            // linha malformada
          }
        }
      }
    } catch {
      setMensagens((prev) => {
        const arr = [...prev]
        arr[arr.length - 1] = { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }
        return arr
      })
    } finally {
      setEnviando(false)
      // Remove flag streaming de segurança
      setMensagens((prev) => prev.map((m) => ({ ...m, streaming: false })))
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensagem()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-6rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
        <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center">
          <Bot className="h-5 w-5 text-brand-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">Tutor IA</p>
          <p className="text-xs text-slate-500">Especialista em retina e vítreo</p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2">
        {mensagens.map((msg, i) => (
          <BubbleMensagem key={i} mensagem={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-slate-800">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); ajustarAltura() }}
            onKeyDown={onKeyDown}
            placeholder="Pergunte sobre qualquer tema de retina…"
            rows={1}
            disabled={enviando}
            className={cn(
              'flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900',
              'px-4 py-3 text-base text-slate-100 placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
              'disabled:opacity-50 transition-colors',
              'min-h-[48px] max-h-[160px]',
            )}
          />
          <Button
            size="icon"
            className="h-12 w-12 shrink-0"
            disabled={!input.trim() || enviando}
            onClick={enviarMensagem}
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">
          Conteúdo educacional. Não substitui avaliação clínica.
        </p>
      </div>
    </div>
  )
}

export default function TutorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-500">Carregando…</div>}>
      <TutorInner />
    </Suspense>
  )
}

function BubbleMensagem({ mensagem }: { mensagem: Mensagem }) {
  const isUser = mensagem.role === 'user'

  return (
    <div className={cn('flex gap-2', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5',
        isUser ? 'bg-brand-500/20' : 'bg-slate-800',
      )}>
        {isUser
          ? <User className="h-3.5 w-3.5 text-brand-400" />
          : <Bot className="h-3.5 w-3.5 text-slate-400" />
        }
      </div>

      {/* Balão */}
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-brand-500/20 text-slate-100 rounded-tr-sm'
          : 'bg-slate-800 text-slate-200 rounded-tl-sm',
      )}>
        <p className="whitespace-pre-wrap">{mensagem.content}</p>
        {mensagem.streaming && mensagem.content && (
          <span className="inline-block w-0.5 h-3.5 bg-brand-400 ml-0.5 animate-pulse align-middle" />
        )}
        {mensagem.streaming && !mensagem.content && (
          <div className="flex gap-1 py-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

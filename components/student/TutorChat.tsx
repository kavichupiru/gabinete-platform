'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { getChatHistory, sendTutorMessage, type ChatMessage } from '@/app/dashboard/student/tutor-actions'

interface Props {
  workId: string
  onClose: () => void
}

export default function TutorChat({ workId, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getChatHistory(workId).then(h => {
      setMessages(h)
      setLoading(false)
    })
  }, [workId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    setError(null)
    setInput('')
    setMessages(prev => [
      ...prev,
      { id: `tmp-${Date.now()}`, sender: 'student', content: text, created_at: new Date().toISOString() },
    ])

    startTransition(async () => {
      const res = await sendTutorMessage(workId, text)
      if (res.status === 'error') {
        setError(res.message)
        return
      }
      setMessages(prev => [
        ...prev,
        { id: `tmp-${Date.now()}-r`, sender: 'tutor', content: res.reply, created_at: new Date().toISOString() },
      ])
    })
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">Tutor académico</h3>
        <button onClick={onClose} className="text-xs text-zinc-400 hover:text-zinc-700">
          Cerrar
        </button>
      </div>

      <div className="flex h-80 flex-col gap-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-sm text-zinc-400">Cargando conversación...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Consultá cualquier duda sobre el diagnóstico de tu trabajo. El tutor conoce el contenido de tu auditoría.
          </p>
        ) : (
          messages.map(m => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                m.sender === 'student'
                  ? 'ml-auto bg-zinc-900 text-white'
                  : 'bg-zinc-50 text-zinc-700'
              }`}
            >
              {m.content}
            </div>
          ))
        )}
        {isPending && <p className="text-xs text-zinc-400">El tutor está escribiendo...</p>}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 border-t border-zinc-100 px-4 py-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !isPending && handleSend()}
          placeholder="Escribí tu consulta..."
          disabled={isPending}
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isPending || !input.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}

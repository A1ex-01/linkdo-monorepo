'use client'

import {
  confirmAgentPlan,
  sendAgentMessage,
  type PlanStep,
} from '@/services/agent'
import { IconSend } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type HTMLAttributes } from 'react'
import Markdown from 'react-markdown'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MessageRole = 'user' | 'assistant'

interface Message {
  id: string
  role: MessageRole
  content: string
}

interface ConfirmState {
  sessionId: string
  intent: string
  summary: string
  steps: PlanStep[]
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function genId() {
  return Math.random().toString(36).slice(2)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  // accumulated text for the current streaming assistant message
  const [draftText, setDraftText] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages or draft change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, draftText])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // -------------------------------------------------------------------------
  // Send message
  // -------------------------------------------------------------------------

  const appendUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: genId(), role: 'user', content: text },
    ])
  }

  const handleSend = async (text: string) => {
    if (!text.trim() || streaming) return

    const trimmed = text.trim()
    appendUserMessage(trimmed)
    setInput('')
    setStreaming(true)
    setDraftText('')
    setConfirm(null)

    await sendAgentMessage({
      message: trimmed,
      onConfirmRequired: (intent, summary, steps, sessionId) => {
        setConfirm({ sessionId, intent, summary, steps })
        setStreaming(false)
      },
      onExecuteStart: () => {
        setDraftText('')
      },
      onText: (content) => {
        setDraftText(content)
      },
      onDone: (message) => {
        setMessages((prev) => [
          ...prev,
          { id: genId(), role: 'assistant', content: message },
        ])
        setDraftText('')
        setStreaming(false)
      },
      onError: (code, message) => {
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            role: 'assistant',
            content: `错误 [${code}]: ${message}`,
          },
        ])
        setDraftText('')
        setStreaming(false)
      },
    })
  }

  // -------------------------------------------------------------------------
  // Confirm plan
  // -------------------------------------------------------------------------

  const handleConfirm = async () => {
    if (!confirm) return
    setStreaming(true)
    setDraftText('')
    const { sessionId } = confirm
    setConfirm(null)

    await confirmAgentPlan({
      sessionId,
      onExecuteStart: () => {},
      onText: (content) => {
        setDraftText(content)
      },
      onDone: (message) => {
        setMessages((prev) => [
          ...prev,
          { id: genId(), role: 'assistant', content: message },
        ])
        setDraftText('')
        setStreaming(false)
      },
      onError: (code, message) => {
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            role: 'assistant',
            content: `错误 [${code}]: ${message}`,
          },
        ])
        setDraftText('')
        setStreaming(false)
      },
    })
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const allMessages: Message[] = [
    ...messages,
    ...(draftText
      ? [{ id: '__draft__', role: 'assistant' as const, content: draftText }]
      : []),
  ]

  return (
    <>
      <div
        ref={chatRef}
        className='border-primary-500 z-50 flex h-full w-full flex-col overflow-hidden overflow-y-scroll rounded-2xl border-2 bg-[#18171b] font-sans shadow-2xl'
      >
        {/* Header */}
        <div className='flex h-10 items-center border-b border-[rgba(77,67,84,0.15)] bg-[rgba(24,23,27,0.97)] px-4'>
          <span className='flex-1 text-xs font-medium text-[rgba(229,226,227,0.53)] select-none'>
            Linkdo AI – Beta
          </span>
        </div>

        {/* Message list */}
        {allMessages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='flex flex-1 flex-col items-center justify-center px-8 select-none'
          >
            <span className='mt-12 text-base font-medium text-white/90'>
              Hey there <span>👋</span>
            </span>
            <span className='mt-2 text-base font-bold text-white'>
              I&apos;m Linkdo, your AI assistant.
            </span>
            <p className='mt-5 max-w-[285px] text-center text-xs leading-relaxed font-normal text-[#c7b9d7]'>
              Just tell me what&apos;s on your mind and I can turn
              <br />
              your thoughts into tasks, notes, subtasks, and
              <br />
              even schedule them for you.
            </p>
          </motion.div>
        ) : (
          <div className='list flex-1 overflow-y-auto px-4 py-3'>
            <AnimatePresence initial={false}>
              {allMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-[#2a2830] text-[#e5e2e3]'
                    } prose prose-invert prose-sm break-words`}
                    style={{ wordBreak: 'break-word' }}
                  >
                    <Markdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            className='text-blue-400 underline hover:text-blue-300'
                          />
                        ),
                        code: ({
                          inline,
                          children,
                          ...props
                        }: HTMLAttributes<HTMLElement> & {
                          inline?: boolean
                        }) =>
                          inline ? (
                            <code
                              {...props}
                              className='rounded bg-[#232136] px-1 py-0.5 text-[13px] text-[#e5e2e3]'
                            >
                              {children}
                            </code>
                          ) : (
                            <pre className='overflow-x-auto rounded-lg bg-[#232136] p-2 text-[13px] text-[#e5e2e3]'>
                              <code>{children}</code>
                            </pre>
                          ),
                      }}
                    >
                      {msg.content}
                    </Markdown>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Confirm panel */}
            {confirm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='mb-3 flex justify-start'
              >
                <div className='max-w-[85%] rounded-2xl border border-[rgba(99,92,123,0.5)] bg-[#201f25] px-4 py-3'>
                  <p className='mb-2 text-xs font-semibold text-[#c7b9d7]'>
                    执行计划确认
                  </p>
                  <p className='mb-2 text-sm text-white'>{confirm.summary}</p>
                  <ol className='mb-3 list-inside list-decimal space-y-1 text-xs text-[#a8a3b3]'>
                    {confirm.steps.map((step) => (
                      <li key={step.step}>{step.action}</li>
                    ))}
                  </ol>
                  <div className='flex gap-2'>
                    <button
                      onClick={handleConfirm}
                      className='hover:bg-fun-600 bg-primary-500 rounded px-3 py-1.5 text-xs font-medium text-white transition'
                    >
                      确认执行
                    </button>
                    <button
                      onClick={() => setConfirm(null)}
                      className='rounded bg-[#2a2830] px-3 py-1.5 text-xs font-medium text-[#a8a3b3] transition hover:bg-[#35323d]'
                    >
                      取消
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {streaming && !draftText && !confirm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='mb-3 flex justify-start'
              >
                <div className='max-w-[80%] rounded-2xl bg-[#2a2830] px-4 py-2 text-sm text-[#e5e2e3]'>
                  <span className='animate-pulse'>思考中...</span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Input */}
        <div className='border-t border-[rgba(77,67,84,0.13)] bg-[#151518] px-3 py-3'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend(input)
            }}
            className='flex items-center gap-2 rounded-xl border border-[rgba(99,92,123,0.36)] bg-[#18171b] px-3 py-[7px]'
          >
            <input
              ref={inputRef}
              name='message'
              type='text'
              placeholder='Enter your message'
              className='flex-1 border-none bg-transparent text-[15px] text-white outline-none placeholder:text-[rgba(229,226,227,0.43)] disabled:opacity-50'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={streaming}
              autoComplete='off'
            />
            <button
              type='submit'
              className='rounded p-1.5 shadow-sm transition hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-50'
              disabled={streaming || !input.trim()}
            >
              <IconSend size={18} className='text-white' />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

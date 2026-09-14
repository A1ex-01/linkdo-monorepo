'use client'

import { Badge } from '@linkdo/ui/components/badge'
import { Button } from '@linkdo/ui/components/button'
import { IconSend } from '@tabler/icons-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
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

async function* sendMessage(message: string) {
  const response = await fetch('http://localhost:6001/chat/send-message', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let result = ''
  while (true) {
    const { done, value } = (await reader?.read()) as ReadableStreamReadResult<
      Uint8Array<ArrayBuffer>
    >
    if (done) break
    result += decoder.decode(value, { stream: true })
    yield { type: 'answer', text: result }
  }
}

async function* confirmTaskUpdate(threadId: string) {
  const response = await fetch('http://localhost:6001/chat/confirm-message', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ thread_id: threadId }),
  })
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let result = ''
  while (true) {
    const { done, value } = (await reader?.read()) as ReadableStreamReadResult<
      Uint8Array<ArrayBuffer>
    >
    if (done) break
    result += decoder.decode(value, { stream: true })
    yield { type: 'answer', text: result }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatPanelV2() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages or draft change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  function mutateMessages(message: Message, messages: Message[]) {
    const newMessages = messages.map((m) => (m.id === message.id ? message : m))
    setMessages(newMessages)
    setInput('')
  }

  const handleSend = async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'thinking...',
    }
    const newMessages = [...messages, userMessage, assistantMessage]
    setMessages(newMessages)
    const data = sendMessage(text)
    for await (const chunk of data) {
      if (chunk.type === 'answer') {
        assistantMessage.content = chunk.text
        mutateMessages(assistantMessage, newMessages)
      }
    }
  }

  return (
    <>
      <div
        ref={chatRef}
        className='border-primary-500 z-50 flex h-full w-full flex-col overflow-hidden overflow-y-scroll rounded-2xl border-2 bg-[#18171b] font-sans shadow-2xl'
      >
        {/* Header */}
        <div className='flex h-10 items-center border-b border-[rgba(77,67,84,0.15)] bg-[rgba(24,23,27,0.97)] px-4'>
          <span className='flex-1 text-xs font-medium text-[rgba(229,226,227,0.53)] select-none'>
            Linkdo AI – BetaV2
          </span>
        </div>

        {/* Message list */}
        {messages.length === 0 ? (
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
              {messages.map((msg) => {
                return (
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
                      {msg.content?.split('\n\n').map((line, index) => {
                        if (!line?.startsWith('data:'))
                          return <div key={index}>{line}</div>

                        const content = line?.replace('data: ', '')
                        let parsedData = JSON.parse(content)

                        const prefix = `${parsedData?.name}-${parsedData?.type}`
                        if (parsedData?.name === '意图识别') {
                          if (parsedData?.type === 'start') {
                            return (
                              <div key={index}>
                                <Badge>{prefix}</Badge> <br />
                              </div>
                            )
                          } else {
                            return (
                              <div key={index}>
                                <Badge>{prefix}</Badge> <br />
                                结果: {parsedData?.data?.intent}
                              </div>
                            )
                          }
                        }

                        if (parsedData?.name === '网络搜索') {
                          if (parsedData?.type === 'start') {
                            return (
                              <div key={index}>
                                <Badge>{prefix}</Badge> <br />
                                搜索内容： {parsedData?.data?.query}
                              </div>
                            )
                          } else {
                            return (
                              <div key={index} className='markdown-body'>
                                <Badge>{prefix}</Badge> <br />
                                <Markdown>
                                  {parsedData?.data?.result.replaceAll(
                                    '. ',
                                    '\n\n'
                                  )}
                                </Markdown>
                              </div>
                            )
                          }
                        }
                        if (parsedData?.name === '闲聊回复') {
                          if (parsedData?.type === 'start') {
                            return (
                              <div key={index}>
                                <Badge>{prefix}</Badge> <br />
                                query: {parsedData?.data?.query}
                              </div>
                            )
                          } else {
                            return (
                              <span key={index}>{parsedData?.data?.delta}</span>
                            )
                          }
                        }
                        if (parsedData?.name === '任务子图') {
                          parsedData = parsedData?.data?.data
                          const prefix = `${parsedData?.name}-${parsedData?.type}`

                          if (parsedData?.name === '多步意图识别') {
                            switch (parsedData?.type) {
                              case 'start':
                                return (
                                  <div key={index}>
                                    <Badge>{prefix}</Badge> <br />
                                    query: {parsedData?.data?.query}
                                  </div>
                                )
                              case 'end':
                                return (
                                  <div key={index}>
                                    <Badge>{prefix}</Badge> <br />
                                    steps: <br />
                                    {parsedData?.data?.steps?.map(
                                      (step: {
                                        intent?: string
                                        params?: unknown
                                      }) => (
                                        <Badge key={step?.intent}>
                                          {step?.intent} -{' '}
                                          {JSON.stringify(step?.params)}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                )
                              default:
                                return null
                            }
                          }
                          if (
                            [
                              '查询任务',
                              '任务创建',
                              '任务删除',
                              '任务更新',
                            ].includes(parsedData?.name)
                          ) {
                            switch (parsedData?.type) {
                              case 'start':
                                return (
                                  <div key={index}>
                                    <Badge>{prefix}</Badge> <br />
                                    params:{' '}
                                    {JSON.stringify(parsedData?.data?.params)}
                                  </div>
                                )
                              case 'end':
                                return (
                                  <div key={index}>
                                    <Badge>{prefix}</Badge> <br />
                                    result:{' '}
                                    {JSON.stringify(parsedData?.data?.result)}
                                  </div>
                                )
                              default:
                                return null
                            }
                          }
                          if (['任务更新二次确认'].includes(parsedData?.name)) {
                            switch (parsedData?.type) {
                              case 'start':
                                return (
                                  <div key={index}>
                                    <Badge>{prefix}</Badge> <br />
                                    params:{' '}
                                    {JSON.stringify(parsedData?.data?.params)}
                                    <br />
                                    <Button
                                      onClick={async () => {
                                        const data =
                                          confirmTaskUpdate('1234567890')
                                        for await (const chunk of data) {
                                          void chunk
                                        }

                                        // handleSend(parsedData?.data?.params?.confirm)
                                      }}
                                    >
                                      Confirm
                                    </Button>
                                  </div>
                                )
                              case 'end':
                                return (
                                  <div key={index}>
                                    <Badge>{prefix}</Badge> <br />
                                    result:{' '}
                                    {JSON.stringify(parsedData?.data?.result)}
                                  </div>
                                )
                              default:
                                return null
                            }
                          }
                        }

                        if (['用户确认搜索'].includes(parsedData?.name)) {
                          switch (parsedData?.type) {
                            case 'start':
                              return (
                                <div key={index}>
                                  <Badge>{prefix}</Badge> <br />
                                  params:{' '}
                                  {JSON.stringify(parsedData?.data?.params)}
                                  <br />
                                  <Button
                                    onClick={async () => {
                                      const data =
                                        confirmTaskUpdate('1234567890')

                                      for await (const chunk of data) {
                                        const newMsg = {
                                          ...msg,
                                          content: `${msg.content}\n${chunk.text}`,
                                        }
                                        mutateMessages(newMsg, messages)
                                      }

                                      // handleSend(parsedData?.data?.params?.confirm)
                                    }}
                                  >
                                    Confirm
                                  </Button>
                                </div>
                              )
                            case 'end':
                              return (
                                <div key={index}>
                                  <Badge>{prefix}</Badge> <br />
                                  result:{' '}
                                  {JSON.stringify(parsedData?.data?.result)}
                                </div>
                              )
                            default:
                              return null
                          }
                        }

                        return null
                      })}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
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
              disabled={false}
              autoComplete='off'
            />
            <button
              type='submit'
              className='rounded p-1.5 shadow-sm transition hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-50'
              disabled={!input.trim()}
            >
              <IconSend size={18} className='text-white' />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

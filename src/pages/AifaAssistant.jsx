import { useEffect, useRef, useState } from 'react'
import {
  assistantData,
  assistantWelcomeMessage,
  fallbackAssistantResponse,
} from './assistantData.js'

const normalizeText = (value = '') => value
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const findAnswerForQuestion = (question) => {
  const normalizedQuestion = normalizeText(question)
  const exactMatch = assistantData.find((item) => normalizeText(item.question) === normalizedQuestion)

  if (exactMatch) {
    return exactMatch.answer
  }

  const questionTokens = normalizedQuestion.split(' ').filter(Boolean)

  for (const item of assistantData) {
    const keywords = (item.keywords ?? []).map((keyword) => normalizeText(keyword)).filter(Boolean)

    if (!keywords.length) {
      continue
    }

    const matches = keywords.every((keyword) => {
      const keywordTokens = normalizeText(keyword).split(' ').filter(Boolean)
      return keywordTokens.every((token) => questionTokens.includes(token))
    })

    if (matches) {
      return item.answer
    }
  }

  return fallbackAssistantResponse
}

function AifaAssistant({ isDark }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [welcomeShown, setWelcomeShown] = useState(false)
  const scrollRef = useRef(null)
  const hasSpokenRef = useRef(false)
  const messageCounterRef = useRef(0)

  const buildMessage = (sender, text) => ({
    id: `${sender}-${messageCounterRef.current++}`,
    sender,
    text,
  })

  const addMessage = (message) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) {
        return current
      }

      return [...current, message]
    })
  }

  const speakText = (text) => {
    if (!text || !('speechSynthesis' in window)) {
      return
    }

    const synth = window.speechSynthesis
    synth.cancel()

    if (!voiceEnabled) {
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 1
    utterance.pitch = 1

    const voices = synth.getVoices()
    const preferredVoice = voices.find((voice) => /en(-|_)?(us|gb|au|in)/i.test(voice.lang)) ?? voices[0]

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    synth.speak(utterance)
  }

  useEffect(() => {
    if (!isOpen && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [isOpen])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen])

  const handleOpenToggle = () => {
    setIsOpen((current) => {
      const next = !current

      if (next && !welcomeShown) {
        const welcomeMessage = buildMessage('assistant', assistantWelcomeMessage)
        addMessage(welcomeMessage)
        setWelcomeShown(true)

        if (voiceEnabled && !hasSpokenRef.current) {
          speakText(welcomeMessage.text)
          hasSpokenRef.current = true
        }
      }

      if (!next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }

      return next
    })
  }

  const handleSuggestedQuestion = (question) => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || isProcessing) {
      return
    }

    addMessage(buildMessage('user', trimmedQuestion))

    const answer = findAnswerForQuestion(trimmedQuestion)
    const assistantResponse = buildMessage('assistant', answer)

    addMessage(assistantResponse)
  }

  const handleSend = () => {
    const trimmedValue = inputValue.trim()
    if (!trimmedValue || isProcessing) {
      return
    }

    setIsProcessing(true)
    addMessage(buildMessage('user', trimmedValue))

    const answer = findAnswerForQuestion(trimmedValue)
    const assistantResponse = buildMessage('assistant', answer)

    window.setTimeout(() => {
      addMessage(assistantResponse)
      setInputValue('')
      setIsProcessing(false)
    }, 120)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const panelTheme = isDark
    ? 'border-[#3b3d52] bg-[#131b2d] text-slate-100 shadow-[0_20px_60px_rgba(8,11,22,0.55)]'
    : 'border-[#e2e8f0] bg-white text-slate-800 shadow-[0_18px_48px_rgba(15,23,42,0.12)]'

  const scrollAreaTheme = isDark ? 'bg-[#0d1424]' : 'bg-[#f8fafc]'
  const inputTheme = isDark
    ? 'border-[#2a3961] bg-[#0f172a] text-slate-100 placeholder:text-slate-400'
    : 'border-[#d7e0ef] bg-white text-slate-800 placeholder:text-slate-400'

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {isOpen && (
        <section
          aria-label="Aifa AI Assistant panel"
          className={`flex w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border ${panelTheme}`}
        >
          <header
            className={`flex items-center justify-between border-b px-4 py-3 ${isDark ? 'border-[#2d3a5a]' : 'border-[#edf2f7]'}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex size-9 items-center justify-center rounded-xl ${isDark ? 'bg-[#1c2d4a] text-[#8db0ff]' : 'bg-[#eef2ff] text-[#4f46e5]'}`}>
                <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M12 3v2M12 19v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M3 12h2M19 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  <circle cx="12" cy="12" r="3.5" />
                </svg>
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Aifa AI Assistant</p>
                <p className={`truncate text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Your dashboard helper
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    Online
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                aria-label={voiceEnabled ? 'Disable assistant voice output' : 'Enable assistant voice output'}
                className={`flex size-8 items-center justify-center rounded-lg border ${isDark ? 'border-[#2a3961] bg-[#0f172a] text-[#dfe9ff] hover:bg-[#162642]' : 'border-[#dfe7f5] bg-white text-[#475569] hover:bg-slate-50'}`}
                onClick={() => setVoiceEnabled((current) => !current)}
                type="button"
              >
                {voiceEnabled ? '🔊' : '🔇'}
              </button>

              <button
                aria-label="Close Aifa AI Assistant"
                className={`flex size-8 items-center justify-center rounded-lg border ${isDark ? 'border-[#2a3961] bg-[#0f172a] text-[#dfe9ff] hover:bg-[#162642]' : 'border-[#dfe7f5] bg-white text-[#475569] hover:bg-slate-50'}`}
                onClick={() => handleOpenToggle()}
                type="button"
              >
                ×
              </button>
            </div>
          </header>

          <div className={`flex max-h-[26rem] flex-col gap-3 overflow-y-auto p-3 ${scrollAreaTheme}`} ref={scrollRef}>
            {!messages.length && (
              <div className={`rounded-2xl border px-3 py-2.5 text-sm leading-6 ${isDark ? 'border-[#2a3961] bg-[#101b2e] text-slate-100' : 'border-[#e6eef7] bg-white text-slate-700'}`}>
                {assistantWelcomeMessage}
              </div>
            )}

            {messages.map((message) => {
              const isAssistant = message.sender === 'assistant'

              return (
                <div
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                  key={message.id}
                >
                  <div
                    className={`relative max-w-[90%] rounded-2xl px-3 py-2.5 text-sm leading-6 ${
                      isAssistant
                        ? isDark
                          ? 'bg-[#17253d] text-slate-100'
                          : 'bg-[#eef2ff] text-slate-800'
                        : isDark
                          ? 'bg-[#4f46e5] text-white'
                          : 'bg-[#1d4ed8] text-white'
                    }`}
                  >
                    {message.text}

                    {isAssistant && (
                      <button
                        aria-label="Read assistant response aloud"
                        className={`absolute -bottom-2 -right-2 flex size-6 items-center justify-center rounded-full border ${isDark ? 'border-[#2a3961] bg-[#0f172a] text-[#dfe9ff]' : 'border-[#dfe7f5] bg-white text-[#475569]'}`}
                        onClick={() => speakText(message.text)}
                        type="button"
                      >
                        🔊
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            <div className="pt-1">
              <p className={`mb-2 text-[11px] font-medium uppercase tracking-[0.08em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {assistantData.map((item) => (
                  <button
                    className={`rounded-full border px-2.5 py-1.5 text-xs transition-colors ${isDark ? 'border-[#2a3961] bg-[#0f172a] text-slate-100 hover:bg-[#162642]' : 'border-[#dfe7f5] bg-white text-slate-700 hover:bg-slate-50'}`}
                    key={item.id}
                    onClick={() => handleSuggestedQuestion(item.question)}
                    type="button"
                  >
                    {item.question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form
            className={`border-t p-3 ${isDark ? 'border-[#2d3a5a] bg-[#101b2e]' : 'border-[#edf2f7] bg-white'}`}
            onSubmit={(event) => {
              event.preventDefault()
              handleSend()
            }}
          >
            <div className="flex items-center gap-2">
              <input
                aria-label="Ask Aifa AI"
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 ${inputTheme}`}
                disabled={isProcessing}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me a question..."
                type="text"
                value={inputValue}
              />
              <button
                className={`inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${isDark ? 'bg-[#4f46e5]' : 'bg-[#2563eb]'}`}
                disabled={isProcessing || !inputValue.trim()}
                type="submit"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        aria-label="Ask Aifa AI"
        className={`group relative flex size-14 items-center justify-center rounded-full border border-white/20 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl ${isDark ? 'bg-gradient-to-br from-[#4f46e5] to-[#2563eb]' : 'bg-gradient-to-br from-[#4338ca] to-[#2563eb]'}`}
        onClick={handleOpenToggle}
        title="Ask Aifa AI"
        type="button"
      >
        <span className="absolute inset-0 animate-pulse rounded-full bg-white/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <svg aria-hidden="true" className="relative size-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M9 18h6M10 22h4M8 13a4 4 0 1 1 8 0v1a4 4 0 0 1-8 0v-1Z" />
          <path d="M12 4a7 7 0 0 0-7 7c0 1.14.27 2.23.75 3.19L6 17l2.27-1.18A7.03 7.03 0 0 0 12 18a7 7 0 0 0 0-14Z" />
        </svg>
      </button>
    </div>
  )
}

export default AifaAssistant

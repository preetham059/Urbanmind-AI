'use client'
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  "How many complaints are pending?",
  "Which potholes need urgent repair?",
  "What is the traffic situation in MG Road?",
  "Give me a summary of the city infrastructure",
  "Which areas need immediate attention?",
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm UrbanMind AI. I have access to real-time city data including complaints, pothole detections, and traffic predictions. Ask me anything about the city infrastructure!"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6)
        })
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.text) {
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: updated[updated.length - 1].content + data.text
                  }
                  return updated
                })
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1].content = 'Error connecting to AI. Make sure backend is running.'
        return updated
      })
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col" style={{ height: '100vh' }}>
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-6">
        <h1 className="text-2xl font-bold text-blue-400">Ask the City</h1>
        <p className="text-gray-400 text-sm mt-1">
          AI assistant with real-time city data
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 max-w-4xl w-full mx-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl rounded-2xl px-5 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-100'
            }`}>
              {msg.role === 'assistant' && (
                <p className="text-blue-400 text-xs font-semibold mb-1">UrbanMind AI</p>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
                {loading && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' && (
                  <span className="animate-pulse">▋</span>
                )}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-4 max-w-4xl w-full mx-auto">
          <p className="text-gray-500 text-xs mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-2 rounded-full transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-800 p-4 max-w-4xl w-full mx-auto">
        <div className="flex gap-3">
          <input
            className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask about city infrastructure..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-xl px-5 font-semibold transition"
          >
            {loading ? '...' : '→'}
          </button>
        </div>
      </div>
    </main>
  )
}
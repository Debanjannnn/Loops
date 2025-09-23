"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Send, MessageSquare } from "lucide-react"

interface ChatMessage {
  id: string
  author: string
  content: string
  timestamp: number
}

export default function ChatSidebar() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  useEffect(() => {
    const now = Date.now()
    setMessages([
      { id: crypto.randomUUID(), author: "System", content: "Welcome to All Chat! Be nice and have fun.", timestamp: now - 1000 * 60 * 6 },
      { id: crypto.randomUUID(), author: "Ava", content: "Just hit 3x on Cashout!", timestamp: now - 1000 * 60 * 5 },
      { id: crypto.randomUUID(), author: "Leo", content: "Mines is super hot rn 🔥", timestamp: now - 1000 * 60 * 5 + 15000 },
      { id: crypto.randomUUID(), author: "Mira", content: "Anyone tried the new Blackjack?", timestamp: now - 1000 * 60 * 4 + 20000 },
      { id: crypto.randomUUID(), author: "Dev", content: "GL HF everyone!", timestamp: now - 1000 * 60 * 3 + 10000 },
      { id: crypto.randomUUID(), author: "Kai", content: "Cashed out early… still profit 😅", timestamp: now - 1000 * 60 * 2 + 45000 },
      { id: crypto.randomUUID(), author: "Nia", content: "Saving up for a big run tonight.", timestamp: now - 1000 * 60 * 1 + 30000 },
    ])
  }, [])
  const [input, setInput] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp - b.timestamp),
    [messages],
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [sortedMessages.length])

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed) return
    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      author: "You",
      content: trimmed,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, newMsg])
    setInput("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 bottom-0 z-40 w-80 h-full border-l border-border bg-background/70 backdrop-blur rounded-l-3xl flex flex-col",
      )}
      aria-label="All Chat sidebar"
    >
      <div className="p-3 border-b border-border flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-secondary/50 border border-border flex items-center justify-center">
          <MessageSquare className="h-4 w-4 opacity-80" />
        </div>
        <div>
          <div className="text-sm font-semibold">All Chat</div>
          <div className="text-xs text-foreground/60">Global room</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {sortedMessages.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-secondary/40 p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground/80">{m.author}</span>
              <span className="text-[10px] text-foreground/50">{new Date(m.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{m.content}</div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-10 rounded-xl bg-background/60 border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button size="sm" className="h-10 px-3" onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
} 
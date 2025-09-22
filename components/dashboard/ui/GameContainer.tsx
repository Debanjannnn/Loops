"use client"

import type React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface GameContainerProps {
  children: React.ReactNode
  scrollable?: boolean
}

export default function GameContainer({ children, scrollable = true }: GameContainerProps) {
  return (
    <div className="flex-1 h-full">
      <Card
        className={cn(
          "w-full h-full bg-black/40 backdrop-blur-md border-white/10 rounded-2xl shadow-xl",
          scrollable ? "overflow-y-auto" : "overflow-y-hidden",
          "overflow-x-hidden",
        )}
      >
        <div className="p-6 h-full">{children}</div>
      </Card>
    </div>
  )
}

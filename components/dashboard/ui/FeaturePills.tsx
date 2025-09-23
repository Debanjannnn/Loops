import { Gift, Joystick, Users, Trophy } from "lucide-react"
import React from "react"

interface PillItem {
  icon: React.ReactNode
  title: string
  subtitle: string
}

const items: PillItem[] = [
  { icon: <Joystick className="h-5 w-5" />, title: "Casino", subtitle: "All casino games" },
  { icon: <Trophy className="h-5 w-5" />, title: "Sports", subtitle: "Betting and live betting" },
  { icon: <Gift className="h-5 w-5" />, title: "Bonuses", subtitle: "Many bonuses daily" },
  { icon: <Users className="h-5 w-5" />, title: "Affiliates", subtitle: "Invite friends and earn" },
]

export default function FeaturePills() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="relative rounded-2xl border border-white/10 bg-[#0b0617]/80 backdrop-blur-md px-4 py-3 flex items-center gap-3 overflow-hidden"
        >
          {/* glow blob */}
          <div className="absolute -left-6 -top-8 h-24 w-24 rounded-full bg-fuchsia-600/30 blur-2xl" />
          <div className="absolute -right-10 -bottom-10 h-24 w-24 rounded-full bg-violet-600/20 blur-2xl" />

          <div className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-b from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/30">
            {item.icon}
          </div>
          <div className="relative">
            <div className="text-white font-medium text-sm">{item.title}</div>
            <div className="text-white/60 text-xs">{item.subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  )
} 
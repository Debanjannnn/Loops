import React from "react"
import Image from "next/image"

interface PillItem {
  image: string
  title: string
  subtitle: string
}

const items: PillItem[] = [
  { image: "/minegame.png", title: "Casino", subtitle: "All casino games" },
  { image: "/trophy.png", title: "Sports", subtitle: "Betting and live betting" },
  { image: "/cashout.png", title: "Bonuses", subtitle: "Many bonuses daily" },
  { image: "/happypaaji.png", title: "Affiliates", subtitle: "Invite friends and earn" },
]

export default function FeaturePills() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="relative rounded-2xl border border-white/10 bg-transparent backdrop-blur-md px-4 py-8 flex items-center gap-4 overflow-hidden"
        >
          {/* glow blob */}
          <div className="absolute -left-6 -top-8 h-24 w-24 rounded-full bg-fuchsia-600/30 blur-2xl" />
          <div className="absolute -right-10 -bottom-10 h-24 w-24 rounded-full bg-violet-600/20 blur-2xl" />

          <div className="relative flex items-center justify-center h-16 w-16 rounded-xl overflow-hidden">
            <Image
              src={item.image}
              alt={item.title}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
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
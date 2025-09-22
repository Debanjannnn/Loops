"use client"
import { cn } from "@/lib/utils"
import { Gamepad2, TrendingUp, Home, Trophy, Clock } from "lucide-react"

export type DashboardSection = "home" | "games" | "predictmarket"

interface SidebarTabsProps {
  selectedSection: DashboardSection
  onSelectSection: (section: DashboardSection) => void
}

export default function SidebarTabs({ selectedSection, onSelectSection }: SidebarTabsProps) {
  const tabs = [
    {
      id: "home" as const,
      label: "Home",
      icon: Home,
      emoji: "🏠",
      description: "Dashboard overview",
      badge: null,
    },
    {
      id: "games" as const,
      label: "Games",
      icon: Gamepad2,
      emoji: "🎮",
      description: "Play casino games",
      badge: "Hot",
    },
    {
      id: "predictmarket" as const,
      label: "Predict Market",
      icon: TrendingUp,
      emoji: "📈",
      description: "Prediction markets",
      badge: "Soon",
    },
  ]

  return (
    <div className="h-full">
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full shadow-2xl">
        <div className="space-y-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = selectedSection === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectSection(tab.id)}
                className={cn(
                  "w-full text-left p-5 rounded-2xl transition-all duration-300 group relative overflow-hidden border",
                  isActive
                    ? "bg-gradient-to-r from-[#df500f] to-[#ff6b35] text-white shadow-xl transform scale-[1.02] border-transparent"
                    : "text-white/80 hover:text-white hover:bg-white/10 hover:scale-[1.01] border-white/10 hover:border-white/20",
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl" />
                )}

                <div className="relative flex items-center space-x-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg",
                      isActive ? "bg-white/20 backdrop-blur-sm" : "bg-black/30 group-hover:bg-white/10",
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-base">{tab.label}</span>
                      {tab.badge && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            tab.badge === "Hot"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                          )}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </div>
                    <div className={cn("text-sm transition-colors", isActive ? "text-white/80" : "text-white/60")}>
                      {tab.description}
                    </div>
                  </div>

                  <div className="text-2xl">{tab.emoji}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-8 p-5 bg-black/30 rounded-2xl border border-white/10">
          <div className="flex items-center space-x-2 mb-4">
            <Trophy className="w-5 h-5 text-[#df500f]" />
            <h3 className="text-white font-bold text-base">Quick Stats</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Games Played</span>
              <span className="text-white text-sm font-bold">127</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Win Rate</span>
              <span className="text-green-400 text-sm font-bold">68.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Best Streak</span>
              <span className="text-[#df500f] text-sm font-bold">12 wins</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Last Played</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-white/40" />
                <span className="text-white/60 text-sm">2h ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

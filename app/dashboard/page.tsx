"use client"

import { useState } from "react"
import DashboardHeader from "@/components/dashboard/ui/Header"
import SidebarTabs, { type DashboardSection } from "@/components/dashboard/ui/SidebarTabs"
import GameContainer from "@/components/dashboard/ui/GameContainer"
import GamePicker from "@/components/dashboard/ui/GamePicker"
import MinesGame from "@/components/games/mines/MinesGame"
import CrashGame from "@/components/games/rugsfun/Rugs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, ChevronRight, TrendingUp, Gamepad2, Star, Users, DollarSign } from "lucide-react"

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<DashboardSection>("home")
  const [activeGame, setActiveGame] = useState<"rugs" | "mines" | null>(null)
  const [balance, setBalance] = useState<number>(1234.56)

  const renderCenter = () => {
    if (activeSection === "home") {
      return (
        <div className="flex flex-col h-full">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-white text-4xl font-bold mb-4">Welcome to Your Gaming Hub</h1>
            <p className="text-white/70 text-xl">Choose your adventure and start playing today!</p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#df500f] to-[#ff6b35] rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-400 text-sm font-medium">+2.5%</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-1">₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h3>
              <p className="text-white/60 text-sm">Total Balance</p>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-blue-400 text-sm font-medium">127</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-1">Games Played</h3>
              <p className="text-white/60 text-sm">This month</p>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-400 text-sm font-medium">68.5%</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-1">Win Rate</h3>
              <p className="text-white/60 text-sm">All time</p>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <span className="text-yellow-400 text-sm font-medium">12</span>
              </div>
              <h3 className="text-white text-2xl font-bold mb-1">Best Streak</h3>
              <p className="text-white/60 text-sm">Consecutive wins</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#df500f] to-[#ff6b35] rounded-xl flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">Play Games</h3>
                  <p className="text-white/60 text-sm">Choose from our collection of exciting games</p>
                </div>
              </div>
              <Button
                onClick={() => setActiveSection("games")}
                className="w-full bg-gradient-to-r from-[#df500f] to-[#ff6b35] hover:from-[#df500f]/90 hover:to-[#ff6b35]/90 text-white font-medium py-3 rounded-xl"
              >
                Start Playing
              </Button>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">Predict Markets</h3>
                  <p className="text-white/60 text-sm">Coming soon: Bet on real-world events</p>
                </div>
              </div>
              <Button
                onClick={() => setActiveSection("predictmarket")}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 font-medium py-3 rounded-xl"
                disabled
              >
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    if (activeSection === "games") {
      if (!activeGame) return <GamePicker onPick={(g) => setActiveGame(g)} />
      if (activeGame === "mines") return <MinesGame />
      if (activeGame === "rugs") return <CrashGame />
      return null
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-8xl mb-6">📈</div>
        <h2 className="text-white text-4xl font-bold mb-4">Predict Market</h2>
        <p className="text-white/70 text-xl mb-12 max-w-2xl">
          Coming soon: Trade on prediction markets and bet on real-world events
        </p>

        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-lg shadow-2xl">
          <h3 className="text-white font-bold text-xl mb-6 flex items-center justify-center space-x-2">
            <span>🚀</span>
            <span>What's Coming:</span>
          </h3>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3 text-white/70">
              <div className="w-2 h-2 bg-[#df500f] rounded-full"></div>
              <span>Sports betting markets</span>
            </div>
            <div className="flex items-center space-x-3 text-white/70">
              <div className="w-2 h-2 bg-[#df500f] rounded-full"></div>
              <span>Crypto price predictions</span>
            </div>
            <div className="flex items-center space-x-3 text-white/70">
              <div className="w-2 h-2 bg-[#df500f] rounded-full"></div>
              <span>Political event outcomes</span>
            </div>
            <div className="flex items-center space-x-3 text-white/70">
              <div className="w-2 h-2 bg-[#df500f] rounded-full"></div>
              <span>Custom market creation</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gradient-to-r from-[#df500f]/20 to-[#ff6b35]/20 rounded-xl border border-[#df500f]/30">
            <p className="text-white/80 text-sm">
              Be the first to know when we launch! Join our waitlist for early access.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const getGameTitle = () => {
    if (activeGame === "mines") return "Mines"
    if (activeGame === "rugs") return "Rugs (Crash)"
    return null
  }

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)",
      }}
    >
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full mx-auto px-8 py-8">
        <DashboardHeader title="Gaming Dashboard" balanceInINR={balance} />

        <div className="flex gap-8 h-[calc(100vh-180px)]">
          <div className="w-80 shrink-0">
            <SidebarTabs
              selectedSection={activeSection}
              onSelectSection={(s) => {
                setActiveSection(s)
                if (s !== "games") setActiveGame(null)
              }}
            />
          </div>

          <div className="flex-1 flex flex-col">
            {/* Breadcrumb and Back Button */}
            {activeSection === "games" && activeGame && (
              <div className="mb-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveGame(null)}
                  className="border-white/20 text-white hover:bg-white/10 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-xl font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Games
                </Button>

                <div className="flex items-center space-x-2 text-white/60 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <Home className="w-4 h-4" />
                  <span className="text-sm">Dashboard</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-sm">Games</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-white text-sm font-medium">{getGameTitle()}</span>
                </div>
              </div>
            )}

            <GameContainer scrollable={!activeGame}>{renderCenter()}</GameContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import DashboardHeader from "@/components/dashboard/ui/Header"
import SidebarTabs from "@/components/dashboard/ui/SidebarTabs"
import GameContainer from "@/components/dashboard/ui/GameContainer"
import GamePicker from "@/components/dashboard/ui/GamePicker"
import MinesGame from "@/components/games/mines/MinesGame"
import CrashGame from "@/components/games/rugsfun/Rugs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, ChevronRight, TrendingUp, Gamepad2, Star, Users, DollarSign } from "lucide-react"
import { useUI } from "@/contexts/UIContext"
import Image from "next/image"
import NeonGradientCard from "@/components/magicui/neon-gradient-card"
import GameSlotCard from "@/components/dashboard/ui/GameSlotCard"
import FeaturePills from "@/components/dashboard/ui/FeaturePills"
import ChatSidebar from "@/components/dashboard/ui/ChatSidebar"

export default function DashboardPage() {
  const { selectedSection, setSelectedSection, mode } = useUI()
  const [activeGame, setActiveGame] = useState<"rugs" | "mines" | null>(null)
  const [balance, setBalance] = useState<number>(1234.56)
  const [activeCategory, setActiveCategory] = useState<string>("All")

  const categories = ["All", "Duel Poker", "Scratchcards", "Crash", "Blackjack", "Live Games"]

  const renderCenter = () => {
    if (selectedSection === "home") {
      return (
        <div className="mt-5 space-y-6">
          <div className="relative w-full h-56 md:h-64 lg:h-72 overflow-hidden rounded-xl ">
            <Image src="/banner1.png" alt="Home banner" fill className="object-cover rounded" priority />
          </div>

          <FeaturePills />

          {/* <NeonGradientCard className="">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-xl md:text-2xl font-semibold">Welcome to Koon</h3>
                  <p className="text-white/70 mt-1 text-sm md:text-base">Play provably fair games and track your winnings.</p>
                </div>
                <div className="hidden sm:flex gap-3">
                  <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setActiveGame("mines")}>Play Mines</Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setActiveGame("rugs")}>Play Cashout</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-white/60 text-sm">Balance</div>
                  <div className="text-white text-2xl font-bold mt-1">₹{balance.toLocaleString()}</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-white/60 text-sm">Top Game</div>
                  <div className="text-white text-2xl font-bold mt-1">Mines</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-white/60 text-sm">Active Players</div>
                  <div className="text-white text-2xl font-bold mt-1">1,248</div>
                </div>
              </div>
            </div>
          </NeonGradientCard> */}

          <div className="mt-1">
            <div className="flex items-center justify-between mb-3 pl-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pr-2">
                {["All", "Crash"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className={`px-3 py-1.5 rounded-xl text-sm whitespace-nowrap border transition-colors ${
                      activeCategory === c
                        ? "bg-[#ff6b35] text-white border-[#ff6b35]"
                        : "bg-black/30 text-white/80 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="hidden sm:block w-px h-6 bg-white/10" />
            </div>

            <div className="relative">
              <div className="flex gap-3 pl-2 pr-2 overflow-x-auto no-scrollbar">
                <GameSlotCard
                  title="Mines"
                  provider=""
                  imageSrc="/minegame.png"
                  onClick={() => setActiveGame("mines")}
                />
                <GameSlotCard
                  title="Cashout"
                  provider=""
                  imageSrc="/cashout.png"
                  onClick={() => setActiveGame("rugs")}
                />
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    if (selectedSection === "mines") {
      return <MinesGame />
    }

    if (selectedSection === "rugs") {
      return <CrashGame />
    }

    if (selectedSection === "games") {
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

                      <div className="mt-8 p-4 bg-red-600/20 rounded-xl border border-red-600/30">
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

  const NearMarketPanel = () => {
    return (
      <div className="w-96 shrink-0 h-full border-l border-border bg-background/70 backdrop-blur rounded-l-3xl overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">NearMarket</h3>
          <p className="text-sm text-foreground/70 mb-4">Browse and trade prediction markets.</p>

          <div className="space-y-3">
            {Array.from({ length: 30 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border border-border p-3 bg-secondary/40">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Market #{idx + 1}</div>
                    <div className="text-xs text-foreground/60">Ends in {(idx + 1) * 3}h</div>
                  </div>
                  <Button size="sm" className="h-8">View</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden pr-80"
      style={{
        background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)",
      }}
    >
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <ChatSidebar />

      <div className="relative z-10 w-full mx-auto pt-14">
        <DashboardHeader title="Koon" balanceInINR={balance} />

        <div className="flex gap-0 h-[calc(100vh-56px)] overflow-hidden">
          <div className="w-64 shrink-0 m-0 p-0">
            <SidebarTabs />
          </div>

          <div className="flex-1 flex flex-col m-0 p-0 px-3 sm:px-4 md:px-6 lg:px-8 bg-gray-800">
            {/* Breadcrumb and Back Button */}
            {mode === "casino" && selectedSection === "games" && activeGame && (
              <div className="mb-0 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveGame(null)}
                  className="border-white/20 text-white hover:bg-white/10 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-xl font-medium m-0"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Games
                </Button>

                <div className="flex items-center space-x-2 text-white/60 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 m-0">
                  <Home className="w-4 h-4" />
                  <span className="text-sm">Dashboard</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-sm">Games</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-white text-sm font-medium">{getGameTitle()}</span>
                </div>
              </div>
            )}

            {mode === "casino" ? (
              selectedSection === "home" ? (
                <div className="flex flex-col gap-4">{renderCenter()}</div>
              ) : (
                <GameContainer scrollable={false}>{renderCenter()}</GameContainer>
              )
            ) : (
              <div className="h-full" />
            )}
          </div>

          {mode === "nearmarket" ? <NearMarketPanel /> : null}
        </div>
      </div>
    </div>
  )
}

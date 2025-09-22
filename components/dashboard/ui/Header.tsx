"use client"
import { Card } from "@/components/ui/card"
import { Wallet, TrendingUp, Settings } from "lucide-react"

interface DashboardHeaderProps {
  title?: string
  balanceInINR: number
}

export default function DashboardHeader({ title = "Dashboard", balanceInINR }: DashboardHeaderProps) {
  return (
    <div className="w-full mb-6">
      <Card className="bg-black/40 backdrop-blur-md border-white/10 px-8 py-6 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-[#df500f] to-[#ff6b35] rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">🎮</span>
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold mb-1">{title}</h1>
              <p className="text-white/70 text-sm">Welcome back to your gaming hub</p>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Wallet className="w-5 h-5 text-white/60" />
                <span className="text-white/60 text-sm font-medium">Total Balance</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-white text-3xl font-bold">
                  ₹{balanceInINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <div className="flex items-center space-x-1 bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-green-500/30">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">+2.5%</span>
                </div>
              </div>
            </div>

            <button className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-200">
              <Settings className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

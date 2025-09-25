"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  name: string
  winnings: number
  gamesPlayed: number
}

function formatNear(amount: number): string {
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} NEAR`
}

export default function Leaderboard() {
  const topPlayers: LeaderboardEntry[] = [
    { rank: 1, name: "CryptoWhale.near", winnings: 12543.78, gamesPlayed: 342 },
    { rank: 2, name: "AceGambler.near", winnings: 10321.12, gamesPlayed: 297 },
    { rank: 3, name: "LuckyFox.near", winnings: 8744.5, gamesPlayed: 261 },
    { rank: 4, name: "SharpShooter.near", winnings: 7211.05, gamesPlayed: 238 },
    { rank: 5, name: "WinStreak.near", winnings: 6432.89, gamesPlayed: 205 },
  ]

  return (
    <div className="flex-1 h-full">
      <Card className="w-full h-full bg-transparent rounded-none shadow-none p-0 border-0 overflow-x-auto">
        <div className="h-full w-full">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-white text-2xl font-bold tracking-tight">Leaderboard</h2>
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>

          <div className="p-4 sm:p-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden min-h-[24rem] sm:min-h-[28rem]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-6 text-gray-400 font-semibold w-20 text-center">Rank</th>
                    <th className="p-6 text-gray-400 font-semibold">Player</th>
                    <th className="p-6 text-gray-400 font-semibold text-right">Winnings</th>
                    <th className="p-6 text-gray-400 font-semibold text-right">Total games played</th>
                  </tr>
                </thead>
                <tbody>
                  {topPlayers.map((entry) => (
                    <tr key={entry.rank} className="border-b border-white/5 hover:bg-white/5 transition-all duration-300 group">
                      <td className="p-6 text-center">
                        <div className="text-white font-semibold">{entry.rank}</div>
                      </td>
                      <td className="p-6">
                        <div className="text-white font-semibold">{entry.name}</div>
                      </td>
                      <td className="p-6 text-right tabular-nums whitespace-nowrap">
                        <div className="text-emerald-400 font-semibold">{formatNear(entry.winnings)}</div>
                      </td>
                      <td className="p-6 text-right tabular-nums">
                        <div className="text-white font-semibold">{entry.gamesPlayed.toLocaleString()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
} 
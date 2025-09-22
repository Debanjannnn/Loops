"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"

interface MineCell {
  id: number
  isRevealed: boolean
  isMine: boolean
  isGem: boolean
}

interface PopupState {
  isOpen: boolean
  type: "mine" | "gem" | null
  cellId: number | null
}

export default function MinesGame() {
  const [betAmount, setBetAmount] = useState("0.00")
  const [mineCount, setMineCount] = useState("3")
  const [gemCount, setGemCount] = useState("22")
  const [totalProfit, setTotalProfit] = useState("0.00")
  const [gameMode, setGameMode] = useState<"manual" | "auto">("manual")
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [multiplier, setMultiplier] = useState(1.0)
  const [popup, setPopup] = useState<PopupState>({ isOpen: false, type: null, cellId: null })
  const [grid, setGrid] = useState<MineCell[]>(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      isRevealed: false,
      isMine: false,
      isGem: false,
    })),
  )

  useEffect(() => {
    const mines = Number.parseInt(mineCount)
    const gems = 25 - mines
    setGemCount(gems.toString())
  }, [mineCount])

  const initializeGame = () => {
    const mines = Number.parseInt(mineCount)
    const newGrid = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      isRevealed: false,
      isMine: false,
      isGem: false,
    }))

    const minePositions = new Set<number>()
    while (minePositions.size < mines) {
      const randomPos = Math.floor(Math.random() * 25)
      minePositions.add(randomPos)
    }

    newGrid.forEach((cell, index) => {
      if (minePositions.has(index)) {
        cell.isMine = true
      } else {
        cell.isGem = true
      }
    })

    setGrid(newGrid)
    setGameOver(false)
    setMultiplier(1.0)
    setTotalProfit("0.00")
  }

  const handleCellClick = (cellId: number) => {
    if (!isPlaying || gameOver) return

    const cell = grid[cellId]
    if (cell.isRevealed) return

    setGrid((prev) => prev.map((c) => (c.id === cellId ? { ...c, isRevealed: true } : c)))

    if (cell.isMine) {
      setPopup({ isOpen: true, type: "mine", cellId })
      setGrid((prev) => prev.map((c) => (c.isMine ? { ...c, isRevealed: true } : c)))
      setGameOver(true)
      setIsPlaying(false)
      setTotalProfit("0.00")
    } else {
      const revealedGems = grid.filter((c) => c.isRevealed && c.isGem).length + 1
      const totalGems = Number.parseInt(gemCount)
      const newMultiplier = calculateMultiplier(revealedGems, totalGems, Number.parseInt(mineCount))
      setMultiplier(newMultiplier)

      const bet = Number.parseFloat(betAmount) || 0
      const profit = bet * (newMultiplier - 1)
      setTotalProfit(profit.toFixed(2))
    }
  }

  const calculateMultiplier = (revealedGems: number, totalGems: number, mines: number) => {
    if (revealedGems === 0) return 1.0

    let result = 1.0
    for (let i = 0; i < revealedGems; i++) {
      result *= (totalGems - i) / (25 - mines - i)
    }
    return result
  }

  const handleBet = () => {
    if (isPlaying) {
      if (totalProfit !== "0.00") {
        setPopup({ isOpen: true, type: "gem", cellId: null })
      }
      setIsPlaying(false)
      setGameOver(true)
    } else {
      setIsPlaying(true)
      initializeGame()
    }
  }

  const handleRandomPick = () => {
    if (!isPlaying || gameOver) return

    const unrevealedCells = grid.filter((cell) => !cell.isRevealed)
    if (unrevealedCells.length === 0) return

    const randomCell = unrevealedCells[Math.floor(Math.random() * unrevealedCells.length)]
    handleCellClick(randomCell.id)
  }

  const adjustBetAmount = (factor: number) => {
    const current = Number.parseFloat(betAmount) || 0
    setBetAmount((current * factor).toFixed(2))
  }

  const closePopup = () => {
    setPopup({ isOpen: false, type: null, cellId: null })
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <div className="w-80 bg-gray-900/90 backdrop-blur-sm p-6 border-r border-gray-700/50">
        <div className="space-y-6">
          <div className="flex bg-gray-800/80 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={() => setGameMode("manual")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                gameMode === "manual" ? "bg-gray-700/80 text-white backdrop-blur-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => setGameMode("auto")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                gameMode === "auto" ? "bg-gray-700/80 text-white backdrop-blur-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              Auto
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Bet Amount</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 text-white pr-16"
                  placeholder="0.00"
                  disabled={isPlaying}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  <button
                    onClick={() => adjustBetAmount(0.5)}
                    className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                    disabled={isPlaying}
                  >
                    ½
                  </button>
                  <button
                    onClick={() => adjustBetAmount(2)}
                    className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                    disabled={isPlaying}
                  >
                    2×
                  </button>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400">₹0.00</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Mines</label>
            <Select value={mineCount} onValueChange={setMineCount} disabled={isPlaying}>
              <SelectTrigger className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900/95 backdrop-blur-sm border-gray-700/50">
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white hover:bg-gray-700/60">
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Gems</label>
            <Input
              value={gemCount}
              readOnly
              className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 text-white"
            />
          </div>

          <Button
            onClick={handleBet}
            className="w-full bg-green-600/90 hover:bg-green-500/80 backdrop-blur-sm text-white font-semibold py-3 border-0"
          >
            {isPlaying ? "Cash Out" : "Bet"}
          </Button>

          <Button
            onClick={handleRandomPick}
            variant="outline"
            className="w-full border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700/60 bg-gray-800/80 backdrop-blur-sm"
            disabled={!isPlaying || gameOver}
          >
            Random Pick
          </Button>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Total Profit ({multiplier.toFixed(2)}×)</label>
            <div className="flex items-center space-x-2">
              <Input
                value={totalProfit}
                readOnly
                className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 text-white flex-1"
              />
              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">₹</span>
              </div>
            </div>
            <div className="text-xs text-gray-400">₹0.00</div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="grid grid-cols-5 gap-3 max-w-2xl">
          {grid.map((cell) => (
            <Card
              key={cell.id}
              onClick={() => handleCellClick(cell.id)}
              className={`
                w-20 h-20 flex items-center justify-center cursor-pointer transition-all duration-200 backdrop-blur-sm
                ${
                  cell.isRevealed
                    ? cell.isMine
                      ? "bg-red-600/80 hover:bg-red-500/70 border-red-500/50"
                      : "bg-green-600/80 hover:bg-green-500/70 border-green-500/50"
                    : "bg-gray-800/80 border-gray-700/50 hover:bg-gray-700/60"
                }
                ${!isPlaying || gameOver ? "cursor-not-allowed opacity-75" : ""}
              `}
            >
              {cell.isRevealed && <span className="text-2xl">{cell.isMine ? "💣" : "💎"}</span>}
            </Card>
          ))}
        </div>
      </div>

      {popup.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 w-full max-w-none mx-0 relative">
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center space-y-6">
              {popup.type === "mine" ? (
                <>
                  <div className="text-6xl mb-4">💣</div>
                  <img
                    src="/sad-monkey.gif"
                    alt="Mine explosion"
                    className="w-full h-auto object-cover rounded-lg"
                  />
                  <h2 className="text-2xl font-bold text-red-400">BOOM! You Hit a Mine!</h2>
                  <p className="text-gray-400">Game Over! Better luck next time.</p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">💎</div>
                  <img
                    src="/sparkling-diamond-gem-treasure-success-golden-ligh.jpg"
                    alt="Gem found"
                    className="w-full h-auto object-cover rounded-lg"
                  />
                  <h2 className="text-2xl font-bold text-green-400">Congratulations!</h2>
                  <p className="text-gray-400">
                    You cashed out with ₹{totalProfit} profit at {multiplier.toFixed(2)}× multiplier!
                  </p>
                </>
              )}

              <Button onClick={closePopup} className="w-full bg-gray-700/80 hover:bg-gray-600/70 text-white">
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
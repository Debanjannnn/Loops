"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { X, Zap, TrendingUp } from "lucide-react"
import useSound from "use-sound"



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

interface MinesGameProps {
  compact?: boolean
}

export default function MinesGame({ compact = false }: MinesGameProps) {
  const [betAmount, setBetAmount] = useState("0.00")
  const [mineCount, setMineCount] = useState("3")
  const [gemCount, setGemCount] = useState("22")
  const [totalProfit, setTotalProfit] = useState("0.00")
  const [gameMode, setGameMode] = useState<"manual" | "auto">("manual")
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [multiplier, setMultiplier] = useState(1.0)
  const [popup, setPopup] = useState<PopupState>({ isOpen: false, type: null, cellId: null })
  const [loseImageSrc, setLoseImageSrc] = useState("/sad-monkey.gif")
  const loseMessages = [
    "Every pro loses once. Bounce back stronger.",
    "Close call? Your comeback starts here.",
    "The next bet could flip it all.",
    "Losses are just the setup for a bigger win.",
    "Don’t stop now — your turn is coming.",
    "You were this close 👌 — go again.",
    "Even champions lose a round. Win the next one.",
  ]
  const [loseMessage, setLoseMessage] = useState(loseMessages[0])
  const [grid, setGrid] = useState<MineCell[]>(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      isRevealed: false,
      isMine: false,
      isGem: false,
    })),
  )
  const [BetSound] = useSound("/sounds/Bet.mp3");
  const [BombSound] = useSound("/sounds/Bomb.mp3");
  const [CashoutSound] = useSound("/sounds/Cashout.mp3");
  const [GemsSound] = useSound("/sounds/Gems.mp3");


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
      BombSound()
      setLoseImageSrc(Math.random() < 0.5 ? "/loosewin.png" : "/sad-monkey.gif")
      setLoseMessage(loseMessages[Math.floor(Math.random() * loseMessages.length)])
      setPopup({ isOpen: true, type: "mine", cellId })
      setGrid((prev) => prev.map((c) => (c.isMine ? { ...c, isRevealed: true } : c)))
      setGameOver(true)
      setIsPlaying(false)
      setTotalProfit("0.00")
    } else {
      // Just update multiplier and profit without showing popup
      const revealedGems = grid.filter((c) => c.isRevealed && c.isGem).length + 1
      const totalGems = Number.parseInt(gemCount)
      const newMultiplier = calculateMultiplier(revealedGems, totalGems, Number.parseInt(mineCount))
      setMultiplier(newMultiplier)
      GemsSound()

      const bet = Number.parseFloat(betAmount) || 0
      const profit = bet * (newMultiplier - 1)
      setTotalProfit(profit.toFixed(2))
    }
  }

  const calculateMultiplier = (revealedGems: number, totalGems: number, mines: number) => {
    if (revealedGems === 0) return 1.0

    let result = 1.0
    for (let i = 0; i < revealedGems; i++) {
      result *= (25 - i) / (25 - mines - i)
    }
    return result
  }

  const handleBet = () => {
    if (isPlaying) {
      CashoutSound()
      // Always show success popup on cash out
      setPopup({ isOpen: true, type: "gem", cellId: null })
      setIsPlaying(false)
      setGameOver(true)
    } else {
      setIsPlaying(true)
      initializeGame()
      BetSound()
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
    <div
      className={`flex ${compact ? "min-h-full" : "min-h-full"} text-white relative overflow-hidden w-full h-full gap-3 md:gap-4`}
    >


      {/* Sidebar */}
      <div
        className={`relative z-10 ${compact ? "w-80" : "w-96"} bg-black/40 backdrop-blur-md border-0 ${compact ? "p-4" : "p-6"}`}
      >
        <div className="space-y-4">
          {/* Game Mode Toggle */}
          <div className="flex bg-black/30 backdrop-blur-sm rounded-4xl p-1 border border-white/10">
            <button
              onClick={() => setGameMode("manual")}
              className={`flex-1 py-3 px-4 rounded-4xl text-sm font-medium transition-all duration-200 ${gameMode === "manual"
                  ? "bg-red-600/80 text-white backdrop-blur-sm shadow-lg"
                  : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Manual
            </button>
            <button
              onClick={() => setGameMode("auto")}
              className={`flex-1 py-3 px-4 rounded-4xl text-sm font-medium transition-all duration-200 ${gameMode === "auto"
                  ? "bg-red-600/80 text-white backdrop-blur-sm shadow-lg"
                  : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Auto
            </button>
          </div>

          {/* Bet Amount */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-medium">Bet Amount</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="bg-black/30 backdrop-blur-sm border-white/20 text-white pr-20 focus:border-red-600/50 focus:ring-red-600/20 h-12 rounded-4xl"
                  placeholder="0.00"
                  disabled={isPlaying}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                  <button
                    onClick={() => adjustBetAmount(0.5)}
                    className="text-[#df500f] hover:text-[#ff6b35] text-sm font-bold px-2 py-1 rounded-md hover:bg-white/10 transition-all"
                    disabled={isPlaying}
                  >
                    ½
                  </button>
                  <button
                    onClick={() => adjustBetAmount(2)}
                    className="text-[#df500f] hover:text-[#ff6b35] text-sm font-bold px-2 py-1 rounded-md hover:bg-white/10 transition-all"
                    disabled={isPlaying}
                  >
                    2×
                  </button>
                </div>
              </div>
            </div>
            <div className="text-xs text-white/50">₹0.00</div>
          </div>

          {/* Mines Count */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-medium">Mines</label>
            <Select value={mineCount} onValueChange={setMineCount} disabled={isPlaying}>
              <SelectTrigger className="bg-black/30 backdrop-blur-sm border-white/20 text-white h-12 rounded-4xl focus:border-red-600/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/90 backdrop-blur-md border-white/20 rounded-4xl">
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem
                    key={i + 1}
                    value={(i + 1).toString()}
                    className="text-white hover:bg-[#df500f]/20 focus:bg-[#df500f]/20 rounded-lg"
                  >
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gems Count */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-medium">Gems</label>
            <Input
              value={gemCount}
              readOnly
              className="bg-black/30 backdrop-blur-sm border-white/20 text-white h-12 rounded-4xl"
            />
          </div>

          {/* Bet Button */}
          <Button
            onClick={handleBet}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 h-14 rounded-4xl border-0 shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            {isPlaying ? "💰 Cash Out" : "🎯 Start Game"}
          </Button>

          {/* Random Pick Button */}
          <Button
            onClick={handleRandomPick}
            variant="outline"
            className="w-full border-white/20 text-white hover:text-white hover:bg-white/10 bg-black/30 backdrop-blur-sm h-12 rounded-4xl transition-all duration-200"
            disabled={!isPlaying || gameOver}
          >
            🎲 Random Pick
          </Button>

          {/* Total Profit */}
          <div className="space-y-2">
            <label className="text-sm text-white/70 font-medium">Total Profit ({multiplier.toFixed(2)}×)</label>
            <div className="flex items-center space-x-3">
              <Input
                value={totalProfit}
                readOnly
                className="bg-black/30 backdrop-blur-sm border-white/20 text-white flex-1 h-12 rounded-4xl"
              />
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">₹</span>
              </div>
            </div>
            <div className="text-xs text-white/50">₹0.00</div>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className={`relative z-10 flex-1 p-0 h-full`}>
        <div className={`grid grid-cols-5 grid-rows-5 gap-3 w-full h-full`}>
          {grid.map((cell) => (
            <Card
              key={cell.id}
              onClick={() => handleCellClick(cell.id)}
              className={`
                w-full h-full flex items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-sm border-2 rounded-xl hover:scale-105
                ${cell.isRevealed
                  ? cell.isMine
                    ? "bg-red-500/80 hover:bg-red-400/70 border-red-400/50 shadow-lg shadow-red-500/20"
                    : "bg-gradient-to-br from-[#df500f]/80 to-[#ff6b35]/80 hover:from-[#ff6b35]/70 hover:to-[#df500f]/70 border-[#df500f]/50 shadow-lg shadow-[#df500f]/20"
                  : "bg-black/30 border-white/20 hover:bg-white/10 hover:border-white/30 shadow-lg"
                }
                ${!isPlaying || gameOver ? "cursor-not-allowed opacity-50" : "hover:shadow-xl"}
              `}
            >
              {cell.isRevealed && (
                <div className="w-8 h-8 flex items-center justify-center">
                  {cell.isMine ? (
                    <img src="/Bomb.svg" alt="Bomb" className="w-full h-full object-contain filter drop-shadow-lg" />
                  ) : (
                    <img src="/Gems.svg" alt="Gem" className="w-full h-full object-contain filter drop-shadow-lg" />
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Popup Modal */}
      {popup.isOpen && (
        <div
          onClick={closePopup}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-md relative shadow-2xl"
          >
            <button
              type="button"
              onClick={closePopup}
              className="absolute top-4 right-4 z-10 pointer-events-auto text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X size={24} />
            </button>

            <div className="text-center space-y-4">
              {popup.type === "mine" ? (
                <>
                  <div className="w-32 h-32 mb-6 animate-bounce flex items-center justify-center mx-auto">
                    <img src="/Bomb.svg" alt="Bomb" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-full h-64 bg-gradient-to-br from-red-500/20 to-red-700/20 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img
                      src={loseImageSrc || "/placeholder.svg"}
                      alt="Mine explosion"
                      className="w-full h-full object-cover rounded-2xl opacity-80"
                    />
                  </div>
                  <h2 className="text-5xl font-bold text-red-400">BOOM! Mine Hit!</h2>
                  <p className="text-white/70 text-lg">{loseMessage}</p>
                </>
              ) : (
                <>
                  <div className="w-32 h-32 mb-6 animate-pulse flex items-center justify-center mx-auto">
                    <img src="/Gems.svg" alt="Gem" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-full h-64 bg-red-600/20 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img
                      src="/nachoo.gif"
                      alt="Successful cashout"
                      className="w-full h-full object-contain rounded-2xl opacity-80"
                    />
                  </div>
                  <h2 className="text-5xl font-bold text-[#df500f]">Congratulations!</h2>
                  <p className="text-white/70 text-lg">
                    You cashed out with ₹{totalProfit} profit at {multiplier.toFixed(2)}× multiplier!
                  </p>
                </>
              )}

              <Button
                onClick={closePopup}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-4xl font-semibold"
              >
                Continue Playing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

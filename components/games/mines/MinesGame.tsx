"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import useSound from "use-sound"
import confetti from "canvas-confetti"



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

  // Per-reveal multiplier factors based on number of mines
  const perRevealMultiplierByMines: Record<number, number> = {
    3: 1.15,
    4: 1.25,
    5: 1.35,
    6: 1.45,
    7: 1.55,
    8: 1.65,
    9: 1.75,
    10: 1.85,
    11: 2.0,
    12: 2.2,
    13: 2.4,
    14: 2.6,
    15: 2.8,
    16: 3.0,
    17: 3.25,
    18: 3.5,
    19: 3.75,
    20: 4.0,
    21: 4.5,
  }

  const getPerRevealFactor = (mines: number) => {
    if (perRevealMultiplierByMines[mines as keyof typeof perRevealMultiplierByMines]) {
      return perRevealMultiplierByMines[mines as keyof typeof perRevealMultiplierByMines]
    }
    // Clamp outside the provided range to nearest known value
    if (mines < 3) return perRevealMultiplierByMines[3]
    return perRevealMultiplierByMines[21]
  }


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
      // Update multiplier based on per-reveal factor tied to mine count
      const mines = Number.parseInt(mineCount)
      const factor = getPerRevealFactor(mines)
      const newMultiplier = multiplier * factor
      setMultiplier(newMultiplier)
      GemsSound()

      const bet = Number.parseFloat(betAmount) || 0
      const profit = bet * (newMultiplier - 1)
      setTotalProfit(profit.toFixed(2))
    }
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

  useEffect(() => {
    if (!(popup.isOpen && popup.type === "gem")) return

    const end = Date.now() + 3 * 1000
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]
    let rafId: number
    let cancelled = false

    const frame = () => {
      if (cancelled) return
      if (Date.now() > end) return

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors,
      })

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [popup])

  return (
    <div className="mx-auto max-w-6xl w-full pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-4">
        {/* Left control panel */}
        <div className={`rounded-2xl border border-border bg-background/60 p-3 lg:p-4`}>
          <div className="space-y-3">
            {/* Game Mode Toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-1">
              <button
                onClick={() => setGameMode("manual")}
                className={`h-8 rounded-lg text-xs font-semibold ${
                  gameMode === "manual"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted transition"
                }`}
                aria-pressed={gameMode === "manual"}
              >
                Manual
              </button>
              <button
                onClick={() => setGameMode("auto")}
                className={`h-8 rounded-lg text-xs font-semibold ${
                  gameMode === "auto"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted transition"
                }`}
                aria-pressed={gameMode === "auto"}
              >
                Auto
              </button>
            </div>

            {/* Bet Amount */}
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Bet Amount</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm">
                  <Input
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full bg-transparent outline-none border-0 h-8 p-0"
                    placeholder="0.00"
                    disabled={isPlaying}
                  />
                </div>
                <button
                  onClick={() => adjustBetAmount(0.5)}
                  className="h-9 rounded-xl border border-border px-2 text-xs text-foreground/80 hover:bg-muted"
                  disabled={isPlaying}
                >
                  ½
                </button>
                <button
                  onClick={() => adjustBetAmount(2)}
                  className="h-9 rounded-xl border border-border px-2 text-xs text-foreground/80 hover:bg-muted"
                  disabled={isPlaying}
                >
                  2×
                </button>
              </div>
              <div className="mt-1 text-[11px] text-foreground/50">₹0.00</div>
            </div>

            {/* Mines and Gems */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Mines</div>
                <Select value={mineCount} onValueChange={setMineCount} disabled={isPlaying}>
                  <SelectTrigger className="bg-background/70 border border-border h-10 rounded-xl focus:border-primary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background/90 backdrop-blur-md border border-border rounded-2xl">
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()} className="text-foreground hover:bg-muted focus:bg-muted rounded-lg">
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Gems</div>
                <Input value={gemCount} readOnly className="bg-background/70 border border-border h-10 rounded-xl" />
              </div>
            </div>

            {/* Bet / Cash out */}
            <div className="pt-1">
              {!isPlaying ? (
                <Button className="w-full h-10 rounded-xl" onClick={handleBet}>
                  🎯 Start Game
                </Button>
              ) : (
                <Button variant="secondary" className="w-full h-10 rounded-xl" onClick={handleBet}>
                  💰 Cash Out
                </Button>
              )}
            </div>

            {/* Random Pick */}
            <div>
              <Button onClick={handleRandomPick} variant="outline" className="w-full h-9 rounded-xl" disabled={!isPlaying || gameOver}>
                🎲 Random Pick
              </Button>
            </div>

            {/* Total Profit */}
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Total Profit ({multiplier.toFixed(2)}×)</div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm">
                <span className="text-foreground/60">₹{Number(totalProfit).toFixed(2)}</span>
              </div>
            </div>

            {/* Status */}
            <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-foreground/80">
              {!isPlaying && !gameOver && "Press Start Game to begin. Reveal safe gems to increase multiplier."}
              {isPlaying && !gameOver && "Game in progress. Click tiles to reveal. Cash out anytime."}
              {gameOver && totalProfit !== "0.00" && `You cashed out with ₹${totalProfit} at ${multiplier.toFixed(2)}×.`}
              {gameOver && totalProfit === "0.00" && "Boom! You hit a mine. Try again."}
            </div>
          </div>
        </div>

        {/* Right board panel */}
        <div className="relative rounded-2xl border border-border bg-background/60 p-3 lg:p-5">
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/40" />

          <div className={`mx-auto max-w-[900px]`}>
            <div className="rounded-2xl border border-border bg-background/30 p-3 sm:p-4">
              <div className={`grid grid-cols-5 grid-rows-5 gap-3 w-full`}>
                {grid.map((cell) => (
                  <Card
                    key={cell.id}
                    onClick={() => handleCellClick(cell.id)}
                    className={`
                      w-full aspect-square flex items-center justify-center cursor-pointer transition-all duration-200 border rounded-xl
                      ${cell.isRevealed
                        ? cell.isMine
                          ? "bg-destructive/80 border-destructive/50"
                          : "bg-primary/80 border-primary/50"
                        : "border-border bg-background/60 hover:bg-muted"}
                      ${!isPlaying || gameOver ? "cursor-not-allowed opacity-50" : ""}
                    `}
                  >
                    {cell.isRevealed && (
                      <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
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
          </div>
        </div>

        {/* Popup Modal */}
        {popup.isOpen && (
          <div onClick={closePopup} className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div onClick={(e) => e.stopPropagation()} className="bg-background/60 backdrop-blur-xl border border-border rounded-3xl p-8 w-full max-w-md relative shadow-2xl">
              <button type="button" onClick={closePopup} className="absolute top-4 right-4 z-10 pointer-events-auto text-foreground/60 hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full">
                <X size={24} />
              </button>

              <div className="text-center space-y-3">
                {popup.type === "mine" ? (
                  <>
                    <div className="w-32 h-32 mb-6 animate-bounce flex items-center justify-center mx-auto">
                      <img src="/Bomb.svg" alt="Bomb" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-full h-64 bg-destructive/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img src={loseImageSrc || "/placeholder.svg"} alt="Mine explosion" className="w-full h-full object-cover rounded-2xl opacity-80" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-wide uppercase text-destructive">BOOM! Mine Hit!</h2>
                    <p className="text-foreground/70 text-base">{loseMessage}</p>
                  </>
                ) : (
                  <>
                    <div className="w-32 h-32 mb-6 animate-pulse flex items-center justify-center mx-auto">
                      <img src="/Gems.svg" alt="Gem" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-full h-64 bg-primary/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img src="/nachoo.gif" alt="Successful cashout" className="w-full h-full object-contain rounded-2xl opacity-80" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-wide uppercase text-primary">Congratulations!</h2>
                    <p className="text-foreground/70 text-base">You cashed out with ₹{totalProfit} profit at {multiplier.toFixed(2)}× multiplier!</p>
                  </>
                )}

                <Button onClick={closePopup} className="w-full h-12 rounded-2xl font-semibold">
                  Continue Playing
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import confetti from "canvas-confetti"
import { X } from "lucide-react"
import useSound from "use-sound"

type GameStatus = "idle" | "in-progress" | "won" | "lost" | "cashed-out"

type Difficulty = "Easy" | "Hard"

interface PaajiOnTopProps {
  rows?: number
  cols?: number
}

type RowConfig = {
  safeIndices: number[]
  revealedIndex?: number
}

type PopupType = "win" | "lose" | null

type PopupState = {
  isOpen: boolean
  type: PopupType
}

export function PaajiOnTop({ rows = 8, cols = 4 }: PaajiOnTopProps) {
  const [status, setStatus] = React.useState<GameStatus>("idle")
  const [currentRow, setCurrentRow] = React.useState(0)
  const [config, setConfig] = React.useState<RowConfig[]>([])
  const [steps, setSteps] = React.useState(0)
  const [difficulty, setDifficulty] = React.useState<Difficulty>("Easy")
  const [numCols, setNumCols] = React.useState(cols)
  const [betAmount, setBetAmount] = React.useState<string>("0.00000000")
  const [popup, setPopup] = React.useState<PopupState>({ isOpen: false, type: null })

  const [PaajiWinSound] = useSound("/sounds/PaajiWin.mp3");
  const [BetSound] = useSound("/sounds/Bet.mp3");
  const[PaajiLoseSound] = useSound("/sounds/PaajiLose.mp3");
  const[PaajiCashoutSound] = useSound("/sounds/PaajiCashOut.mp3");

  const multiplier = React.useMemo(() => {
    const base = 1
    return (base * Math.pow(1.25, steps)).toFixed(2)
  }, [steps])

  const canPlay = status === "in-progress"

  React.useEffect(() => {
    if (difficulty === "Easy") setNumCols(4)
    if (difficulty === "Hard") setNumCols(5)
  }, [difficulty])

  function generateBoard(): RowConfig[] {
    const next: RowConfig[] = []
    const safePerRow = difficulty === "Easy" ? 2 : 1
    for (let r = 0; r < rows; r++) {
      const indices: number[] = []
      while (indices.length < safePerRow) {
        const candidate = Math.floor(Math.random() * numCols)
        if (!indices.includes(candidate)) indices.push(candidate)
      }
      next.push({ safeIndices: indices })
    }
    return next
  }

  function startGame() {
    BetSound()
    setConfig(generateBoard())
    setStatus("in-progress")
    setCurrentRow(0)
    setSteps(0)
    setPopup({ isOpen: false, type: null })
  }

  function resetGame() {
    setStatus("idle")
    setCurrentRow(0)
    setConfig([])
    setSteps(0)
    setPopup({ isOpen: false, type: null })
  }

  function cashOut() {
    if (status === "in-progress") {
      setStatus("cashed-out")
      PaajiCashoutSound()
    }
  }

  function pickTile(row: number, col: number) {
    if (!canPlay) return
    if (row !== currentRow) return

    setConfig((prev) => {
      const next = [...prev]
      const rowCfg = { ...next[row], revealedIndex: col }
      next[row] = rowCfg
      return next
    })

    const isSafe = config[row]?.safeIndices?.includes(col) === true
    if (isSafe) {
      const nextRow = currentRow + 1
      setSteps((s) => s + 1)
      PaajiWinSound()
      if (nextRow >= rows) {
        setCurrentRow(nextRow)
        setStatus("won")
        PaajiCashoutSound()
      
      } else {
        setCurrentRow(nextRow)
      }
    } else {
      setStatus("lost")
      PaajiLoseSound()
    }
  }

  React.useEffect(() => {
    if (status === "lost") {
      setPopup({ isOpen: true, type: "lose" })
    }
    if (status === "won" || status === "cashed-out") {
      setPopup({ isOpen: true, type: "win" })
      
    }
  }, [status])

  React.useEffect(() => {
    if (!(popup.isOpen && popup.type === "win")) return

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

  const closePopup = () => setPopup({ isOpen: false, type: null })

  return (
    <div className="mx-auto max-w-6xl w-full pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-4">
        {/* Left control panel */}
        <div className="rounded-2xl border border-border bg-background/60 p-3 lg:p-4">
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-border p-1">
            <button
              className="h-8 rounded-lg text-xs font-semibold bg-primary text-primary-foreground"
              aria-pressed={true}
            >
              Manual
            </button>
            <button className="h-8 rounded-lg text-xs font-semibold text-foreground/70 hover:text-foreground hover:bg-muted transition">
              Auto
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Bet Amount</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm">
                  <input
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    inputMode="decimal"
                    className="w-full bg-transparent outline-none"
                    aria-label="Bet amount"
                  />
                </div>
                <button className="h-9 rounded-xl border border-border px-2 text-xs text-foreground/80 hover:bg-muted">½</button>
                <button className="h-9 rounded-xl border border-border px-2 text-xs text-foreground/80 hover:bg-muted">2×</button>
              </div>
            </div>

            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Difficulty</div>
              <div className="grid grid-cols-2 gap-2">
                {["Easy", "Hard"].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDifficulty(d as Difficulty)
                      resetGame()
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm",
                      difficulty === d
                        ? "bg-primary text-primary-foreground"
                        : "border-border text-foreground/80 hover:bg-muted",
                    )}
                    aria-pressed={difficulty === d}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1">
              {status !== "in-progress" ? (
                <Button className="w-full h-10 rounded-xl" onClick={startGame}>
                  Bet
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" className="h-10 rounded-xl" onClick={cashOut}>
                    Cash out
                  </Button>
                  <Button variant="ghost" className="h-10 rounded-xl" onClick={resetGame}>
                    Reset
                  </Button>
                </div>
              )}
            </div>

            <div>
              <button className="w-full h-9 rounded-xl border border-border text-sm text-foreground/80 hover:bg-muted">
                Random Pick
              </button>
            </div>

            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Total Profit ({(1.0).toFixed(2)}x)</div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm">
                <span className="text-foreground/60">{Number(0).toFixed(8)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-foreground/80">
              {status === "idle" && "Press Bet to begin. Pick one tile per row from bottom to top."}
              {status === "in-progress" && `Row ${currentRow + 1} of ${rows}. Choose a safe tile.`}
              {status === "won" && `You reached the top! Final multiplier ${multiplier}x.`}
              {status === "lost" && "Boom! You hit a bomb. Try again."}
              {status === "cashed-out" && `You cashed out at ${steps} step${steps === 1 ? "" : "s"} • ${multiplier}x.`}
            </div>
          </div>
        </div>

        {/* Right board panel */}
        <div className="relative rounded-2xl border border-border bg-background/60 p-3 lg:p-5">
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/40" />

          <div className={cn("mx-auto", numCols === 3 && "max-w-[720px]", numCols === 4 && "max-w-[900px]", numCols >= 5 && "max-w-[1040px]")}>          
            <div className="rounded-2xl border border-border bg-background/30 p-3 sm:p-4">
              <div className="grid gap-3">
                {Array.from({ length: rows }).map((_, row) => {
                  const logicalRow = rows - 1 - row
                  const rowCfg = config[logicalRow]
                  const isActive = canPlay && logicalRow === currentRow
                  const isPast =
                    logicalRow < currentRow || status === "won" || status === "lost" || status === "cashed-out"
                  const locked = !isActive

                  return (
                    <div
                      key={row}
                      className={cn(
                        "grid gap-3",
                        numCols === 3 && "grid-cols-3",
                        numCols === 4 && "grid-cols-4",
                        numCols === 5 && "grid-cols-5",
                        numCols >= 6 && "grid-cols-6",
                      )}
                      aria-label={`Row ${logicalRow + 1}`}
                    >
                      {Array.from({ length: numCols }).map((__, col) => {
                        const picked = rowCfg?.revealedIndex === col
                        const isSafe = rowCfg?.safeIndices?.includes(col) === true
                        const shouldReveal =
                          isPast || (rowCfg && typeof rowCfg.revealedIndex === "number" && (picked || status !== "in-progress"))

                        const showPaaji = shouldReveal && isSafe
                        const showBomb = shouldReveal && !isSafe

                        return (
                          <button
                            key={col}
                            disabled={locked}
                            onClick={() => pickTile(logicalRow, col)}
                            className={cn(
                              "relative aspect-[2.1/1] w-full overflow-hidden rounded-xl border",
                              "border-border bg-background/60",
                            )}
                            aria-label={isActive ? `Pick tile ${col + 1} in row ${logicalRow + 1}` : `Tile ${col + 1}`}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              {showPaaji && (
                                <img
                                  src="/happypaaji.png"
                                  alt="Paaji"
                                  className="h-full w-full object-contain drop-shadow scale-110 sm:scale-125"
                                  crossOrigin="anonymous"
                                />
                              )}
                              {showBomb && (
                                <div className="size-10 rounded-full bg-destructive" aria-hidden title="Bomb" />
                              )}
                              {!showPaaji && !showBomb && (
                                <div className="h-full w-full opacity-[0.08]" />
                              )}
                            </div>
                            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-border/40" />
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
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
                {popup.type === "lose" ? (
                  <>
                    <div className="w-32 h-32 mb-6 animate-bounce flex items-center justify-center mx-auto">
                      <img src="/Bomb.svg" alt="Bomb" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-full h-64 bg-destructive/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img src="/sad-monkey.gif" alt="Loss" className="w-full h-full object-cover rounded-2xl opacity-80" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-wide uppercase text-destructive">BOOM! You Lost</h2>
                    <p className="text-foreground/70 text-base">Tough luck! Try a different path and go again.</p>
                  </>
                ) : (
                  <>
                    <div className="w-32 h-32 mb-6 animate-pulse flex items-center justify-center mx-auto">
                      <img src="/Gems.svg" alt="Gem" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-full h-64 bg-primary/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img src="/nachoo.gif" alt="Win" className="w-full h-full object-contain rounded-2xl opacity-80" />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-wide uppercase text-primary">Congratulations!</h2>
                    <p className="text-foreground/70 text-base">{status === "won" ? `You reached the top at ${multiplier}x!` : `You cashed out at ${multiplier}x after ${steps} step${steps === 1 ? "" : "s"}.`}</p>
                  </>
                )}

                <Button onClick={closePopup} className="w-full h-12 rounded-2xl font-semibold">
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaajiOnTop

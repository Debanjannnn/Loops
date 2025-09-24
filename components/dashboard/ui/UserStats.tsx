"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ContractService } from "@/lib/contractService"
import { useWallet } from "@/contexts/WalletContext"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Gamepad2, 
  Trophy, 
  Target,
  Calendar,
  RefreshCw
} from "lucide-react"
import GameResolver from "@/components/games/GameResolver"

interface GameStats {
  gameType: string
  totalBets: number
  totalWon: number
  totalLost: number
  winRate: number
  avgMultiplier: number
  bestMultiplier: number
  totalGames: number
  gamesWon: number
}

interface UserStats {
  totalBet: string
  totalWon: string
  totalLost: string
  withdrawableBalance: string
  gamesPlayed: number
  gamesWon: number
  winRate: number
  favoriteGame: string
  joinDate: string
  lastPlayDate: string
  gameTypeStats: GameStats[]
}

interface ChartData {
  date: string
  profit: number
  bets: number
  multiplier: number
}

interface GameDistribution {
  name: string
  value: number
  color: string
  [key: string]: any // Add index signature for recharts compatibility
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function UserStats() {
  const { selector, accountId, isConnected, getBalance } = useWallet()
  console.log("accountId:", accountId)
  const [contractService, setContractService] = useState<ContractService | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [gameStats, setGameStats] = useState<GameStats[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [gameDistribution, setGameDistribution] = useState<GameDistribution[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [walletBalance, setWalletBalance] = useState<string>("0")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [isNetworkError, setIsNetworkError] = useState<boolean>(false)
  const [transactionHash, setTransactionHash] = useState<string>("")

  // Initialize contract service when wallet is connected
  useEffect(() => {
    console.log("🔗 Wallet connection effect triggered")
    console.log("selector:", selector)
    console.log("accountId:", accountId)
    
    if (selector && accountId) {
      const account = selector.store.getState().accounts[0]
      console.log("📱 Account from selector:", account)
      
      if (account) {
        const newContractService = new ContractService(selector, account)
        console.log("✅ ContractService created:", newContractService)
        setContractService(newContractService)
      } else {
        console.log("❌ No account found in selector")
      }
    } else {
      console.log("❌ Missing selector or accountId")
    }
  }, [selector, accountId])

  // Fetch wallet balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected && getBalance) {
        try {
          const balance = await getBalance()
          setWalletBalance(balance)
        } catch (error) {
          console.error("Error fetching balance:", error)
        }
      }
    }
    
    fetchBalance()
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [isConnected, getBalance])

  // Clear messages after a delay
  const clearMessages = () => {
    setErrorMessage("")
    setSuccessMessage("")
    setTransactionHash("")
  }

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(clearMessages, 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage, successMessage])

  // Fetch all data from contract - inspired by the betting interface
  const fetchAllContractData = async () => {
    if (!contractService || !accountId) {
      console.log("❌ Cannot fetch data - missing contractService or accountId")
      console.log("contractService:", contractService)
      console.log("accountId:", accountId)
      return
    }

    console.log("🔄 Fetching contract data for account:", accountId)
    
    try {
      // Fetch comprehensive user stats from contract
      console.log("📡 Calling contractService.getUserComprehensiveStats...")
      const comprehensiveStats = await contractService.getUserComprehensiveStats(accountId)
      console.log("📊 Raw comprehensive stats received:", comprehensiveStats)
      
      if (comprehensiveStats) {
        console.log("✅ Comprehensive stats found, processing data...")
        
        // Convert contract data to our format - handle both string and number formats
        const totalBetValue = typeof comprehensiveStats.totalBet === 'string' 
          ? comprehensiveStats.totalBet 
          : comprehensiveStats.totalBet.toString()
        const totalWonValue = typeof comprehensiveStats.totalWon === 'string' 
          ? comprehensiveStats.totalWon 
          : comprehensiveStats.totalWon.toString()
        const totalLostValue = typeof comprehensiveStats.totalLost === 'string' 
          ? comprehensiveStats.totalLost 
          : comprehensiveStats.totalLost.toString()
        const withdrawableValue = typeof comprehensiveStats.withdrawableBalance === 'string' 
          ? comprehensiveStats.withdrawableBalance 
          : comprehensiveStats.withdrawableBalance.toString()
        
        const realUserStats: UserStats = {
          totalBet: (parseFloat(totalBetValue) / 1e24).toFixed(2), // Convert from yoctoNEAR
          totalWon: (parseFloat(totalWonValue) / 1e24).toFixed(2),
          totalLost: (parseFloat(totalLostValue) / 1e24).toFixed(2),
          withdrawableBalance: (parseFloat(withdrawableValue) / 1e24).toFixed(2),
          gamesPlayed: comprehensiveStats.gamesPlayed || 0,
          gamesWon: comprehensiveStats.gamesWon || 0,
          winRate: comprehensiveStats.winRate || 0,
          favoriteGame: comprehensiveStats.favoriteGame || "N/A",
          joinDate: comprehensiveStats.joinDate ? new Date(Number(comprehensiveStats.joinDate) * 1000).toISOString() : "N/A",
          lastPlayDate: comprehensiveStats.lastPlayDate ? new Date(Number(comprehensiveStats.lastPlayDate) * 1000).toISOString() : "N/A",
          gameTypeStats: comprehensiveStats.gameTypeStats || []
        }
        
        console.log("🎯 Processed user stats:", realUserStats)
        setUserStats(realUserStats)

        // Process game type stats for charts and tables
        const processedGameStats: GameStats[] = comprehensiveStats.gameTypeStats?.map((gameTypeStat: any) => ({
          gameType: gameTypeStat.gameType,
          totalBets: parseFloat(gameTypeStat.totalBets.toString()) / 1e24,
          totalWon: parseFloat(gameTypeStat.totalWon.toString()) / 1e24,
          totalLost: parseFloat(gameTypeStat.totalLost.toString()) / 1e24,
          winRate: gameTypeStat.gamesPlayed > 0 ? (gameTypeStat.gamesWon / gameTypeStat.gamesPlayed) * 100 : 0,
          avgMultiplier: gameTypeStat.gamesPlayed > 0 ? gameTypeStat.totalMultiplier / gameTypeStat.gamesPlayed : 0,
          bestMultiplier: gameTypeStat.bestMultiplier || 0,
          totalGames: gameTypeStat.gamesPlayed || 0,
          gamesWon: gameTypeStat.gamesWon || 0
        })) || []

        console.log("🎮 Processed game stats:", processedGameStats)
        setGameStats(processedGameStats)

        // Create game distribution data for pie chart
        const gameDistributionData: GameDistribution[] = processedGameStats.map((game, index) => ({
          name: game.gameType,
          value: game.totalGames,
          color: COLORS[index % COLORS.length]
        }))

        console.log("📊 Game distribution data:", gameDistributionData)
        setGameDistribution(gameDistributionData)

        // For now, we'll show empty chart data since we don't have historical data
        // In a real implementation, you'd want to add methods to track game history by date
        console.log("📈 Setting empty chart data (no historical data in contract)")
        setChartData([])
        
      } else {
        console.log("❌ No comprehensive stats found for user - setting default values")
        // No stats found, use default values
        const defaultStats: UserStats = {
          totalBet: "0.00",
          totalWon: "0.00",
          totalLost: "0.00",
          withdrawableBalance: "0.00",
          gamesPlayed: 0,
          gamesWon: 0,
          winRate: 0,
          favoriteGame: "N/A",
          joinDate: "N/A",
          lastPlayDate: "N/A",
          gameTypeStats: []
        }
        console.log("🔧 Setting default stats:", defaultStats)
        setUserStats(defaultStats)
        setGameStats([])
        setChartData([])
        setGameDistribution([])
      }
      
    } catch (error: any) {
      console.error("❌ Error fetching contract data:", error)
      console.error("Error details:", error)
      
      // Check if it's a network error
      if (error.message?.includes('All RPC endpoints failed') || 
          error.message?.includes('Network error') ||
          error.message?.includes('Failed to fetch')) {
        setIsNetworkError(true)
        setErrorMessage("Network connection issue. Please check your internet connection and try again.")
      } else if (error.message?.includes("Contract method is not found")) {
        console.log("🔧 Contract method not found - setting default values")
        setIsNetworkError(false)
        setErrorMessage("Contract not properly deployed. Please contact support.")
      } else {
        setIsNetworkError(false)
        setErrorMessage("Failed to fetch user statistics")
      }
      
      // Set empty data on error
      const errorStats: UserStats = {
        totalBet: "0.00",
        totalWon: "0.00",
        totalLost: "0.00",
        withdrawableBalance: "0.00",
        gamesPlayed: 0,
        gamesWon: 0,
        winRate: 0,
        favoriteGame: "N/A",
        joinDate: "N/A",
        lastPlayDate: "N/A",
        gameTypeStats: []
      }
      console.log("🔧 Setting error fallback stats:", errorStats)
      setUserStats(errorStats)
      setGameStats([])
      setChartData([])
      setGameDistribution([])
    }
  }

  const fetchUserStats = async () => {
    console.log("🚀 fetchUserStats called")
    console.log("contractService:", contractService)
    console.log("accountId:", accountId)
    
    if (!contractService || !accountId) {
      console.log("❌ Cannot fetch stats - missing contractService or accountId")
      return
    }

    console.log("✅ Starting to fetch user stats...")
    setIsLoading(true)
    clearMessages() // Clear any existing messages
    
    try {
      await fetchAllContractData()
      console.log("✅ fetchAllContractData completed successfully")
    } catch (error: any) {
      console.error("❌ Error in fetchUserStats:", error)
      
      // Handle specific error cases like in the betting interface
      // @ts-ignore - best effort error message
      if (error.message?.includes("Contract method is not found")) {
        console.log("🔧 Contract method not found - setting default values")
        setErrorMessage("Contract not properly deployed. Please contact support.")
        
        // Set default values when contract method is not found
        const defaultStats: UserStats = {
          totalBet: "0.00",
          totalWon: "0.00",
          totalLost: "0.00",
          withdrawableBalance: "0.00",
          gamesPlayed: 0,
          gamesWon: 0,
          winRate: 0,
          favoriteGame: "N/A",
          joinDate: "N/A",
          lastPlayDate: "N/A",
          gameTypeStats: []
        }
        setUserStats(defaultStats)
        setGameStats([])
        setChartData([])
        setGameDistribution([])
      } else {
        setErrorMessage("Failed to fetch user statistics")
      }
    } finally {
      setIsLoading(false)
      console.log("🏁 fetchUserStats completed")
    }
  }

  useEffect(() => {
    console.log("🔄 Stats fetch effect triggered")
    console.log("isConnected:", isConnected)
    console.log("contractService:", contractService)
    
    if (isConnected) {
      console.log("✅ Wallet is connected, fetching user stats...")
      fetchUserStats()
    } else {
      console.log("❌ Wallet not connected, skipping stats fetch")
    }
  }, [isConnected, contractService])

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleWithdraw = async () => {
    if (!contractService || !userStats) {
      setErrorMessage("Please connect your wallet first")
      return
    }

    const withdrawableAmount = parseFloat(userStats.withdrawableBalance)
    if (withdrawableAmount <= 0) {
      setErrorMessage("No winnings to withdraw")
      return
    }

    setIsLoading(true)
    clearMessages() // Clear any existing messages
    
    try {
      console.log("💰 Starting withdrawal process...")
      const hash = await contractService.withdraw()
      console.log("✅ Withdrawal transaction successful:", hash)
      
      setSuccessMessage(`Withdrawal successful! ${formatCurrency(withdrawableAmount.toString())} has been sent to your wallet.`)
      setTransactionHash(hash)
      
      // Refresh stats after successful withdrawal - similar to betting interface
      setTimeout(async () => {
        console.log("🔄 Refreshing stats after withdrawal...")
        await fetchUserStats()
        // Also refresh wallet balance
        if (getBalance) {
          try {
            const balance = await getBalance()
            setWalletBalance(balance)
            console.log("✅ Wallet balance refreshed:", balance)
          } catch (error) {
            console.error("❌ Error refreshing wallet balance:", error)
          }
        }
      }, 3000) // Wait a bit longer for the transaction to be processed
    } catch (error: any) {
      console.error("❌ Error withdrawing:", error)
      let errorMsg = "Error withdrawing winnings. Please try again."
      
      // Handle specific error cases like in the betting interface
      // @ts-ignore - best effort error message
      if (error.message?.includes("Nothing to withdraw")) {
        errorMsg = "No winnings available to withdraw"
      } else if (error.message?.includes("User closed the window")) {
        errorMsg = "Transaction cancelled. Please try again when ready."
      } else if (error.message?.includes("insufficient balance")) {
        errorMsg = "Insufficient contract balance for withdrawal"
      } else if (error.message?.includes("Contract method is not found")) {
        errorMsg = "Contract not properly deployed. Please contact support."
      } else if (// @ts-ignore
        error.message) {
        errorMsg = error.message
      }
      
      setErrorMessage(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-8xl mb-6">📊</div>
        <h2 className="text-white text-4xl font-bold mb-4">User Statistics</h2>
        <p className="text-white/70 text-xl mb-8 max-w-2xl">
          Connect your wallet to view your gaming statistics and performance analytics
        </p>
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-lg">
          <p className="text-white/80 text-sm">
            🔗 Please connect your wallet to access your personal statistics dashboard
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl w-full pt-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Statistics</h1>
          <p className="text-white/70">Track your gaming performance and earnings from the blockchain</p>
        </div>
        <Button 
          onClick={fetchUserStats} 
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Wallet Status */}
      <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-400 text-sm font-medium">💰 Wallet Connected</p>
            <p className="text-green-300 text-xs">Balance: {walletBalance} NEAR</p>
          </div>
          <div className="text-right">
            <p className="text-green-400 text-sm font-medium">Account</p>
            <p className="text-green-300 text-xs">{accountId?.slice(0, 12)}...</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className={`${isNetworkError ? 'bg-yellow-600/20 border-yellow-500/30' : 'bg-red-600/20 border-red-500/30'} border rounded-2xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {isNetworkError ? '🌐' : '⚠️'}
            </div>
            <div>
              <p className={`${isNetworkError ? 'text-yellow-400' : 'text-red-400'} text-sm font-medium`}>
                {errorMessage}
              </p>
              {isNetworkError && (
                <p className="text-yellow-300 text-xs mt-1">
                  The app will automatically retry when the connection is restored.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-4">
          <p className="text-green-400 text-sm font-medium">
            ✅ {successMessage}
          </p>
        </div>
      )}

      {/* Transaction Hash */}
      {transactionHash && (
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4">
          <p className="text-blue-400 text-xs font-medium">
            🔗 TX: {transactionHash.slice(0, 12)}...
          </p>
          <a 
            href={`https://explorer.testnet.near.org/transactions/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 hover:text-blue-200 text-xs underline"
          >
            View on Explorer
          </a>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Bet</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(userStats?.totalBet || "0")}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Won</p>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(userStats?.totalWon || "0")}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold text-white">{userStats?.winRate || 0}%</p>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Games Played</p>
              <p className="text-2xl font-bold text-white">{userStats?.gamesPlayed || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {userStats?.gamesWon || 0} wins
              </p>
            </div>
            <Gamepad2 className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Chart */}
        <Card className="bg-background/60 border-border p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Profit/Loss</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Profit/Loss']}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-center">
              <div>
                <div className="text-4xl mb-2">📊</div>
                <p className="text-white/60 text-sm">No historical data available</p>
                <p className="text-white/40 text-xs">Play some games to see your performance charts</p>
              </div>
            </div>
          )}
        </Card>

        {/* Game Distribution */}
        <Card className="bg-background/60 border-border p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Game Distribution</h3>
          {gameDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gameDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gameDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  // @ts-ignore - recharts typing
                  formatter={(value: number) => [`${value}%`, 'Games']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-center">
              <div>
                <div className="text-4xl mb-2">🎮</div>
                <p className="text-white/60 text-sm">No game data available</p>
                <p className="text-white/40 text-xs">Play different games to see distribution</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Game Performance Table */}
      <Card className="bg-background/60 border-border p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Game Performance</h3>
        {gameStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Game</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Games Played</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Win Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total Won</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Best Multiplier</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Avg Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {gameStats.map((game, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-3 px-4 text-white font-medium">{game.gameType}</td>
                    <td className="py-3 px-4 text-white">{game.totalGames}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        game.winRate >= 60 ? 'bg-green-500/20 text-green-400' : 
                        game.winRate >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {game.winRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-green-400 font-medium">{formatCurrency(game.totalWon.toString())}</td>
                    <td className="py-3 px-4 text-white">{game.bestMultiplier.toFixed(2)}×</td>
                    <td className="py-3 px-4 text-white">{game.avgMultiplier.toFixed(2)}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-center">
            <div>
              <div className="text-4xl mb-2">📈</div>
              <p className="text-white/60 text-sm">No game performance data available</p>
              <p className="text-white/40 text-xs">Play games to see your performance statistics</p>
            </div>
          </div>
        )}
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Withdrawable Balance</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(userStats?.withdrawableBalance || "0")}</p>
              {userStats && parseFloat(userStats.withdrawableBalance) > 0 ? (
                <div className="mt-2">
                  <Button 
                    onClick={handleWithdraw}
                    disabled={isLoading}
                    className="h-8 text-xs bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Withdrawing...
                      </>
                    ) : (
                      "💰 Withdraw"
                    )}
                  </Button>
                  <p className="text-xs text-yellow-400/70 mt-1">Click to withdraw to your wallet</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">No winnings to withdraw</p>
              )}
            </div>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Favorite Game</p>
              <p className="text-2xl font-bold text-white">{userStats?.favoriteGame || "N/A"}</p>
            </div>
            <Gamepad2 className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-lg font-bold text-white">{userStats?.joinDate ? formatDate(userStats.joinDate) : "N/A"}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Last Played</p>
              <p className="text-lg font-bold text-white">{userStats?.lastPlayDate ? formatDate(userStats.lastPlayDate) : "N/A"}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Withdrawal Information */}
      <Card className="bg-background/60 border-border p-6">
        <h3 className="text-lg font-semibold text-white mb-4">💰 Withdraw Your Winnings</h3>
        <p className="text-white/70 text-sm mb-4">
          All your winnings are automatically processed by our resolver system. Use the withdraw button above to transfer your winnings to your wallet.
        </p>
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4">
          <h4 className="text-blue-400 font-medium mb-2">How it works:</h4>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• Play games and win - your winnings are tracked on-chain</li>
            <li>• Our automated resolver processes all game outcomes</li>
            <li>• Withdraw your accumulated winnings anytime</li>
            <li>• All transactions are secure and transparent</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

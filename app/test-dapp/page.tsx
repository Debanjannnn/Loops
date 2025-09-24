"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ContractService } from "@/lib/contractService"
import { ResolverService } from "@/lib/resolverService"
import { useWallet } from "@/contexts/WalletContext"
import { useNotifications } from "@/components/ui/notification"
import { 
  Play, 
  Trophy, 
  Settings, 
  Users, 
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react"

export default function TestDAppPage() {
  const { selector, accountId, isConnected, getBalance } = useWallet()
  const { addNotification } = useNotifications()
  const [contractService, setContractService] = useState<ContractService | null>(null)
  const [resolverService, setResolverService] = useState<ResolverService | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>({})
  const [walletBalance, setWalletBalance] = useState<string>("0")

  // Initialize services when wallet is connected
  useEffect(() => {
    if (selector && accountId) {
      const account = selector.store.getState().accounts[0]
      if (account) {
        const newContractService = new ContractService(selector, account)
        const newResolverService = new ResolverService(selector, account)
        setContractService(newContractService)
        setResolverService(newResolverService)
      }
    }
  }, [selector, accountId])

  // Fetch wallet balance
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
  }, [isConnected, getBalance])

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setIsLoading(true)
    try {
      const result = await testFunction()
      setTestResults(prev => ({ ...prev, [testName]: { status: "success", result } }))
      addNotification("success", `✅ ${testName}`, `Test passed successfully`)
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [testName]: { status: "error", error: error.message } }))
      addNotification("error", `❌ ${testName}`, `Test failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testContractStats = () => runTest("Contract Stats", async () => {
    if (!contractService) throw new Error("Contract service not available")
    return await contractService.getContractStats()
  })

  const testUserStats = () => runTest("User Stats", async () => {
    if (!contractService || !accountId) throw new Error("Contract service or account not available")
    return await contractService.getUserComprehensiveStats(accountId)
  })

  const testResolverAccount = () => runTest("Resolver Account", async () => {
    if (!contractService) throw new Error("Contract service not available")
    return await contractService.getOracleAccount()
  })

  const testStartGame = () => runTest("Start Game", async () => {
    if (!contractService) throw new Error("Contract service not available")
    const gameId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return await contractService.startGame(gameId, "0.01", "test")
  })

  const testGameDetails = () => runTest("Game Details", async () => {
    if (!contractService) throw new Error("Contract service not available")
    // Try to get details for a non-existent game
    return await contractService.getGameDetails("non-existent-game")
  })

  const testWithdraw = () => runTest("Withdraw", async () => {
    if (!contractService) throw new Error("Contract service not available")
    return await contractService.withdraw()
  })

  const runAllTests = async () => {
    const tests = [
      { name: "Contract Stats", fn: testContractStats },
      { name: "User Stats", fn: testUserStats },
      { name: "Resolver Account", fn: testResolverAccount },
      { name: "Start Game", fn: testStartGame },
      { name: "Game Details", fn: testGameDetails },
      // { name: "Withdraw", fn: testWithdraw }, // Skip withdraw test as it might fail if no balance
    ]

    for (const test of tests) {
      await runTest(test.name, test.fn)
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const getTestStatusIcon = (testName: string) => {
    const result = testResults[testName]
    if (!result) return <RefreshCw className="w-4 h-4 text-gray-400" />
    if (result.status === "success") return <CheckCircle className="w-4 h-4 text-green-400" />
    if (result.status === "error") return <XCircle className="w-4 h-4 text-red-400" />
    return <RefreshCw className="w-4 h-4 text-gray-400" />
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">🧪</div>
          <h2 className="text-white text-4xl font-bold mb-4">dApp Test Suite</h2>
          <p className="text-white/70 text-xl mb-8">Please connect your wallet to run tests</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">dApp Test Suite</h1>
            <p className="text-white/70">Comprehensive testing of all contract functions</p>
          </div>
          <Button 
            onClick={runAllTests} 
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="w-4 h-4 mr-2" />
            Run All Tests
          </Button>
        </div>

        {/* Connection Status */}
        <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">🔗 Wallet Connected</p>
              <p className="text-green-300 text-xs">Account: {accountId}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 text-sm font-medium">Balance</p>
              <p className="text-green-300 text-xs">{walletBalance} NEAR</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Contract Stats Test */}
          <Card className="bg-background/60 border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Contract Stats</h3>
              </div>
              {getTestStatusIcon("Contract Stats")}
            </div>
            <p className="text-white/70 text-sm mb-4">Test contract statistics retrieval</p>
            <Button 
              onClick={testContractStats} 
              disabled={isLoading}
              className="w-full"
            >
              Test Contract Stats
            </Button>
            {testResults["Contract Stats"] && (
              <div className="mt-4 p-3 bg-background/40 rounded-lg">
                <pre className="text-xs text-white/80 overflow-auto">
                  {JSON.stringify(testResults["Contract Stats"].result, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          {/* User Stats Test */}
          <Card className="bg-background/60 border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-semibold text-white">User Stats</h3>
              </div>
              {getTestStatusIcon("User Stats")}
            </div>
            <p className="text-white/70 text-sm mb-4">Test user statistics retrieval</p>
            <Button 
              onClick={testUserStats} 
              disabled={isLoading}
              className="w-full"
            >
              Test User Stats
            </Button>
            {testResults["User Stats"] && (
              <div className="mt-4 p-3 bg-background/40 rounded-lg">
                <pre className="text-xs text-white/80 overflow-auto">
                  {JSON.stringify(testResults["User Stats"].result, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          {/* Resolver Account Test */}
          <Card className="bg-background/60 border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-purple-500" />
                <h3 className="text-lg font-semibold text-white">Resolver Account</h3>
              </div>
              {getTestStatusIcon("Resolver Account")}
            </div>
            <p className="text-white/70 text-sm mb-4">Test resolver account retrieval</p>
            <Button 
              onClick={testResolverAccount} 
              disabled={isLoading}
              className="w-full"
            >
              Test Resolver
            </Button>
            {testResults["Resolver Account"] && (
              <div className="mt-4 p-3 bg-background/40 rounded-lg">
                <p className="text-white/80 text-sm">
                  {testResults["Resolver Account"].result}
                </p>
              </div>
            )}
          </Card>

          {/* Start Game Test */}
          <Card className="bg-background/60 border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Play className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-white">Start Game</h3>
              </div>
              {getTestStatusIcon("Start Game")}
            </div>
            <p className="text-white/70 text-sm mb-4">Test starting a new game</p>
            <Button 
              onClick={testStartGame} 
              disabled={isLoading}
              className="w-full"
            >
              Test Start Game
            </Button>
            {testResults["Start Game"] && (
              <div className="mt-4 p-3 bg-background/40 rounded-lg">
                <p className="text-white/80 text-sm">
                  Transaction: {testResults["Start Game"].result?.slice(0, 12)}...
                </p>
              </div>
            )}
          </Card>

          {/* Game Details Test */}
          <Card className="bg-background/60 border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h3 className="text-lg font-semibold text-white">Game Details</h3>
              </div>
              {getTestStatusIcon("Game Details")}
            </div>
            <p className="text-white/70 text-sm mb-4">Test game details retrieval</p>
            <Button 
              onClick={testGameDetails} 
              disabled={isLoading}
              className="w-full"
            >
              Test Game Details
            </Button>
            {testResults["Game Details"] && (
              <div className="mt-4 p-3 bg-background/40 rounded-lg">
                <p className="text-white/80 text-sm">
                  {testResults["Game Details"].result === null ? "Game not found (expected)" : "Unexpected result"}
                </p>
              </div>
            )}
          </Card>

          {/* Test Summary */}
          <Card className="bg-background/60 border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-6 w-6 text-green-500" />
              <h3 className="text-lg font-semibold text-white">Test Summary</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(testResults).map(([testName, result]) => (
                <div key={testName} className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">{testName}</span>
                  {result.status === "success" ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              ))}
            </div>
            {Object.keys(testResults).length === 0 && (
              <p className="text-white/60 text-sm">No tests run yet</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

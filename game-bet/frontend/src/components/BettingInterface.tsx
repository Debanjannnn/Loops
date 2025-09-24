"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "../contexts/WalletContext";
import { formatNEAR, parseNEAR, CONTRACT_METHODS } from "../lib/near-config";

interface UserStats {
  totalBet: string;
  totalWon: string;
  totalLost: string;
  withdrawableBalance: string;
}

interface GameOption {
  id: string;
  name: string;
  description: string;
  winChance: number;
  multiplier: number;
  color: string;
}

const BettingInterface: React.FC = () => {
  const { accountId, isConnected, signAndSendTransaction, viewMethod, refreshBalance } = useWallet();
  const [betAmount, setBetAmount] = useState("1");
  const [selectedGame, setSelectedGame] = useState<string>("simple_bet");
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [contractBalance, setContractBalance] = useState<string>("0");
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastBetResult, setLastBetResult] = useState<{ won: boolean; amount: string; game: string } | null>(null);

  // Game options matching the contract's flexibility
  const gameOptions: GameOption[] = [
    {
      id: "simple_bet",
      name: "Simple Bet",
      description: "Classic 50/50 chance",
      winChance: 0.5,
      multiplier: 2,
      color: "blue"
    },
    {
      id: "high_risk",
      name: "High Risk",
      description: "Low chance, high reward",
      winChance: 0.2,
      multiplier: 5,
      color: "red"
    },
    {
      id: "safe_bet",
      name: "Safe Bet",
      description: "High chance, low reward",
      winChance: 0.8,
      multiplier: 1.25,
      color: "green"
    },
    {
      id: "mines",
      name: "Mines",
      description: "Minefield game simulation",
      winChance: 0.3,
      multiplier: 3.33,
      color: "purple"
    },
    {
      id: "crash",
      name: "Crash",
      description: "Crash game simulation",
      winChance: 0.4,
      multiplier: 2.5,
      color: "orange"
    }
  ];

  // Load user stats and contract balance
  const loadUserStats = useCallback(async () => {
    if (!isConnected || !accountId) return;

    try {
      const [stats, balance, users] = await Promise.all([
        viewMethod(CONTRACT_METHODS.get_user_stats, { accountId }),
        viewMethod(CONTRACT_METHODS.get_contract_total_losses),
        viewMethod(CONTRACT_METHODS.get_total_users)
      ]);
      setUserStats(stats as UserStats);
      setContractBalance(balance as string);
      setTotalUsers((users as number) || 0);
    } catch (error: unknown) {
      console.error("Failed to load user stats:", error);
      // If contract method not found, set default values
      if (error instanceof Error && error.message?.includes("Contract method is not found")) {
        setUserStats({ totalBet: "0", totalWon: "0", totalLost: "0", withdrawableBalance: "0" });
        setContractBalance("0");
        setTotalUsers(0);
      }
    }
  }, [isConnected, accountId, viewMethod]);

  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

  const handleBet = async () => {
    if (!isConnected) {
      setMessage({ type: "error", text: "Please connect your wallet first" });
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      setMessage({ type: "error", text: "Please enter a valid bet amount" });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setLastBetResult(null);

    try {
      const deposit = parseNEAR(betAmount);
      const selectedGameOption = gameOptions.find(game => game.id === selectedGame);
      
      if (!selectedGameOption) {
        setMessage({ type: "error", text: "Please select a valid game" });
        return;
      }
      
      // Game logic based on selected game
      const randomValue = Math.random();
      const didWin = randomValue < selectedGameOption.winChance;
      const winMultiplier = selectedGameOption.multiplier;
      
      // Call the place_bet method with game result
      await signAndSendTransaction(CONTRACT_METHODS.place_bet, {
        gameId: selectedGame,
        didWin: didWin,
        winMultiplier: winMultiplier
      }, deposit);
      
      // Refresh stats to get updated values
      await loadUserStats();
      await refreshBalance();
      
      // Show result based on game outcome
      if (didWin) {
        const winAmount = parseFloat(betAmount) * winMultiplier;
        setLastBetResult({ won: true, amount: winAmount.toFixed(4), game: selectedGameOption.name });
        setMessage({ type: "success", text: `🎉 You WON ${selectedGameOption.name}! Gained ${winAmount.toFixed(4)} NEAR!` });
      } else {
        setLastBetResult({ won: false, amount: betAmount, game: selectedGameOption.name });
        setMessage({ type: "error", text: `😞 You LOST ${selectedGameOption.name}! Lost ${betAmount} NEAR!` });
      }
    } catch (error: unknown) {
      console.error("Bet failed:", error);
      let errorMessage = "Failed to place bet. Please try again.";
      
      if (error instanceof Error) {
        if (error.message?.includes("Contract method is not found")) {
          errorMessage = "Contract not properly deployed. Please contact support.";
        } else if (error.message?.includes("Cannot convert")) {
          errorMessage = "Invalid bet amount. Please try a smaller amount.";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      setMessage({ 
        type: "error", 
        text: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected) {
      setMessage({ type: "error", text: "Please connect your wallet first" });
      return;
    }

    if (!userStats || userStats.withdrawableBalance === "0") {
      setMessage({ type: "error", text: "No winnings to withdraw" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await signAndSendTransaction(CONTRACT_METHODS.withdraw);
      setMessage({ type: "success", text: "Successfully withdrew winnings!" });
      await loadUserStats(); // Refresh stats
      await refreshBalance(); // Refresh wallet balance
    } catch (error: unknown) {
      console.error("Withdraw failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to withdraw. Please try again.";
      setMessage({ 
        type: "error", 
        text: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🎲 NEAR Betting Game</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to start betting and winning!
          </p>
          <div className="text-sm text-gray-500">
            <p>• Place bets with NEAR tokens</p>
            <p>• 50% chance to win 2x your bet</p>
            <p>• Withdraw your winnings anytime</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🎲 NEAR Betting Game
        </h1>

        {/* User Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Bet</p>
              <p className="text-2xl font-bold text-blue-600">
                {userStats ? formatNEAR(userStats.totalBet) : "0"} NEAR
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Won</p>
              <p className="text-2xl font-bold text-green-600">
                {userStats ? formatNEAR(userStats.totalWon) : "0"} NEAR
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Lost</p>
              <p className="text-2xl font-bold text-red-600">
                {userStats ? formatNEAR(userStats.totalLost) : "0"} NEAR
              </p>
            </div>
          </div>
        </div>

        {/* Contract Stats */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-8">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Contract Balance (Lost by Users)</p>
              <p className="text-xl font-bold text-gray-800">
                {formatNEAR(contractBalance)} NEAR
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Players</p>
              <p className="text-xl font-bold text-gray-800">
                {totalUsers}
              </p>
            </div>
          </div>
        </div>

        {/* Game Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Choose Your Game</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {gameOptions.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedGame === game.id
                    ? `border-${game.color}-500 bg-${game.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800">{game.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{game.description}</p>
                  <div className="text-xs text-gray-500">
                    <p>Win Chance: {(game.winChance * 100).toFixed(0)}%</p>
                    <p>Multiplier: {game.multiplier}x</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Betting Section */}
        <div className="space-y-6">
          <div>
            <label htmlFor="betAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Bet Amount (NEAR)
            </label>
            <input
              id="betAmount"
              type="number"
              step="0.1"
              min="0.1"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter bet amount"
            />
          </div>

          <button
            onClick={handleBet}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isLoading ? "Placing Bet..." : `Place Bet (${betAmount} NEAR)`}
          </button>

          <div className="text-center">
            {(() => {
              const selectedGameOption = gameOptions.find(game => game.id === selectedGame);
              if (!selectedGameOption) return null;
              return (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedGameOption.winChance * 100}% chance to win {selectedGameOption.multiplier}x your bet!
                  </p>
                  <p className="text-xs text-gray-500">
                    If you win: +{(parseFloat(betAmount || "0") * selectedGameOption.multiplier).toFixed(4)} NEAR | 
                    If you lose: -{betAmount || "0"} NEAR
                  </p>
                </>
              );
            })()}
          </div>
        </div>

        {/* Withdraw Section */}
        {userStats && userStats.withdrawableBalance !== "0" && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleWithdraw}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isLoading ? "Withdrawing..." : `Withdraw ${formatNEAR(userStats.withdrawableBalance)} NEAR`}
            </button>
          </div>
        )}

        {/* Last Bet Result - Prominent Display */}
        {lastBetResult && (
          <div className={`mt-8 p-8 rounded-xl text-center shadow-lg transform transition-all duration-500 ${
            lastBetResult.won 
              ? "bg-gradient-to-br from-green-100 to-green-200 text-green-900 border-4 border-green-400 animate-pulse" 
              : "bg-gradient-to-br from-red-100 to-red-200 text-red-900 border-4 border-red-400 animate-pulse"
          }`}>
            <div className="text-6xl mb-4 animate-bounce">
              {lastBetResult.won ? "🎉" : "💸"}
            </div>
            <div className="text-3xl font-black mb-2">
              {lastBetResult.won ? "CONGRATULATIONS!" : "BETTER LUCK NEXT TIME!"}
            </div>
            <div className="text-2xl font-bold mb-2">
              {lastBetResult.won ? "YOU WON!" : "YOU LOST!"}
            </div>
            <div className="text-lg font-semibold mb-2">
              {lastBetResult.game}
            </div>
            <div className="text-xl font-semibold">
              {lastBetResult.won ? `+${lastBetResult.amount} NEAR` : `-${lastBetResult.amount} NEAR`}
            </div>
            <div className="mt-4 text-sm opacity-75">
              {lastBetResult.won 
                ? "Your winnings have been added to your account!" 
                : "The amount has been added to the contract balance."}
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg ${
            message.type === "success" 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-red-100 text-red-800 border border-red-200"
          }`}>
            {message.text}
          </div>
        )}

        {/* Game Rules */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">🎮 Game Rules</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Minimum bet: 0.1 NEAR</li>
            <li>• Choose from different games with varying risk/reward ratios</li>
            <li>• Each game has different win chances and multipliers</li>
            <li>• Lost amounts are permanently stored on the contract</li>
            <li>• You can only withdraw your winnings, not losses</li>
            <li>• All transactions are on NEAR testnet</li>
            <li>• Game results are determined client-side for demo purposes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BettingInterface;

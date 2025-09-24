"use client";

import { WalletProvider } from "../contexts/WalletContext";
import WalletConnection from "../components/WalletConnection";
import BettingInterface from "../components/BettingInterface";

export default function Home() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">🎲 NEAR Betting Game</h1>
              </div>
              <WalletConnection />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-8">
          <BettingInterface />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-600">
              <p className="text-sm">
                Built with Next.js and NEAR Protocol • 
                <a 
                  href="https://github.com/manovHacksaw/near-swap" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  Inspired by near-swap
                </a>
              </p>
              <p className="text-xs mt-2 text-gray-500">
                Contract: game-program.testnet • Network: Testnet
              </p>
            </div>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}

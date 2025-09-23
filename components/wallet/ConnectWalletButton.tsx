"use client"

import React, { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, Copy, Check } from 'lucide-react'
import { ShimmerButton } from '@/components/magicui/shimmer-button'

interface ConnectWalletButtonProps {
  className?: string
}

export default function ConnectWalletButton({ className }: ConnectWalletButtonProps) {
  const { accountId, isConnected, isLoading, connect, disconnect, getBalance } = useWallet()
  const [balance, setBalance] = useState<string>('0')
  const [copied, setCopied] = useState(false)

  const handleConnect = async () => {
    if (isConnected) {
      await disconnect()
    } else {
      await connect()
    }
  }

  const handleCopyAddress = async () => {
    if (accountId) {
      await navigator.clipboard.writeText(accountId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const loadBalance = async () => {
    if (isConnected) {
      try {
        const walletBalance = await getBalance()
        setBalance(walletBalance)
      } catch (error) {
        console.error('Failed to load balance:', error)
        setBalance('0.0000')
      }
    }
  }

  // Load balance when connected
  useEffect(() => {
    if (isConnected) {
      // Add a small delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        loadBalance()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isConnected])

  if (isLoading) {
    return (
      <Button disabled className={className}>
        <Wallet className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    )
  }

  if (isConnected && accountId) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2">
            <span className="text-white/70 text-sm">Balance:</span>
            <span className="text-white font-medium">{balance} NEAR</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-white/50 text-xs font-mono">
              {accountId.length > 20 ? `${accountId.slice(0, 10)}...${accountId.slice(-10)}` : accountId}
            </span>
            <button
              onClick={handleCopyAddress}
              className="text-white/50 hover:text-white/70 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <Button
          onClick={handleConnect}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <ShimmerButton onClick={handleConnect} className={className}>
      <Wallet className="w-4 h-4" />
      <span>Connect Wallet</span>
    </ShimmerButton>
  )
}

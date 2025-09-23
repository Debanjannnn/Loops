"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { setupWalletSelector, WalletSelector } from '@near-wallet-selector/core'
import { setupModal } from '@near-wallet-selector/modal-ui'
import { setupNearWallet } from '@near-wallet-selector/near-wallet'
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'
import { setupSender } from '@near-wallet-selector/sender'
import { setupHereWallet } from '@near-wallet-selector/here-wallet'
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet'
import { setupNightly } from '@near-wallet-selector/nightly'
import { setupLedger } from '@near-wallet-selector/ledger'
import { CONTRACT_ID } from '@/near.config'

interface WalletContextType {
  selector: WalletSelector | null
  modal: any
  accountId: string | null
  isConnected: boolean
  isLoading: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  getBalance: () => Promise<string>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [selector, setSelector] = useState<WalletSelector | null>(null)
  const [modal, setModal] = useState<any>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeWallet()
  }, [])

  const initializeWallet = async () => {
    try {
      const walletSelector = await setupWalletSelector({
        network: 'testnet',
        modules: [
          setupNearWallet() as any,
          setupMyNearWallet() as any,
          setupSender() as any,
          setupHereWallet() as any,
          setupMeteorWallet() as any,
          setupNightly() as any,
          setupLedger() as any,
        ],
      })

      const walletModal = setupModal(walletSelector, {
        contractId: CONTRACT_ID,
      })

      setSelector(walletSelector)
      setModal(walletModal)

      // Check if user is already signed in
      const isSignedIn = walletSelector.isSignedIn()
      if (isSignedIn) {
        const account = walletSelector.store.getState().accounts[0]
        setAccountId(account?.accountId || null)
      }

      // Listen for account changes
      walletSelector.store.observable.subscribe((state) => {
        const account = state.accounts[0]
        setAccountId(account?.accountId || null)
      })
    } catch (error) {
      console.error('Failed to initialize wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const connect = async () => {
    if (!modal) return

    try {
      // Show the modal to let user select a wallet
      modal.show()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const disconnect = async () => {
    if (!selector) return

    try {
      const wallet = await selector.wallet()
      if (wallet) {
        await wallet.signOut()
      }
      setAccountId(null)
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  const getBalance = async (): Promise<string> => {
    if (!selector || !accountId) return '0'

    try {
      // Use the wallet selector's built-in balance fetching
      const wallet = await selector.wallet()
      if (!wallet) return '0'

      // Try to get balance from the wallet's accounts
      const accounts = await wallet.getAccounts()
      const account = accounts.find(acc => acc.accountId === accountId)
      
      if (account && (account as any).balance) {
        // Convert from yoctoNEAR to NEAR
        return (parseInt((account as any).balance) / 1e24).toFixed(4)
      }

      // If no balance in accounts, try using the selector's account state
      const state = selector.store.getState()
      const accountState = state.accounts.find(acc => acc.accountId === accountId)
      
      if (accountState && (accountState as any).balance) {
        return (parseInt((accountState as any).balance) / 1e24).toFixed(4)
      }

      // Fallback: Fetch balance directly from NEAR RPC
      try {
        const response = await fetch('https://rpc.testnet.near.org', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'dontcare',
            method: 'query',
            params: {
              request_type: 'view_account',
              finality: 'final',
              account_id: accountId,
            },
          }),
        })

        const data = await response.json()
        if (data.result && data.result.amount) {
          return (parseInt(data.result.amount) / 1e24).toFixed(4)
        }
      } catch (rpcError) {
        console.error('RPC balance fetch failed:', rpcError)
      }

      return '0.0000'
    } catch (error) {
      console.error('Failed to get balance:', error)
      return '0.0000'
    }
  }

  const value: WalletContextType = {
    selector,
    modal,
    accountId,
    isConnected: !!accountId,
    isLoading,
    connect,
    disconnect,
    getBalance,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
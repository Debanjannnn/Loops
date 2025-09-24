import { WalletSelector } from '@near-wallet-selector/core'
import { Account } from '@near-wallet-selector/core'
import { parseNEAR, CONTRACT_ID } from '@/near.config'

export class ContractService {
  private selector: WalletSelector
  private account: Account
  private contractId: string

  constructor(selector: WalletSelector, account: Account, contractId: string = CONTRACT_ID) {
    this.selector = selector
    this.account = account
    this.contractId = contractId
  }

  /**
   * Start a new game with a bet amount
   * @param gameId - Unique identifier for the game
   * @param betAmount - Amount to bet in NEAR (as string)
   * @returns Transaction hash
   */
  async startGame(gameId: string, betAmount: string): Promise<string> {
    try {
      const wallet = await this.selector.wallet()
      
      // Convert NEAR to yoctoNEAR using the existing utility
      const betInNEAR = parseFloat(betAmount)
      
      // Handle edge cases
      if (isNaN(betInNEAR) || betInNEAR < 0) {
        throw new Error("Invalid bet amount")
      }
      
      const yoctoNEAR = parseNEAR(betAmount)
      
      // Convert to BigInt and back to string to avoid scientific notation issues
      const depositBigInt = BigInt(yoctoNEAR)
      const depositString = depositBigInt.toString()
      
      const result = await wallet.signAndSendTransaction({
        signerId: this.account.accountId,
        receiverId: this.contractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'start_game',
              args: { gameId },
              gas: '300000000000000', // 300 TGas
              deposit: depositString,
            },
          },
        ],
      })

      return result.transaction.hash
    } catch (error: any) {
      console.error('Error starting game:', error)
      throw new Error(error.message || 'Failed to start game')
    }
  }

  /**
   * Resolve a game (user calls this directly when they win)
   * @param multiplier - Win multiplier
   * @returns Transaction hash
   */
  async resolveGame(multiplier: number = 1.0): Promise<string> {
    console.log('🎯 ContractService.resolveGame called')
    console.log('📊 Multiplier:', multiplier)
    console.log('📋 Contract ID:', this.contractId)
    console.log('👤 Account ID (from wallet):', this.account.accountId)
    
    try {
      const wallet = await this.selector.wallet()
      
      const transactionParams = {
        signerId: this.account.accountId,
        receiverId: this.contractId,
        actions: [
          {
            type: 'FunctionCall' as const,
            params: {
              methodName: 'resolve_game',
              args: { multiplier },
              gas: '300000000000000', // 300 TGas
              deposit: '0',
            },
          },
        ],
      }
      
      console.log('📡 Sending resolve_game transaction:', transactionParams)
      
      const result = await wallet.signAndSendTransaction(transactionParams)
      
      console.log('✅ resolve_game transaction successful:', result.transaction.hash)
      return result.transaction.hash
    } catch (error: any) {
      console.error('❌ Error resolving game:', error)
      console.error('Error details:', error)
      
      // Extract more detailed error information
      let errorMessage = 'Failed to resolve game'
      
      // @ts-ignore - best effort error type
      if (error.message) {
        // @ts-ignore - best effort error type
        errorMessage = error.message
      // @ts-ignore - best effort error type
      } else if (error.kind && error.kind.FunctionCallError) {
        // @ts-ignore - best effort error type
        const executionError = error.kind.FunctionCallError.ExecutionError
        if (executionError && executionError.includes('Only oracle can resolve games')) {
          errorMessage = 'Contract still has oracle restrictions. Please redeploy the contract with the latest version.'
        } else if (executionError) {
          errorMessage = `Contract error: ${executionError}`
        }
      }
      
      console.error('📋 Final error message:', errorMessage)
      
      // For oracle restriction errors, provide a more user-friendly message
      if (errorMessage.includes('oracle restrictions')) {
        throw new Error('Contract needs to be updated. Your game was completed successfully, but automatic resolution is not available yet.')
      }
      
      throw new Error(errorMessage)
    }
  }


  /**
   * Get user statistics - inspired by the betting interface approach
   * @param accountId - User account ID
   * @returns User stats object
   */
  async getUserStats(accountId: string): Promise<any> {
    console.log('🔍 ContractService.getUserStats called with accountId:', accountId)
    console.log('📋 Contract ID:', this.contractId)
    
    try {
      const requestBody = {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: this.contractId,
          method_name: 'get_user_stats',
          args_base64: Buffer.from(JSON.stringify({ accountId })).toString('base64'),
        },
      }
      
      console.log('📡 Making RPC request to NEAR:', requestBody)
      
      const response = await fetch('https://rpc.testnet.near.org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📨 RPC response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 RPC response data:', data)
      
      // Handle RPC errors
      if (data.error) {
        console.error('❌ RPC error:', data.error)
        if (data.error.message?.includes('Contract method is not found')) {
          throw new Error('Contract method is not found')
        }
        throw new Error(data.error.message || 'RPC error occurred')
      }
      
      if (data.result && data.result.result) {
        const decodedResult = JSON.parse(Buffer.from(data.result.result, 'base64').toString())
        console.log('✅ Decoded user stats:', decodedResult)
        return decodedResult
      }
      
      console.log('❌ No result in RPC response - user may not have stats yet')
      return null
    } catch (error: any) {
      console.error('❌ Error getting user stats:', error)
      console.error('Error details:', error)
      
      // Re-throw with more specific error messages
      // @ts-ignore - best effort error type
      if (error.message?.includes('Contract method is not found')) {
        throw new Error('Contract method is not found')
      // @ts-ignore - best effort error type
      } else if (error.message?.includes('HTTP error')) {
        throw new Error('Network error occurred while fetching user stats')
      } else {
        // @ts-ignore - best effort error type
        throw new Error(error.message || 'Failed to get user stats')
      }
    }
  }

  /**
   * Withdraw winnings
   * @returns Transaction hash
   */
  async withdraw(): Promise<string> {
    try {
      const wallet = await this.selector.wallet()
      
      const result = await wallet.signAndSendTransaction({
        signerId: this.account.accountId,
        receiverId: this.contractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'withdraw',
              args: {},
              gas: '300000000000000', // 300 TGas
              deposit: '0',
            },
          },
        ],
      })

      return result.transaction.hash
    } catch (error: any) {
      console.error('Error withdrawing:', error)
      // @ts-ignore - best effort error type
      throw new Error(error.message || 'Failed to withdraw')
    }
  }

  /**
   * Get contract total losses
   * @returns Total losses amount
   */
  async getContractTotalLosses(): Promise<string> {
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
            request_type: 'call_function',
            finality: 'final',
            account_id: this.contractId,
            method_name: 'get_contract_total_losses',
            args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
          },
        }),
      })

      const data = await response.json()
      if (data.result && data.result.result) {
        return Buffer.from(data.result.result, 'base64').toString()
      }
      return '0'
    } catch (error: any) {
      console.error('Error getting contract losses:', error)
      // @ts-ignore - best effort error type
      throw new Error(error.message || 'Failed to get contract losses')
    }
  }

  /**
   * Get total number of users
   * @returns Total users count
   */
  async getTotalUsers(): Promise<number> {
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
            request_type: 'call_function',
            finality: 'final',
            account_id: this.contractId,
            method_name: 'get_total_users',
            args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
          },
        }),
      })

      const data = await response.json()
      if (data.result && data.result.result) {
        return parseInt(Buffer.from(data.result.result, 'base64').toString())
      }
      return 0
    } catch (error: any) {
      console.error('Error getting total users:', error)
      // @ts-ignore - best effort error type
      throw new Error(error.message || 'Failed to get total users')
    }
  }

  /**
   * Check if user has pending bet
   * @param accountId - User account ID
   * @returns Boolean indicating if user has pending bet
   */
  async hasPendingBet(accountId: string): Promise<boolean> {
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
            request_type: 'call_function',
            finality: 'final',
            account_id: this.contractId,
            method_name: 'get_pending_bet',
            args_base64: Buffer.from(JSON.stringify({ accountId })).toString('base64'),
          },
        }),
      })

      const data = await response.json()
      if (data.result && data.result.result) {
        const result = JSON.parse(Buffer.from(data.result.result, 'base64').toString())
        return result !== null
      }
      return false
    } catch (error: any) {
      console.error('Error checking pending bet:', error)
      return false // Default to false if method doesn't exist
    }
  }

  /**
   * Get oracle account ID
   * @returns Oracle account ID
   */
  async getOracleAccount(): Promise<string> {
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
            request_type: 'call_function',
            finality: 'final',
            account_id: this.contractId,
            method_name: 'get_oracle_account',
            args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
          },
        }),
      })

      const data = await response.json()
      if (data.result && data.result.result) {
        return Buffer.from(data.result.result, 'base64').toString().replace(/"/g, '')
      }
      return 'oracle.testnet'
    } catch (error: any) {
      console.error('Error getting oracle account:', error)
      // @ts-ignore - best effort error type
      throw new Error(error.message || 'Failed to get oracle account')
    }
  }

  /**
   * Set oracle account (admin only)
   * @param oracleAccountId - New oracle account ID
   * @returns Transaction hash
   */
  async setOracleAccount(oracleAccountId: string): Promise<string> {
    try {
      const wallet = await this.selector.wallet()
      
      const result = await wallet.signAndSendTransaction({
        signerId: this.account.accountId,
        receiverId: this.contractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'set_oracle_account',
              args: { oracleAccountId },
              gas: '300000000000000', // 300 TGas
              deposit: '0',
            },
          },
        ],
      })

      return result.transaction.hash
    } catch (error: any) {
      console.error('Error setting oracle account:', error)
      // @ts-ignore - best effort error type
      throw new Error(error.message || 'Failed to set oracle account')
    }
  }
}
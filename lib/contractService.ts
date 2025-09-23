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
   * Resolve a game (typically called by oracle)
   * @param accountId - Account ID of the player
   * @param multiplier - Win multiplier
   * @returns Transaction hash
   */
  async resolveGame(accountId: string, multiplier: number = 1.0): Promise<string> {
    try {
      const wallet = await this.selector.wallet()
      
      const result = await wallet.signAndSendTransaction({
        signerId: this.account.accountId,
        receiverId: this.contractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'resolve_game',
              args: { accountId, multiplier },
              gas: '300000000000000', // 300 TGas
              deposit: '0',
            },
          },
        ],
      })

      return result.transaction.hash
    } catch (error: any) {
      console.error('Error resolving game:', error)
      throw new Error(error.message || 'Failed to resolve game')
    }
  }

  /**
   * Get user statistics
   * @param accountId - User account ID
   * @returns User stats object
   */
  async getUserStats(accountId: string): Promise<any> {
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
            method_name: 'get_user_stats',
            args_base64: Buffer.from(JSON.stringify({ accountId })).toString('base64'),
          },
        }),
      })

      const data = await response.json()
      if (data.result && data.result.result) {
        return JSON.parse(Buffer.from(data.result.result, 'base64').toString())
      }
      return null
    } catch (error: any) {
      console.error('Error getting user stats:', error)
      throw new Error(error.message || 'Failed to get user stats')
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
      throw new Error(error.message || 'Failed to set oracle account')
    }
  }
}
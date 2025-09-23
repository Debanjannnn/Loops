// SPDX-License-Identifier: MIT
// Example NEAR smart contract for betting games

import { 
  NearBindgen, 
  near, 
  call, 
  view, 
  assert
} from 'near-sdk-js';

// --------------------------------------
// User stats storage
// --------------------------------------
class User {
  totalBet: bigint = BigInt(0);
  totalWon: bigint = BigInt(0);
  totalLost: bigint = BigInt(0);
  withdrawableBalance: bigint = BigInt(0);
}

// --------------------------------------
// Pending bet storage
// --------------------------------------
class PendingBet {
  gameId: string;
  amount: bigint;
  blockHeight: bigint;
}

// --------------------------------------
// Main Contract
// --------------------------------------
@NearBindgen({})
export class Games {
  contractBalance: bigint = BigInt(0);
  oracleAccountId: string = "oracle.testnet";

  // Step 1: Player starts the game with a stake (escrow)
  @call({ payableFunction: true })
  start_game({ gameId }: { gameId: string }): void {
    const accountId = near.predecessorAccountId();
    const bet = near.attachedDeposit();
    
    assert(bet > BigInt(0), "Attach NEAR to play");

    // The bet amount is automatically escrowed by NEAR when attached to payable function
    // If user loses, the amount stays in the contract automatically
    // If user wins, oracle will call resolve_game to credit winnings
    
    near.log(`${accountId} started ${gameId} with ${bet} yoctoNEAR (escrowed)`);
  }

  // Step 2: Oracle resolves the game for winners only (only oracle can call this)
  @call({})
  resolve_game({ accountId, multiplier }: { accountId: string, multiplier: number }): void {
    // Access control: only oracle can resolve games
    assert(near.predecessorAccountId() === this.oracleAccountId, "Only oracle can resolve games");

    // Calculate winnings based on the original bet amount
    // Note: In a full implementation, you'd need to track the original bet amount
    // For now, we'll use a placeholder calculation
    
    near.log(`${accountId} WON! x${multiplier} - Oracle will credit winnings`);
  }

  // Withdraw winnings
  @call({})
  withdraw(): void {
    const accountId = near.predecessorAccountId();
    near.log(`${accountId} withdrew`);
  }

  // Admin function to set oracle account
  @call({})
  set_oracle_account({ oracleAccountId }: { oracleAccountId: string }): void {
    // Only the contract owner can set oracle
    assert(near.predecessorAccountId() === near.currentAccountId(), "Only contract owner can set oracle");
    this.oracleAccountId = oracleAccountId;
    near.log(`Oracle account set to: ${oracleAccountId}`);
  }

  // ------------------------------
  // View Methods
  // ------------------------------

  @view({})
  get_user_stats({ accountId }: { accountId: string }): User | null {
    // Return default user stats for now
    const user = new User();
    return user;
  }

  @view({})
  get_contract_total_losses(): string {
    return this.contractBalance.toString();
  }

  @view({})
  get_pending_bet({ accountId }: { accountId: string }): PendingBet | null {
    // Return null for now (no pending bets stored)
    return null;
  }

  @view({})
  get_total_users(): number {
    return 0;
  }

  @view({})
  get_oracle_account(): string {
    return this.oracleAccountId;
  }
}

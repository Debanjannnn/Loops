// SPDX-License-Identifier: MIT
// Simplified NEAR smart contract for betting games (user resolves wins)

import { 
  NearBindgen, 
  near, 
  call, 
  view, 
  assert, 
  UnorderedMap 
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
  users: UnorderedMap<User> = new UnorderedMap<User>('users');
  pendingBets: UnorderedMap<PendingBet> = new UnorderedMap<PendingBet>('pending');
  contractBalance: bigint = BigInt(0);

  private getUser(accountId: string): User {
    let user = this.users.get(accountId);
    if (user === null) {
      user = new User();
      this.users.set(accountId, user);
    }
    return user;
  }

  // Step 1: Player starts the game with a stake (escrow)
  @call({ payableFunction: true })
  start_game({ gameId }: { gameId: string }): void {
    const accountId = near.predecessorAccountId();
    const bet = near.attachedDeposit();
    
    assert(bet > BigInt(0), "Attach NEAR to play");
    assert(this.pendingBets.get(accountId) === null, "You already have a pending bet");

    const newBet = new PendingBet();
    newBet.gameId = gameId;
    newBet.amount = bet;
    newBet.blockHeight = near.blockHeight();

    this.pendingBets.set(accountId, newBet);

    near.log(`${accountId} started ${gameId} with ${bet} yoctoNEAR (escrowed)`);
  }

  // Step 2: Player resolves the game only if they win
  @call({})
  resolve_game({ multiplier }: { multiplier: number }): void {
    const accountId = near.predecessorAccountId();
    const pending = this.pendingBets.get(accountId);
    assert(pending !== null, "No pending bet found");

    let user = this.getUser(accountId);
    user.totalBet += pending.amount;

    // Calculate winnings
    const winnings = pending.amount * BigInt(Math.floor(multiplier * 100)) / BigInt(100);
    user.totalWon += winnings;
    user.withdrawableBalance += winnings;

    near.log(`${accountId} WON! Bet ${pending.amount}, multiplier x${multiplier}, credited ${winnings} yoctoNEAR`);

    // Remove bet & save user
    this.pendingBets.remove(accountId);
    this.users.set(accountId, user);
  }

  // Withdraw winnings
  @call({})
  withdraw(): void {
    const accountId = near.predecessorAccountId();
    let user = this.getUser(accountId);

    const amountToWithdraw = user.withdrawableBalance;
    assert(amountToWithdraw > BigInt(0), "Nothing to withdraw");

    // reset before transfer to prevent reentrancy
    user.withdrawableBalance = BigInt(0);
    this.users.set(accountId, user);

    const promiseId = near.promiseBatchCreate(accountId);
    near.promiseBatchActionTransfer(promiseId, amountToWithdraw);

    near.log(`${accountId} withdrew ${amountToWithdraw} yoctoNEAR`);
  }

  // ------------------------------
  // View Methods
  // ------------------------------
  @view({})
  get_user_stats({ accountId }: { accountId: string }): User | null {
    return this.users.get(accountId) || null;
  }

  @view({})
  get_pending_bet({ accountId }: { accountId: string }): PendingBet | null {
    return this.pendingBets.get(accountId) || null;
  }
}

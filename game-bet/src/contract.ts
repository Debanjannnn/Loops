import { NearBindgen, near, call, view, UnorderedMap } from 'near-sdk-js';

// Define a User class to store individual user's betting statistics
class User {
  // totalBet: total NEAR amount the user has bet across all games
  totalBet: bigint = BigInt(0);
  // totalWon: total NEAR amount the user has won
  totalWon: bigint = BigInt(0);
  // totalLost: total NEAR amount the user has lost
  totalLost: bigint = BigInt(0);
  // withdrawableBalance: NEAR amount available for the user to withdraw
  withdrawableBalance: bigint = BigInt(0);
}

@NearBindgen({})
export class BettingContract {
  // Use UnorderedMap for efficient storage of user data
  // Maps account IDs (string) to User objects
  users: UnorderedMap<User> = new UnorderedMap<User>('users_map');

  // contractBalance: Total amount of NEAR accumulated by the contract from user losses
  contractBalance: bigint = BigInt(0);

  // Helper function to get or create a user's data
  private getUser(accountId: string): User {
    let user = this.users.get(accountId);
    if (user === null) {
      user = new User();
      // Initialize the user in the map
      this.users.set(accountId, user);
    }
    return user;
  }

  // User places a bet for a specific game
  // @param gameId: Identifier for the game (e.g., "mines", "crash")
  // @param didWin: Boolean indicating if the user won (determined off-chain)
  // @param winMultiplier: The multiplier applied to the bet if the user wins (e.g., 2 for double, 1.5 for 1.5x)
  @call({ payableFunction: true })
  place_bet({ gameId, didWin, winMultiplier }: { gameId: string, didWin: boolean, winMultiplier: number }): void {
    const accountId = near.predecessorAccountId();
    const deposit = near.attachedDeposit();

    if (deposit === BigInt(0)) {
      near.log("Attached deposit must be greater than zero.");
      return;
    }

    near.log(`${accountId} placed a bet of ${deposit.toString()} yoctoNEAR on ${gameId}`);

    // Retrieve user data
    let user = this.getUser(accountId);
    user.totalBet += deposit;

    // Process game result based on off-chain game logic
    if (didWin) {
      const winningsAmount = deposit * BigInt(Math.floor(winMultiplier * 100)) / BigInt(100);
      user.totalWon += winningsAmount;
      user.withdrawableBalance += winningsAmount;
      near.log(`${accountId} WON! Received ${winningsAmount.toString()} yoctoNEAR (x${winMultiplier})`);
    } else {
      // User loses - amount goes to contract balance
      user.totalLost += deposit;
      this.contractBalance += deposit;
      near.log(`${accountId} LOST! ${deposit.toString()} yoctoNEAR added to contract balance`);
    }

    // Save updated user data
    this.users.set(accountId, user);
  }

  // User withdraws their available winnings
  @call({})
  withdraw(): void {
    const accountId = near.predecessorAccountId();
    let user = this.getUser(accountId);

    const amountToWithdraw = user.withdrawableBalance;

    if (amountToWithdraw > BigInt(0)) {
      near.log(`${accountId} is attempting to withdraw ${amountToWithdraw.toString()} yoctoNEAR`);

      // Crucial: Reset withdrawable balance BEFORE initiating the transfer
      // This prevents reentrancy attacks.
      user.withdrawableBalance = BigInt(0);
      this.users.set(accountId, user); // Save the updated user state

      // Perform the transfer
      const promiseId = near.promiseBatchCreate(accountId);
      near.promiseBatchActionTransfer(promiseId, amountToWithdraw);
      near.log(`${accountId} successfully withdrew ${amountToWithdraw.toString()} yoctoNEAR`);
    } else {
      near.log(`${accountId} has no withdrawable balance.`);
    }
  }

  // View user's statistics
  @view({})
  get_user_stats({ accountId }: { accountId: string }): User | null {
    return this.users.get(accountId) || null;
  }

  // View the total balance held by the contract from losses
  @view({})
  get_contract_total_losses(): string {
    return this.contractBalance.toString();
  }

  // Optional: View the total number of unique users who have interacted
  @view({})
  get_total_users(): number {
    return this.users.length;
  }
}
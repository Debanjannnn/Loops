import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";

// Contract configuration
export const CONTRACT_ID = "tanjiroman.testnet";
export const NETWORK = "testnet";

// Initialize wallet selector
export const initWalletSelector = async () => {
  const selector = await setupWalletSelector({
    network: NETWORK,
    modules: [
      setupMyNearWallet(),
      setupSender(),
      setupHereWallet(),
      setupMeteorWallet(),
      setupNightly(),
    ],
  });

  const modal = setupModal(selector, {
    contractId: CONTRACT_ID,
  });

  return { selector, modal };
};

// Contract methods
export const CONTRACT_METHODS = {
  bet: "bet",
  withdraw: "withdraw", 
  get_user: "get_user",
  get_contract_balance: "get_contract_balance",
} as const;

// Utility functions
export const formatNEAR = (yoctoNEAR: string): string => {
  return (parseFloat(yoctoNEAR) / 1e24).toFixed(4);
};

export const parseNEAR = (near: string): string => {
  return (parseFloat(near) * 1e24).toString();
};

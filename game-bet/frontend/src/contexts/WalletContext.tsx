"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { WalletSelector } from "@near-wallet-selector/core";
import { initWalletSelector, CONTRACT_ID } from "../lib/near-config";

interface WalletContextType {
  selector: WalletSelector | null;
  modal: unknown;
  accounts: unknown[];
  accountId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  balance: string;
  connect: () => void;
  disconnect: () => void;
  signAndSendTransaction: (methodName: string, args?: unknown, deposit?: string) => Promise<unknown>;
  viewMethod: (methodName: string, args?: unknown) => Promise<unknown>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<unknown>(null);
  const [accounts, setAccounts] = useState<unknown[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<string>("0");

  const refreshBalance = useCallback(async () => {
    if (!selector || !accountId) {
      setBalance("0");
      return;
    }

    try {
      const { network } = selector.options;
      const provider = new (await import("near-api-js")).providers.JsonRpcProvider({
        url: network.nodeUrl,
      });

      const result = await provider.query({
        request_type: "view_account",
        account_id: accountId,
        finality: "optimistic",
      });

      setBalance((result as unknown as { amount: string }).amount);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance("0");
    }
  }, [selector, accountId]);

  useEffect(() => {
    const init = async () => {
      try {
        const { selector: walletSelector, modal: walletModal } = await initWalletSelector();
        setSelector(walletSelector);
        setModal(walletModal);

        // Add event listeners for wallet state changes
        const subscription = walletSelector.store.observable.subscribe(async (state) => {
          if (state.accounts.length > 0) {
            setAccounts(state.accounts);
            setAccountId(state.accounts[0].accountId);
            // Refresh balance when account changes
            setTimeout(() => refreshBalance(), 100);
          } else {
            setAccounts([]);
            setAccountId(null);
            setBalance("0");
          }
        });

        // Set initial state from store
        const currentState = walletSelector.store.getState();
        if (currentState.accounts.length > 0) {
          setAccounts(currentState.accounts);
          setAccountId(currentState.accounts[0].accountId);
        }

        // Cleanup subscription on unmount
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error("Failed to initialize wallet selector:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [refreshBalance]);

  const connect = () => {
    if (modal && typeof modal === 'object' && 'show' in modal) {
      (modal as { show: () => void }).show();
    }
  };

  const disconnect = async () => {
    if (selector) {
      const wallet = await selector.wallet();
      await wallet.signOut();
      // State will be updated automatically by the subscription
    }
  };


  const signAndSendTransaction = async (methodName: string, args: unknown = {}, deposit: string = "0") => {
    if (!selector || !accountId) {
      throw new Error("Wallet not connected");
    }

    const wallet = await selector.wallet();
    return await wallet.signAndSendTransaction({
      signerId: accountId,
      receiverId: CONTRACT_ID,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName,
            args: args as object,
            gas: "30000000000000",
            deposit,
          },
        },
      ],
    });
  };

  const viewMethod = async (methodName: string, args: unknown = {}) => {
    if (!selector) {
      throw new Error("Wallet selector not initialized");
    }

    const { network } = selector.options;
    const provider = new (await import("near-api-js")).providers.JsonRpcProvider({
      url: network.nodeUrl,
    });

    const result = await provider.query({
      request_type: "call_function",
      account_id: CONTRACT_ID,
      method_name: methodName,
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      finality: "optimistic",
    });

    return JSON.parse(Buffer.from((result as unknown as { result: Uint8Array }).result).toString());
  };

  const value: WalletContextType = {
    selector,
    modal,
    accounts,
    accountId,
    isConnected: !!accountId,
    isLoading,
    balance,
    connect,
    disconnect,
    signAndSendTransaction,
    viewMethod,
    refreshBalance,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

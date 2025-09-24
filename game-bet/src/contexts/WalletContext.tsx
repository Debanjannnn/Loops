"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { WalletSelector, AccountView } from "@near-wallet-selector/core";
import { Modal } from "@near-wallet-selector/modal-ui";
import { initWalletSelector, CONTRACT_ID } from "../../near-config";

interface WalletContextType {
  selector: WalletSelector | null;
  modal: Modal | null;
  accounts: AccountView[];
  accountId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => void;
  disconnect: () => void;
  signAndSendTransaction: (methodName: string, args?: any, deposit?: string) => Promise<any>;
  viewMethod: (methodName: string, args?: any) => Promise<any>;
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
  const [modal, setModal] = useState<Modal | null>(null);
  const [accounts, setAccounts] = useState<AccountView[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const { selector: walletSelector, modal: walletModal } = await initWalletSelector();
        setSelector(walletSelector);
        setModal(walletModal);

        // Check if user is already signed in
        const isSignedIn = walletSelector.isSignedIn();
        if (isSignedIn) {
          const accounts = await walletSelector.wallet().getAccounts();
          setAccounts(accounts);
          setAccountId(accounts[0]?.accountId || null);
        }
      } catch (error) {
        console.error("Failed to initialize wallet selector:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const connect = () => {
    if (modal) {
      modal.show();
    }
  };

  const disconnect = async () => {
    if (selector) {
      const wallet = await selector.wallet();
      await wallet.signOut();
      setAccounts([]);
      setAccountId(null);
    }
  };

  const signAndSendTransaction = async (methodName: string, args: any = {}, deposit: string = "0") => {
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
            args,
            gas: "30000000000000",
            deposit,
          },
        },
      ],
    });
  };

  const viewMethod = async (methodName: string, args: any = {}) => {
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

    return JSON.parse(Buffer.from(result.result).toString());
  };

  const value: WalletContextType = {
    selector,
    modal,
    accounts,
    accountId,
    isConnected: !!accountId,
    isLoading,
    connect,
    disconnect,
    signAndSendTransaction,
    viewMethod,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

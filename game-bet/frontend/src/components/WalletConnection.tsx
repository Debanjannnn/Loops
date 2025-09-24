"use client";

import React from "react";
import { useWallet } from "../contexts/WalletContext";

const WalletConnection: React.FC = () => {
  const { accountId, isConnected, connect, disconnect, isLoading, balance } = useWallet();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading wallet...</span>
      </div>
    );
  }

  if (isConnected && accountId) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div className="text-sm">
            <div className="font-medium text-gray-700">{accountId}</div>
            <div className="text-xs text-gray-500">
              Balance: {(parseFloat(balance) / 1e24).toFixed(4)} NEAR
            </div>
          </div>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
    >
      Connect Wallet
    </button>
  );
};

export default WalletConnection;

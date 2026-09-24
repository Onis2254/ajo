"use client";
// Wallet context.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { connectWallet as connect, signWithWallet, WalletError } from "@/lib/wallet";

const STORAGE_KEY = "ajo_wallet_address";

interface WalletContextValue {
  address: string | null;
  connecting: boolean;
  /**
   * True until the mount-time silent reconnect settles. UIs should render a
   * neutral placeholder rather than the "disconnected" state while this is
   * true, so returning users don't see "Connect wallet" flash first (#141).
   */
  restoring: boolean;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  signTransaction: (unsignedXdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  // Starts true (also during SSR, where localStorage isn't readable) so the
  // first paint never claims "disconnected" before we've checked.
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage unavailable (e.g. blocked) — nothing to restore.
    }
    // Re-confirm silently rather than trusting the cached value outright —
    // the extension may have switched accounts or been disconnected since.
    const restore = stored
      ? connect()
          .then((confirmed) => setAddress(confirmed))
          .catch(() => window.localStorage.removeItem(STORAGE_KEY))
      : Promise.resolve();
    void restore.finally(() => setRestoring(false));
  }, []);

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    try {
      const confirmed = await connect();
      setAddress(confirmed);
      window.localStorage.setItem(STORAGE_KEY, confirmed);
      return confirmed;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const signTransactionFn = useCallback(
    async (unsignedXdr: string) => {
      if (!address) throw new WalletError("Connect a wallet first.");
      return signWithWallet(unsignedXdr, address);
    },
    [address],
  );

  return (
    <WalletContext.Provider
      value={{ address, connecting, restoring, connectWallet, disconnectWallet, signTransaction: signTransactionFn }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
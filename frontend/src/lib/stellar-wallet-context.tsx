'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { isConnected, isAllowed, setAllowed, requestAccess, getAddress, signMessage as freighterSignMessage, signTransaction as freighterSignTransaction } from '@stellar/freighter-api';

interface StellarWalletContextValue {
  address: string | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  signTransaction: (xdr: string, networkPassphrase: string) => Promise<string>;
}

const StellarWalletContext = createContext<StellarWalletContextValue>({
  address: null,
  connected: false,
  connect: async () => {},
  disconnect: () => {},
  signMessage: async () => '',
  signTransaction: async () => '',
});

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const checkConnection = useCallback(async () => {
    const conn = await isConnected();
    if (!conn.isConnected) return;

    const allowed = await isAllowed();
    if (!allowed.isAllowed) return;

    const addr = await getAddress();
    if (addr.address) {
      setAddress(addr.address);
      setConnected(true);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = useCallback(async () => {
    const conn = await isConnected();
    if (!conn.isConnected) {
      window.open('https://freighter.app', '_blank');
      throw new Error('Freighter not installed');
    }

    const allowed = await isAllowed();
    if (!allowed.isAllowed) {
      await setAllowed();
    }

    const addr = await requestAccess();
    if (addr.address) {
      setAddress(addr.address);
      setConnected(true);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setConnected(false);
  }, []);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected');

    const result = await freighterSignMessage(message, { address });

    if (result.error) {
      const errorObj = typeof result.error === 'string' ? { message: result.error } : result.error;
      if (errorObj.code === 4) {
        throw new Error('Signing was cancelled');
      }
      throw new Error(errorObj.message || 'Signing failed');
    }
    if (!result.signedMessage) {
      throw new Error('No signature returned');
    }

    if (typeof result.signedMessage === 'string') {
      return result.signedMessage;
    }

    const bytes = new Uint8Array(result.signedMessage);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, [address]);

  const signTransaction = useCallback(async (xdr: string, networkPassphrase: string): Promise<string> => {
    const result = await freighterSignTransaction(xdr, { networkPassphrase });
    if (result.error) {
      const errorObj = typeof result.error === 'string' ? { message: result.error } : result.error;
      if (errorObj.code === 4) {
        throw new Error('Signing was cancelled');
      }
      throw new Error(errorObj.message || 'Transaction signing failed');
    }
    if (!result.signedTxXdr) {
      throw new Error('No signed transaction returned');
    }
    return result.signedTxXdr;
  }, []);

  return (
    <StellarWalletContext.Provider value={{ address, connected, connect, disconnect, signMessage, signTransaction }}>
      {children}
    </StellarWalletContext.Provider>
  );
}

export function useStellarWallet() {
  return useContext(StellarWalletContext);
}

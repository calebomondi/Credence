'use client';

import Image from 'next/image';
import { useStellarWallet } from '@/lib/stellar-wallet-context';
import { useAuth } from '@/lib/use-auth'

export function StellarWalletButton() {
  const { address, connected, connect, disconnect } = useStellarWallet();
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  const handleClick = async () => {
    if (connected) {
      disconnect();
    } else {
      try {
        await connect();
      } catch {
        alert('Please install Freighter wallet extension');
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="cursor-pointer border border-accent/30 text-accent hover:bg-accent/10 transition-colors font-mono text-sm rounded-full"
      disabled={!user}
    >
      {connected && address ? (
        <div className="flex items-center gap-2 p-1 bg-[#5271ff] text-white rounded-full">
          <Image src="/Icon.png" alt="Stellar" width={30} height={30} className="rounded-full" />
          <span className="pr-2">{address.slice(0, 6)}...{address.slice(-4)}</span>
        </div>
      ) : (
        <span className="px-3 py-1 block bg-[#5271ff] text-white rounded-full">
          {user ? 'Connect Freighter' : 'Sign In First'}
        </span>
      )}
    </button>
  );
}

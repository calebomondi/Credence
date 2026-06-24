'use client';

import { StellarWalletProvider } from '@/lib/stellar-wallet-context';
import { ThemeProvider } from '@/lib/theme-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StellarWalletProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </StellarWalletProvider>
  );
}

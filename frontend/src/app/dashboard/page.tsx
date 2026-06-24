'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useStellarWallet } from '@/lib/stellar-wallet-context';
import { WalletManager, scoreColors, tierColors } from '@/components/WalletManager';
import AmbientBackground from '@/components/AmbientBackground';
import { useAuth } from '@/lib/use-auth';
import { getMyPassport } from '@/lib/api';
import { Check, X } from 'lucide-react'
import { Header } from "@/components/Header"

const tierNames: Record<number, string> = {
  1: 'Silver',
  2: 'Gold',
  3: 'Platinum',
};

const privacyItems = [
  { label: 'Portfolio Value', protected: true },
  { label: 'Wallet Balance', protected: true },
  { label: 'Transaction History', protected: true },
  { label: 'ZK Proof', protected: true },
];

export default function Dashboard() {
  const { address: stellarAddr, connected: stellarConnected } = useStellarWallet();
  const [verifiedWallets, setVerifiedWallets] = useState(0);
  const walletsReady = verifiedWallets > 0;
  const { user, session } = useAuth();
  const token = session?.access_token;

  const [passport, setPassport] = useState<{
    commitment: string;
    tier: number;
    verifiedAt: number;
    walletCount: number;
    combinedScore: { scoreNumeric: number; scoreLevel: string } | null;
  } | null>(null);
  const [loadingPassport, setLoadingPassport] = useState(false);

  useEffect(() => {
    if (!token) {
      setPassport(null);
      return;
    }
    setLoadingPassport(true);
    getMyPassport(token)
      .then((data) => {
        if (data && data.tier) {
          setPassport(data);
        } else {
          setPassport(null);
        }
      })
      .catch(() => setPassport(null))
      .finally(() => setLoadingPassport(false));
  }, [token]);

  const greetingName =
    user?.user_metadata?.name || user?.email?.split('@')[0] || null;
  const tierName = passport ? tierNames[passport.tier] || `Tier ${passport.tier}` : null;
  const hasPassport = !!passport;
  const combinedScore = passport?.combinedScore ?? null;

  const timelineSteps = [
    { label: 'Wallets Verified', done: verifiedWallets > 0 },
    { label: 'Proof Generated', done: hasPassport },
    { label: 'Passport Issued', done: hasPassport },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center px-6 md:py-12 py-6">
        <AmbientBackground />
        <div className="max-w-6xl md:px-16 px-2 py-4 w-full space-y-8 bg-[var(--accent)]/20 rounded-lg">
          <div>
            <h1 className="text-3xl font-bold font-heading text-[var(--accent)]">
              {greetingName ? `Welcome Back, ${greetingName}` : 'Welcome'}
            </h1>
            <p className="text-secondary">Your Financial Credential</p>
          </div>

          <div className="passport-card p-6 flex items-center gap-6">
            <div className={`${hasPassport ? 'verified-seal' : 'unverified-seal'} shrink-0`}>
              {
                hasPassport
                ? <Check className="w-6 h-6 text-white" strokeWidth={3} aria-hidden="true" />
                : <X className="w-6 h-6 text-red-300" strokeWidth={3} aria-hidden="true" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold font-heading text-primary">
                  {loadingPassport
                    ? 'Loading...'
                    : hasPassport
                    ? 'Active Passport'
                    : 'No Passport Issued'}
                </h2>
                {tierName && (
                  // <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                  //   {tierName} Tier
                  // </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${tierColors[tierName]}`}>
                    {tierName}
                  </span>
                )}
                {combinedScore && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${scoreColors[combinedScore.scoreLevel]}`}
                    title={`Score: ${combinedScore.scoreNumeric}/100`}
                  >
                    {combinedScore.scoreLevel}
                    <span className="opacity-50 text-[10px]">{combinedScore.scoreNumeric}</span>
                  </span>
                )}
              </div>
              <p className="text-sm text-secondary">
                {hasPassport
                  ? 'Portfolio above threshold verified by ZK proof.'
                  : 'Connect your wallets and generate a proof to create your passport.'}
              </p>
              {hasPassport && (
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="inline-flex items-center gap-1 text-xs text-primary-50">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Proof Valid
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-primary-50">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Stellar Testnet
                  </span>
                  {passport?.verifiedAt && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary-50">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      Issued {new Date(passport.verifiedAt * 1000).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <WalletManager onStateChange={(state) => setVerifiedWallets(state.verifiedWallets)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="passport-card p-5">
              <h3 className="font-bold font-heading text-sm uppercase tracking-wider text-[var(--accent)] mb-4">
                Privacy
              </h3>
              <ul className="space-y-3">
                {privacyItems.map((item) => (
                  <li key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-primary-70">{item.label}</span>
                    {item.protected ? (
                      <span className="flex items-center gap-1.5 text-success text-xs">
                        <span className="w-5 h-5 rounded-full bg-success-20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} aria-hidden="true" />
                        </span>
                        Hidden
                      </span>
                    ) : (
                      <span className="text-primary-30 text-xs">Visible</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="passport-card p-5">
              <h3 className="font-bold font-heading text-[var(--accent)] text-sm uppercase tracking-wider mb-4">
                Verification Timeline
              </h3>
              <ul className="space-y-4">
                {timelineSteps.map((step) => (
                  <li key={step.label} className="flex items-center gap-3 text-sm">
                    {step.done ? (
                      <span className="w-5 h-5 rounded-full bg-success-20 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} aria-hidden="true" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-alpha-5 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-primary-20">○</span>
                      </span>
                    )}
                    <span className={step.done ? 'text-primary-80' : 'text-primary-20'}>
                      {step.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Link
              href={walletsReady ? '/generate-proof' : '#'}
              onClick={(e) => { if (!walletsReady) e.preventDefault(); }}
              className={`flex-1 text-center text-white px-6 py-3 font-semibold rounded-full transition-all ${
                walletsReady
                  ? 'bg-accent hover:opacity-90'
                  : 'bg-[var(--accent)]/80 text-accent-foreground/50 cursor-not-allowed'
              }`}
              title={!walletsReady ? 'Verify a wallet first' : ''}
            >
              Generate New Proof
            </Link>
            <Link
              href={hasPassport ? '/passport' : '#'}
              onClick={(e) => { if (!hasPassport) e.preventDefault(); }}
              className={`px-6 py-3 font-semibold text-center transition-all rounded-full ${
                hasPassport
                  ? 'border border-default text-[#5271ff] hover:bg-[var(--alpha-5)]'
                  : 'border border-default/30 text-[#5271ff]/70 cursor-not-allowed'
              }`}
              title={!hasPassport ? 'Verify a wallet first' : ''}
            >
              View Passport
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStellarWallet } from '@/lib/stellar-wallet-context';
import { useAuth } from '@/lib/use-auth';
import { listWallets, checkWallet, getChallenge, verifyWallet, fetchVAScore } from '@/lib/api';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Check } from 'lucide-react'

interface WalletLink {
  id: string;
  walletAddress: string;
  status: string;
  verifiedAt: string;
  createdAt: string;
}

interface WalletManagerProps {
  onStateChange?: (state: { verifiedWallets: number }) => void;
}

export const scoreColors: Record<string, string> = {
  A: 'text-green-400 bg-green-400/10 border-green-400/30',
  B: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
  C: 'text-accent bg-accent/10 border-accent/20',
  D: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  E: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  F: 'text-red-400 bg-red-400/10 border-red-400/30',
};

export const tierColors: Record<string, string> = {
  Platinum: 'text-green-400 bg-green-400/10 border-green-400/30',
  Gold: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  Silver: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30',
  Bronze: 'text-amber-600 bg-amber-600/10 border-amber-600/30',
};

function tierFromValue(value: number): { name: string } | null {
  if (value >= 25000) return { name: 'Platinum' };
  if (value >= 5000) return { name: 'Gold' };
  if (value >= 1000) return { name: 'Silver' };
  return { name: 'Bronze' };
}

export function WalletManager({ onStateChange }: WalletManagerProps) {
  const { address: stellarAddr, connected: stellarConnected, signMessage: stellarSignMessage } = useStellarWallet();
  const { user, session } = useAuth();
  const token = session?.access_token;

  const [wallets, setWallets] = useState<WalletLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [scores, setScores] = useState<Record<string, { scoreNumeric: number; scoreLevel: string; portfolioValue: number }>>({});
  const [checkCounter, setCheckCounter] = useState(0);

  const fetchWallets = useCallback(async () => {
    if (!token) return;
    try {
      const data = await listWallets(token);
      setWallets(Array.isArray(data) ? data : []);
    } catch {
      setWallets([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchWallets();
  }, [token, fetchWallets]);

  useEffect(() => {
    onStateChange?.({ verifiedWallets: wallets.filter((w) => w.status === 'verified').length });
  }, [wallets, onStateChange]);

  useEffect(() => {
    const verified = wallets.filter((w) => w.status === 'verified');
    if (verified.length === 0) return;
    const addrs = verified.map((w) => w.walletAddress);
    fetchVAScore(addrs).then((data) => {
      if (!data?.wallets) return;
      const map: Record<string, { scoreNumeric: number; scoreLevel: string; portfolioValue: number }> = {};
      for (const w of data.wallets) {
        map[w.address] = { scoreNumeric: w.scoreNumeric, scoreLevel: w.scoreLevel, portfolioValue: w.portfolioValue };
      }
      setScores(map);
    }).catch(() => {});
  }, [wallets]);

  useEffect(() => {
    if (!stellarConnected || !stellarAddr || !token) {
      setCheckResult(null);
      return;
    }
    const alreadyLinked = wallets.find((w) => w.walletAddress === stellarAddr);
    if (alreadyLinked) {
      setCheckResult(alreadyLinked.status === 'verified' ? 'verified' : 'linked');
      return;
    }
    checkWallet(stellarAddr, token).then((res) => {
      setCheckResult(res.status);
    }).catch(() => setCheckResult('error'));
  }, [stellarConnected, stellarAddr, token, wallets, checkCounter]);

  const handleVerify = async () => {
    if (!stellarAddr || !token) return;
    setVerifying(true);
    try {
      const challengeRes = await getChallenge(stellarAddr);
      const signature = await stellarSignMessage(challengeRes.challenge);
      await verifyWallet(stellarAddr, signature, challengeRes.challengeId, token);
      setCheckResult('verified');
      await fetchWallets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      if (msg === 'Signing was cancelled') {
        setCheckResult('cancelled');
      } else {
        setCheckResult('error');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleRetryCheck = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const freshToken = freshSession?.access_token;
      if (!freshToken || !stellarAddr) {
        setCheckResult('error');
        return;
      }
      const res = await checkWallet(stellarAddr, freshToken);
      setCheckResult(res.status);
    } catch {
      setCheckResult('error');
    }
  };

  const verifiedCount = wallets.filter((w) => w.status === 'verified').length;
  const addr = stellarAddr;

  if (!token) {
    return (
      <div className="passport-card p-4 text-center">
        <p className="text-sm text-secondary">Sign in with Google to manage your wallets.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="passport-card p-4 text-center">
        <p className="text-sm text-secondary">Loading wallets...</p>
      </div>
    );
  }

  const renderConnectSection = () => {
    if (!stellarConnected) {
      return <p className="text-sm text-primary-30">Connect Freighter to add a wallet.</p>;
    }
    if (!checkResult || !addr) {
      return <p className="text-sm text-primary-30">Checking wallet...</p>;
    }
    if (checkResult === 'available') {
      return (
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-accent">{addr.slice(0, 6)}...{addr.slice(-4)}</span>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-4 py-2 cursor-pointer rounded-full text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-all disabled:opacity-50"
          >
            {verifying ? 'Signing...' : 'Sign to Verify'}
          </button>
        </div>
      );
    }
    if (checkResult === 'verified' || checkResult === 'linked') {
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-accent">{addr.slice(0, 6)}...{addr.slice(-4)}</span>
          <span className="flex items-center gap-1.5 text-success text-xs">
            <span className="w-3 h-3 rounded-full bg-success-20 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} aria-hidden="true" />
            </span>
            Already {checkResult === 'linked' ? 'linked' : 'verified'}
          </span>
        </div>
      );
    }
    if (checkResult === 'belongs_to_other' || checkResult === 'linked_to_other') {
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-accent">{addr.slice(0, 6)}...{addr.slice(-4)}</span>
          <span className="text-red-400 text-xs">Belongs to another account</span>
        </div>
      );
    }
    if (checkResult === 'cancelled') {
      return (
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-accent">{addr.slice(0, 6)}...{addr.slice(-4)}</span>
          <span className="text-primary-30 text-xs">Signing cancelled</span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-accent">{addr.slice(0, 6)}...{addr.slice(-4)}</span>
        <button
          onClick={handleRetryCheck}
          className="px-3 py-1 cursor-pointer rounded-full text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-all"
        >
          Retry
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold font-heading text-sm uppercase tracking-wider text-secondary mb-3">
        Linked Wallets
      </h3>

      {wallets.length === 0 ? (
        <div className="passport-card p-4 text-center">
          <p className="text-sm text-primary-30">No wallets linked yet. Connect one below.</p>
        </div>
      ) : (
        <div className="passport-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default text-xs text-secondary uppercase tracking-wider">
                <th className="text-left p-3 font-medium">Wallet Address</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Score</th>
                <th className="text-left p-3 font-medium">Tier</th>
                <th className="text-left p-3 font-medium">Connected</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w) => {
                const score = scores[w.walletAddress];
                const sc = scoreColors[score?.scoreLevel ?? ''] || '';
                return (
                  <tr key={w.id} className="border-b border-[#5271ff]/10 last:border-0">
                    <td className="p-3 font-mono text-xs text-accent">
                      {w.walletAddress.slice(0, 6)}...{w.walletAddress.slice(-4)}
                    </td>
                    <td className="p-3">
                      {w.status === 'verified' ? (
                        <span className="flex items-center gap-1.5 text-success text-xs">
                          <span className="w-4 h-4 rounded-full bg-success-20 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} aria-hidden="true" />
                          </span>
                          Verified
                        </span>
                      ) : (
                        <span className="text-primary-30 text-xs">Pending</span>
                      )}
                    </td>
                    <td className="p-3">
                      {score ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${sc}`}
                          title={`Score: ${score.scoreNumeric}/100`}
                        >
                          {score.scoreLevel}
                          <span className="opacity-50 text-[10px]">{score.scoreNumeric}</span>
                        </span>
                      ) : (
                        <span className="text-primary-20 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {score ? (
                        (() => {
                          const t = tierFromValue(score.portfolioValue);
                          const tc = t ? tierColors[t.name] : '';
                          return t ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${tc}`}>
                              {t.name}
                            </span>
                          ) : (
                            <span className="text-primary-20 text-[11px]">—</span>
                          );
                        })()
                      ) : (
                        <span className="text-primary-20 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-primary-50">
                      {new Date(w.verifiedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="passport-card p-4">
        <p className="text-xs text-secondary uppercase tracking-wider mb-3">Connect New Wallet</p>
        {renderConnectSection()}
      </div>

      {verifiedCount > 0 && (
        <p className="text-xs text-secondary text-center">
          {verifiedCount} wallet{verifiedCount > 1 ? 's' : ''} verified. You can generate a proof.
        </p>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useStellarWallet } from '@/lib/stellar-wallet-context';
import { useAuth } from '@/lib/use-auth';
import { fetchStellarPortfolio, preparePassport, listWallets, confirmPassport } from '@/lib/api';
import { Header } from "@/components/Header"
import * as StellarSdk from '@stellar/stellar-sdk';
import AmbientBackground from '@/components/AmbientBackground';

const tierMap: Record<string, number> = { Silver: 1, Gold: 2, Platinum: 3 };

const tiers = [
  { name: 'Silver', min: 1000, color: 'from-zinc-400 to-zinc-300', border: 'border-default' },
  { name: 'Gold', min: 5000, color: 'from-gold to-orange-400', border: 'border-orange-300/20' },
  { name: 'Platinum', min: 25000, color: 'from-[#1ED760] to-teal-400', border: 'border-[#1ED760]/20' },
] as const;

type TierName = (typeof tiers)[number]['name'];

interface Step {
  key: string;
  label: string;
  status: 'pending' | 'active' | 'done';
}

const initialSteps: Step[] = [
  { key: 'portfolio', label: 'Fetching Portfolio...', status: 'pending' },
  { key: 'proof', label: 'Generating Proof...', status: 'pending' },
  { key: 'submission', label: 'Submitting to Stellar...', status: 'pending' },
  { key: 'done', label: 'Passport Created', status: 'pending' },
];

export default function GenerateProof() {
  const { address: stellarAddr, connected: stellarConnected, signTransaction } = useStellarWallet();
  const { user, session } = useAuth();
  const token = session?.access_token;

  const [selectedTier, setSelectedTier] = useState<TierName | null>(null);
  const [portfolioValue, setPortfolioValue] = useState<number | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCommitment, setResultCommitment] = useState<string | null>(null);
  const [proofResult, setProofResult] = useState<{
    commitment: string;
    tier: number;
    proof: { a: string; b: string; c: string };
    publicSignals: string[];
    vascore: number;
    walletCount: number;
    nonce: string;
  } | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [portfolioValueForContract, setPortfolioValueForContract] = useState(0);

  useEffect(() => {
    if (!stellarAddr) return;
    let cancelled = false;
    const fetchPortfolio = async () => {
      setPortfolioLoading(true);
      try {
        const walletSet = new Set<string>([stellarAddr]);
        if (token) {
          try {
            const linked = await listWallets(token);
            if (Array.isArray(linked)) {
              linked
                .filter((w: { status: string }) => w.status === 'verified')
                .forEach((w: { walletAddress: string }) => walletSet.add(w.walletAddress));
            }
          } catch { /* proceed with just connected wallet */ }
        }
        const res = await fetchStellarPortfolio(Array.from(walletSet));
        if (!cancelled) setPortfolioValue(res.totalValueUsd ?? 0);
      } catch {
        if (!cancelled) setPortfolioValue(null);
      } finally {
        if (!cancelled) setPortfolioLoading(false);
      }
    };
    fetchPortfolio();
    return () => { cancelled = true; };
  }, [stellarAddr, token]);

  const advanceStep = (index: number) => {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i < index) return { ...s, status: 'done' as const };
        if (i === index) return { ...s, status: 'active' as const };
        return { ...s, status: 'pending' as const };
      })
    );
  };

  const markAllDone = () => {
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' as const })));
  };

  function hexToBuffer(hex: string): Buffer {
    return Buffer.from(hex, 'hex');
  }

  const doSubmit = async (
    proofRes: {
      commitment: string;
      tier: number;
      proof: { a: string; b: string; c: string };
      publicSignals: string[];
      vascore: number;
      walletCount: number;
      nonce: string;
    },
    portfolioValueUsd: number,
  ) => {
    const rpcUrl = 'https://soroban-testnet.stellar.org';
    const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID!;
    const networkPassphrase = StellarSdk.Networks.TESTNET;
    const rpc = new StellarSdk.rpc.Server(rpcUrl);

    const userScVal = StellarSdk.Address.fromString(stellarAddr!).toScVal();

    const portfolioValueScVal = StellarSdk.nativeToScVal(
      BigInt(Math.round(portfolioValueUsd * 100)),
      { type: 'u128' },
    );

    const aBytes = hexToBuffer(proofRes.proof.a);
    const bBytes = hexToBuffer(proofRes.proof.b);
    const cBytes = hexToBuffer(proofRes.proof.c);

    if (aBytes.length !== 96) throw new Error(`proof.a must be 96 bytes, got ${aBytes.length}`);
    if (bBytes.length !== 192) throw new Error(`proof.b must be 192 bytes, got ${bBytes.length}`);
    if (cBytes.length !== 96) throw new Error(`proof.c must be 96 bytes, got ${cBytes.length}`);


    const proofScVal = StellarSdk.xdr.ScVal.scvMap([
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol('a'),
        val: StellarSdk.xdr.ScVal.scvBytes(hexToBuffer(proofRes.proof.a)),
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol('b'),
        val: StellarSdk.xdr.ScVal.scvBytes(hexToBuffer(proofRes.proof.b)),
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol('c'),
        val: StellarSdk.xdr.ScVal.scvBytes(hexToBuffer(proofRes.proof.c)),
      }),
    ]);

    const publicSignalsScVal = StellarSdk.xdr.ScVal.scvVec(
      proofRes.publicSignals.map((hex, i) => {
        const buf = hexToBuffer(hex);
        if (buf.length !== 32) throw new Error(`publicSignals[${i}] must be 32 bytes, got ${buf.length}`);
        return StellarSdk.nativeToScVal(BigInt('0x' + hex), { type: 'u256' });
      }),
    );

    const commitmentScVal = StellarSdk.xdr.ScVal.scvBytes(
      hexToBuffer(proofRes.commitment.replace('0x', '')),
    );

    const tierScVal = StellarSdk.nativeToScVal(proofRes.tier, { type: 'u32' });
    const vascoreScVal = StellarSdk.nativeToScVal(proofRes.vascore, { type: 'u32' });
    const walletCountScVal = StellarSdk.nativeToScVal(proofRes.walletCount, { type: 'u32' });

    const account = await rpc.getAccount(stellarAddr!);

    const contract = new StellarSdk.Contract(contractId);
    let tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        contract.call(
          'verify_and_issue',
          userScVal,
          proofScVal,
          publicSignalsScVal,
          portfolioValueScVal,
          commitmentScVal,
          tierScVal,
          vascoreScVal,
          walletCountScVal,
        ),
      )
      .setTimeout(180)
      .build();

    const simulation = await rpc.simulateTransaction(tx);

    if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation failed: ${simulation.error}`);
    }

    tx = StellarSdk.rpc.assembleTransaction(tx, simulation).build();

    const signedXdr = await signTransaction(tx.toXDR(), networkPassphrase);

    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      networkPassphrase,
    ) as StellarSdk.Transaction;

    const sendResponse = await rpc.sendTransaction(signedTx);

    if (sendResponse.status === 'ERROR') {
      throw new Error(`Transaction failed: ${sendResponse.errorResult}`);
    }

    let getResponse = await rpc.getTransaction(sendResponse.hash);
    while (getResponse.status === 'NOT_FOUND') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      getResponse = await rpc.getTransaction(sendResponse.hash);
    }

    if (getResponse.status !== 'SUCCESS') {
      throw new Error(`Transaction failed: ${getResponse.status}`);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTier || !stellarAddr) return;

    setStarted(true);
    setComplete(false);
    setError(null);
    setSubmissionError(null);
    setProofResult(null);
    setResultCommitment(null);
    setSteps(initialSteps);

    let savedProofResult: typeof proofResult = null;
    let savedValue = 0;

    try {
      advanceStep(0);

      const walletSet = new Set<string>([stellarAddr]);
      if (token) {
        try {
          const linked = await listWallets(token);
          if (Array.isArray(linked)) {
            linked
              .filter((w: { status: string }) => w.status === 'verified')
              .forEach((w: { walletAddress: string }) => walletSet.add(w.walletAddress));
          }
        } catch {
          // proceed with just the connected wallet
        }
      }

      const portfolioRes = await fetchStellarPortfolio(Array.from(walletSet));
      savedValue = portfolioRes.totalValueUsd;
      advanceStep(1);

      const tierNum = tierMap[selectedTier];
      const res = await preparePassport(savedValue, tierNum, user?.email as string);
      console.log(`>>>> ${JSON.stringify(res)}`)
      savedProofResult = res;
      setProofResult(res);
      setPortfolioValueForContract(savedValue);
      setResultCommitment(res.commitment);
      advanceStep(2);

      await doSubmit(res, savedValue);

      if (token) {
        await confirmPassport(token, res.commitment).catch(() => {});
      }

      advanceStep(3);
      markAllDone();
      setComplete(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      if (savedProofResult) {
        setSubmissionError(msg);
        setSteps((prev) =>
          prev.map((s, i) => (i === 2 ? { ...s, status: 'pending' as const } : s)),
        );
      } else {
        setError(msg);
        setStarted(false);
      }
    }
  };

  const handleRetrySubmission = async () => {
    if (!proofResult || !stellarAddr) return;
    setSubmissionError(null);
    setSteps((prev) =>
      prev.map((s, i) => (i === 2 ? { ...s, status: 'active' as const } : s)),
    );
    try {
      await doSubmit(proofResult, portfolioValueForContract);

      if (token) {
        await confirmPassport(token, proofResult.commitment).catch(() => {});
      }

      advanceStep(3);
      markAllDone();
      setComplete(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setSubmissionError(msg);
      setSteps((prev) =>
        prev.map((s, i) => (i === 2 ? { ...s, status: 'pending' as const } : s)),
      );
    }
  };

  const walletsConnected = stellarConnected && !!stellarAddr;
  const selectedTierMin = selectedTier ? tiers.find(t => t.name === selectedTier)?.min ?? null : null;
  const canAfford = selectedTier !== null && !portfolioLoading && portfolioValue !== null && portfolioValue >= selectedTierMin!;
  const showInsufficient = selectedTier !== null && !portfolioLoading && portfolioValue !== null && !canAfford;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <AmbientBackground />
        <div className="flex-1 flex items-center justify-center max-w-6xl px-16 py-10 w-full space-y-8 bg-[var(--accent)]/20 rounded-lg">
          <div className="max-w-lg w-full space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold font-heading text-accent mb-2">
                Select Your Tier
              </h1>
              <p className="text-secondary text-sm">
                Choose the tier you want to prove. Your portfolio must meet the minimum.
              </p>
            </div>

            {!walletsConnected && !started && (
              <div className="passport-card p-4 text-center">
                <p className="text-sm text-primary-30">
                  Connect your Stellar wallet to generate a proof.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {tiers.map((tier) => {
                const isSelected = selectedTier === tier.name;
                const isAffordable = portfolioValue !== null && portfolioValue >= tier.min;
                const showInsuf = portfolioValue !== null && !isAffordable;
                return (
                  <button
                    key={tier.name}
                    onClick={() => !started && setSelectedTier(tier.name)}
                    disabled={started || !walletsConnected}
                    className={`w-full passport-card p-5 text-left transition-all duration-200 ${tier.border} ${
                      isSelected ? `ring-2 ring-[#5271ff] scale-[1.02]` : 'opacity-70 hover:opacity-100'
                    } ${started || !walletsConnected ? 'cursor-not-allowed' : ''} ${showInsuf ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-accent-foreground font-bold`}
                        >
                          {tier.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-primary">{tier.name}</p>
                          <p className="text-sm text-secondary">
                            Min. ${tier.min.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold">
                            ✓
                          </div>
                        )}
                        {showInsuf && (
                          <span className="text-[10px] text-[var(--gold)] ">Insufficient</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!started && !complete && (
              <>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedTier || !walletsConnected || !canAfford || portfolioLoading}
                  className={`w-full px-8 py-3 rounded-full font-semibold transition-all ${
                    selectedTier && walletsConnected && canAfford && !portfolioLoading
                      ? 'bg-accent text-accent-foreground hover:opacity-90'
                      : 'bg-alpha-5 text-primary-30 cursor-not-allowed'
                  }`}
                >
                  {!walletsConnected
                    ? 'Connect Wallet First'
                    : portfolioLoading
                    ? 'Loading portfolio...'
                    : !selectedTier
                    ? 'Select a Tier'
                    : !canAfford
                    ? `Portfolio below ${selectedTier} minimum`
                    : `Prove ${selectedTier} Tier`}
                </button>
                {showInsufficient && (
                  <p className="text-xs text-secondary text-center mt-2">
                    Your combined portfolio (${portfolioValue!.toLocaleString()}) doesn't meet the ${selectedTierMin!.toLocaleString()} minimum for {selectedTier}. Please select a lower tier.
                  </p>
                )}
              </>
            )}

            {error && (
              <div className="passport-card p-4 border border-red-400/30 text-center">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setStarted(false);
                  }}
                  className="mt-2 text-sm text-accent hover:underline"
                >
                  Try Again
                </button>
              </div>
            )}

            {started && (
              <div className="passport-card p-6 space-y-4">
                {steps.map((step) => (
                  <div
                    key={step.key}
                    className={`flex items-center gap-3 animate-step-reveal ${
                      step.status === 'pending' ? 'opacity-20' : 'opacity-100'
                    }`}
                  >
                    {step.status === 'active' && (
                      <span className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
                    )}
                    {step.status === 'done' && (
                      <span className="w-6 h-6 rounded-full bg-success-20 flex items-center justify-center shrink-0 animate-check-pop">
                        <span className="text-[12px] text-success">✓</span>
                      </span>
                    )}
                    {step.status === 'pending' && (
                      <span className="w-6 h-6 rounded-full bg-alpha-5 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-primary-20">○</span>
                      </span>
                    )}
                    <span
                      className={`text-sm ${
                        step.status === 'done'
                          ? 'text-success'
                          : step.status === 'active'
                          ? 'text-primary'
                          : 'text-primary-20'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
                {submissionError && (
                  <div className="pt-2 border-t border-default text-center space-y-2">
                    <p className="text-sm text-red-400">{submissionError}</p>
                    <button
                      onClick={handleRetrySubmission}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 transition-all cursor-pointer"
                    >
                      Retry Submission
                    </button>
                  </div>
                )}
              </div>
            )}

            {complete && (
              <div className="text-center space-y-4 animate-step-reveal">
                <div className="passport-card p-6 border-[#1ED760]/20">
                  <div className="w-12 h-12 rounded-full bg-success-20 flex items-center justify-center mx-auto mb-3 animate-check-pop">
                    <span className="text-xl text-success">✓</span>
                  </div>
                  <p className="text-success font-semibold mb-1">
                    Passport Generated Successfully
                  </p>
                  <p className="text-sm text-secondary">
                    Your {selectedTier} tier passport has been issued on Stellar.
                  </p>
                  {resultCommitment && (
                    <div className="mt-3 pt-3 border-t border-default">
                      <p className="text-[10px] text-secondary uppercase tracking-wider mb-1">
                        Commitment Hash
                      </p>
                      <p className="font-mono text-[11px] text-primary-50 break-all">
                        {resultCommitment}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <Link
                    href="/passport"
                    className="flex-1 px-6 py-3 rounded-full bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all text-center"
                  >
                    View Passport
                  </Link>
                  <button
                    onClick={() => {
                      setStarted(false);
                      setComplete(false);
                      setSteps(initialSteps);
                      setError(null);
                      setSubmissionError(null);
                      setProofResult(null);
                      setPortfolioValueForContract(0);
                      setResultCommitment(null);
                    }}
                    className="px-6 py-3 rounded-full border border-default text-[#5271ff] hover:bg-[var(--alpha-5)] transition-all"
                  >
                    New Proof
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { searchPassport } from '@/lib/api';
import FlipPassportCard from '@/components/FlipPassportCard';

const tierNames: Record<number, string> = {
  1: 'Silver',
  2: 'Gold',
  3: 'Platinum',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setSearched(true);
    setNotFound(false);
    setData(null);

    try {
      const res = await searchPassport(q);
      // console.log(`>> ${JSON.stringify(res)}`)
      if (res && res.tier) {
        setData(res);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-heading text-accent mb-2">
              Search Passport
            </h1>
            <p className="text-secondary text-sm">
              Look up a passport by email or commitment hash.
            </p>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Email or commitment hash..."
              className="flex-1 px-4 py-3 rounded-full bg-alpha-5 border border-default text-primary text-sm outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-full bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          <div className="flex justify-center">
            {loading && (
              <div className="passport-card p-12">
                <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
                <p className="mt-4 text-secondary text-sm">Searching...</p>
              </div>
            )}

            {!loading && searched && notFound && (
              <div className="passport-card p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-alpha-5 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-primary-30">!</span>
                </div>
                <h2 className="text-xl font-bold font-heading text-primary mb-2">
                  Passport Not Found
                </h2>
                <p className="text-sm text-secondary">
                  No passport matches that email or commitment hash.
                </p>
              </div>
            )}

            {!loading && !searched && (
              <div className="text-center py-12">
                <p className="text-secondary text-sm">
                  Enter an email or commitment hash to begin.
                </p>
              </div>
            )}

            {!loading && data && (
              <FlipPassportCard
                tierName={tierNames[data.tier] || `Tier ${data.tier}`}
                commitmentHash={data.commitment}
                proofHash={data.proofHash}
                issuedDate={new Date(data.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                holderEmail={data.holderEmail}
                combinedScore={data.combinedScore != null ? { scoreNumeric: data.combinedScore, scoreLevel: data.scoreLevel } : null}
                walletCount={data.walletCount}
              />
            )}
          </div>
        </div>
      </main>

      <footer>
        <div className="max-w-6xl mx-auto border-t border-default py-6 text-center text-sm text-primary-60 bg-[#5271ff]/10">
          Credence &middot;{' '} Built {' '} on {' '}
          <a
            href="https://stellar.org"
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stellar
          </a>{' '}
          Network &middot; Powered by Zero-Knowledge Proofs
        </div>
      </footer>
    </div>
  );
}

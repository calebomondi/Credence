'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { verifyPassport } from '@/lib/api';
import FlipPassportCard from '@/components/FlipPassportCard';

const tierNames: Record<number, string> = {
  1: 'Silver',
  2: 'Gold',
  3: 'Platinum',
};

export default function VerifyPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    verifyPassport(id)
      .then((res) => {
        if (res && res.tier) {
          console.log(`Data: >> ${JSON.stringify(res)}`)
          setData(res);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-sm w-full text-center">
          {loading && (
            <div className="passport-card p-12">
              <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
              <p className="mt-4 text-secondary text-sm">Verifying credential...</p>
            </div>
          )}

          {notFound && (
            <div className="passport-card p-12">
              <div className="w-16 h-16 rounded-full bg-alpha-5 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-primary-30">!</span>
              </div>
              <h1 className="text-xl font-bold font-heading text-primary mb-2">
                Credential Not Found
              </h1>
              <p className="text-sm text-secondary mb-6">
                No passport matching this identifier exists on Stellar.
              </p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all"
              >
                Generate Your Passport
              </Link>
            </div>
          )}

          {data && (
            <div className="flex justify-center">
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
            </div>
          )}
        </div>
      </main>

      <footer className="">
          <div className="border-t max-w-6xl bg-[var(--accent)]/10  mx-auto border-default py-6 text-center text-sm text-primary-30">
            Credence &middot; Built on Stellar Network &middot; Powered by ZK Proofs
          </div>
      </footer>
    </div>
  );
}

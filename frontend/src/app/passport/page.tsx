'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useStellarWallet } from '@/lib/stellar-wallet-context';
import { useAuth } from '@/lib/use-auth';
import { getMyPassport } from '@/lib/api';
import { scoreColors } from '@/components/WalletManager';
import PassportSeal from '@/components/PassportSeal';
import QRDisplay from '@/components/QRDisplay';
import { Header } from '@/components/Header'
import { PassportCard } from '@/components/passport-card'

const tierNames: Record<number, string> = {
  1: 'Silver',
  2: 'Gold',
  3: 'Platinum',
};

export default function PassportPage() {
  const { address: stellarAddr, connected: stellarConnected } = useStellarWallet();
  const { user, session } = useAuth();
  const userEmail = user?.email
  const token = session?.access_token;
  const cardRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState('');
  const [passport, setPassport] = useState<{
    commitment: string;
    tier: number;
    verifiedAt: number;
    proofHash: string,
    walletCount: number;
    combinedScore: { scoreLevel: string; scoreNumeric: number } | null;
    userEmail: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!token) {
      setPassport(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getMyPassport(token)
      .then((data) => {
        if (data && data.tier) {
          // console.log(`>> ${JSON.stringify(data)}`)
          setPassport(data);
        } else {
          setPassport(null);
        }
      })
      .catch(() => setPassport(null))
      .finally(() => setLoading(false));
  }, [token]);

  const tierName = passport ? tierNames[passport.tier] || `Tier ${passport.tier}` : null;
  const passportNumber = passport
    ? `CRD-${new Date(passport.verifiedAt * 1000).getFullYear()}-${passport.commitment.slice(2, 8).toUpperCase()}`
    : null;

  const handleExportPdf = async () => {
    if (!cardRef.current) return;
    const imgData = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const cardEl = cardRef.current;
    const pdfH = (pdfW * cardEl.offsetHeight) / cardEl.offsetWidth;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`Credence-Passport-${passportNumber ?? 'unknown'}.pdf`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-6xl w-full">
          {loading && (
            <div className="text-center py-12">
              <p className="text-secondary">Loading passport...</p>
            </div>
          )}

          {!loading && !passport && (
            <div className="text-center space-y-4">
              <div className="passport-card p-8">
                <p className="text-secondary text-sm mb-2">No passport found</p>
                <p className="text-primary-30 text-xs">
                  {token
                    ? 'Generate a proof first from the dashboard.'
                    : 'Sign in with Google to view your passport.'}
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all"
              >
                Back to Dashboard
              </Link>
            </div>
          )}

          {!loading && passport && (
            <>
              {/** Passport View */}
              <div ref={cardRef}>
                <PassportCard 
                  passportNumber={passportNumber as string}
                  tierName={tierName as string}
                  score={passport.combinedScore as { scoreLevel: string; scoreNumeric: number }}
                  walletCount={passport.walletCount}
                  network={'Stellar Network'}
                  issuedDate={new Date(passport.verifiedAt * 1000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                  commitmentHash={passport.commitment}
                  proofHash={passport.proofHash}
                  userEmail={passport.userEmail}
                  qrCode={<QRDisplay
                        value={`${origin}/verify/${passport.commitment}`}
                        size={130}
                      />}
                  passportSeal={<PassportSeal size={200} />}
                  scoreColors={scoreColors}
                />
              </div>

              {/** Buttons */}
              <div className="mt-6 flex md:flex-row flex-col gap-4">
                <button
                  onClick={handleExportPdf}
                  className="flex-1 px-6 py-3 rounded-full cursor-pointer bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all"
                >
                  Download as PDF
                </button>
                <Link
                  href="/generate-proof"
                  className="flex-1 text-center text-[#5271ff] px-6 py-3 rounded-full cursor-pointer border border-[var(--accent)] hover:bg-[var(--accent)]/30 transition-all"
                >
                  Regenerate
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import PassportSeal from './PassportSeal';
import { Check } from 'lucide-react';
import Image from 'next/image'
import { tierColors, scoreColors } from '@/components/WalletManager'

interface FlipPassportCardProps {
  tierName: string;
  tierNumber?: number;
  commitmentHash: string;
  proofHash?: string;
  issuedDate: string;
  holderEmail?: string;
  combinedScore?: { scoreNumeric: number; scoreLevel: string } | null;
  walletCount?: number | null;
}

export default function FlipPassportCard({
  tierName,
  commitmentHash,
  proofHash,
  issuedDate,
  holderEmail,
  combinedScore,
  walletCount,
}: FlipPassportCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setFlipped(false);
  };

  const tierColor = tierName === 'Platinum' ? 'var(--success)' : tierName === 'Gold' ? '#F5B400' : '#A0A0A0';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setFlipped(true)}
      className="relative w-80 cursor-pointer"
      style={{ perspective: '1000px', height: '420px' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateY(${flipped ? 180 : 0}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ───── Front ───── */}
        <div
          className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
            border: `1px solid ${tierColor}33`,
            boxShadow: `0 0 40px ${tierColor}08, 0 20px 60px ${tierColor}15`,
          }}
        >
          <div className="flex items-center justify-center mb-3">
            <div  className="flex items-center gap-2">
              <Image src="/Credence.png" alt="Credence" width={40} height={40} className="w-8 h-8" />
              <span className="text-lg font-bold font-heading text-accent">Credence</span>
            </div>
          </div>

          <div className="border-t border-default mb-4" />

          <div className="flex items-center justify-evenly">
            <div className="flex justify-center mb-5">
              <PassportSeal size={100} />
            </div>
            <div>
              <p className="text-[10px] text-secondary uppercase tracking-[0.2em] text-center mb-1">
                Crypto Credit
              </p>
              <p className="text-xl font-bold font-heading text-primary text-center mb-5 tracking-wide">
                PASSPORT
              </p>
            </div>
          </div>

          <div className="flex items-center font-mono text-secondary justify-evenly mb-5">
            {holderEmail}
          </div>

          <div className="flex items-center justify-center">
            <div className="space-y-2.5 mb-5">
              {['Portfolio Verified', 'History Verified', 'Stellar Verified'].map(
                (item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-success-20 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} aria-hidden="true" />
                    </span>
                    <span className="text-primary-70">{item}</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="border-t border-default mb-4" />

          <div className="flex items-center justify-center mb-3">
            <div  className="flex items-center gap-2">
              <Image src="/Icon.png" alt="Credence" width={40} height={40} className="w-10 h-10 rounded-full" />
              <span className="text-lg font-bold font-heading text-accent">Stellar Network</span>
            </div>
          </div>
        </div>

        {/* ───── Back ───── */}
        <div
          className="absolute inset-0 rounded-2xl p-8 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 0 40px rgba(82, 113, 255, 0.08), 0 20px 60px rgba(82, 113, 255, 0.25)',
          }}
        >
          <div>
            <p className="text-sm text-accent uppercase tracking-widest font-heading font-bold text-center">
              Credential Details
            </p>

            <div className="border-t border-default my-4" />

            <div className="space-y-3">
              <div className="flex flex-col items-center justify-evenly">
                <p className="text-[10px] text-secondary uppercase tracking-wider mb-0.5">Issued</p>
                <p className="text-xs text-primary-60">{issuedDate}</p>
              </div>

              <div className="border-t border-default my-4" />

              <div className="flex items-center justify-evenly">
                <div className="text-center">
                  <p className="text-[10px] text-secondary uppercase tracking-wider mb-0.5">Tier</p>
                  <p className="text-lg font-bold font-heading" style={{ color: tierColor }}>
                    {tierName}
                  </p>
                </div>
                {combinedScore && (
                  <div className="text-center">
                    <p className="text-[10px] text-secondary uppercase tracking-wider mb-0.5">Score</p>
                    <p className="text-lg text-primary-60 font-bold font-heading">
                      {combinedScore.scoreLevel} ({combinedScore.scoreNumeric}/100)
                    </p>
                  </div>
                )}
                {walletCount != null && (
                  <div className="text-center">
                    <p className="text-[10px] text-secondary uppercase tracking-wider mb-0.5">Wallets</p>
                    <p className="text-lg text-primary-60 font-bold font-heading">{walletCount}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-default my-4" />

              <div className="text-center">
                <p className="text-[10px] text-secondary uppercase tracking-wider mb-0.5">Commitment Hash</p>
                <p className="text-xs font-mono text-primary-60 break-all">
                  {commitmentHash.slice(0, 32)}...
                </p>
              </div>
              {proofHash && (
                <div className="text-center">
                  <p className="text-[10px] text-secondary uppercase tracking-wider mb-0.5">Proof Hash</p>
                  <p className="text-xs font-mono text-primary-60 break-all">0x{proofHash.slice(0, 16)}...</p>
                </div>
              )}              
            </div>
          </div>

          <div className="text-center">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="mx-auto mb-1">
              <circle cx="18" cy="18" r="17" stroke="#1ED760" strokeWidth="1.5" opacity="0.4" />
              <path d="M11 18l5 5 9-9" stroke="#1ED760" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[10px] text-success">
              Verified on Stellar Testnet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

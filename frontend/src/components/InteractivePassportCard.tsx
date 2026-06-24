'use client';

import { useState, useRef } from 'react';

const passportData = {
  tier: 'Gold',
  threshold: '+$5,000',
  commitmentHash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  stellarTx: 'a1b2c3d4e5f6...7890abcdef',
  issued: 'June 22, 2026',
};

export default function InteractivePassportCard() {
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

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setFlipped(true)}
      className="relative w-72 h-96 cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateY(${flipped ? 180 : 0}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl p-6 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
            border: '1px solid var(--accent-30)',
            boxShadow: '0 0 30px rgba(82, 113, 255, 0.1)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-xs uppercase tracking-widest text-secondary" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Crypto Credit Passport
                </span>
              </div>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5" />
                <circle cx="14" cy="14" r="10" stroke="var(--accent)" strokeWidth="0.8" opacity="0.3" />
                <text x="14" y="15" textAnchor="middle" fill="var(--accent)" fontSize="7" fontWeight="bold" fontFamily="monospace">ZK</text>
              </svg>
            </div>

            <div className="border-t border-accent/20 pt-4 mt-2">
              <p className="text-xs text-secondary uppercase tracking-wider mb-1">
                Tier
              </p>
              <p className="text-3xl font-bold font-heading text-accent">
                {passportData.tier}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-success-20 flex items-center justify-center text-[10px] text-success">✓</span>
              <span className="text-sm text-primary-70">Portfolio {passportData.threshold}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-success-20 flex items-center justify-center text-[10px] text-success">✓</span>
              <span className="text-sm text-primary-70">ZK Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-success-20 flex items-center justify-center text-[10px] text-success">✓</span>
              <span className="text-sm text-primary-70">Stellar Network</span>
            </div>
          </div>

          <p className="text-[10px] text-primary-30 text-center mt-4">
            Hover to view credentials &rarr;
          </p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl p-6 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <p className="text-xs text-accent uppercase tracking-widest mb-4 font-heading">
              Credential Details
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-secondary uppercase tracking-wider">
                  Commitment Hash
                </p>
                <p className="text-xs font-mono text-primary-60 break-all mt-0.5">
                  {passportData.commitmentHash.slice(0, 32)}...
                </p>
              </div>
              <div>
                <p className="text-[10px] text-secondary uppercase tracking-wider">
                  Stellar Transaction
                </p>
                <p className="text-xs font-mono text-primary-60 mt-0.5">
                  {passportData.stellarTx}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-secondary uppercase tracking-wider">
                  Issued
                </p>
                <p className="text-xs text-primary-60 mt-0.5">
                  {passportData.issued}
                </p>
              </div>
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

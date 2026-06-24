'use client';

import FlipPassportCard from './FlipPassportCard';

export default function HeroPassportCard() {
  return (
    <FlipPassportCard
      tierName="Gold"
      commitmentHash="0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
      proofHash="0x42f67bcf0825dcddb9d9b0016cae01226c21adcb0f742d6760f4ebefe43b70d2"
      issuedDate="June 22, 2026"
      holderEmail="holder@example.com"
      combinedScore={{ scoreNumeric: 72, scoreLevel: 'B' }}
      walletCount={3}
    />
  );
}

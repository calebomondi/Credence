'use client';

import React from 'react';
import Image  from "next/image"
import { tierColors, scoreColors } from '@/components/WalletManager'

interface PassportCardProps {
  passportNumber: string;
  tierName: string;
  score?: { scoreLevel: string; scoreNumeric: number };
  walletCount: number;
  network: string;
  issuedDate: string;
  commitmentHash: string;
  proofHash: string;
  userEmail: string;
  qrCode?: React.ReactNode;
  passportSeal?: React.ReactNode;
  scoreColors?: Record<string, string>;
}

export function PassportCard({
  passportNumber,
  tierName,
  score,
  walletCount,
  network,
  issuedDate,
  commitmentHash,
  proofHash,
  userEmail,
  qrCode,
  passportSeal,
  scoreColors = {},
}: PassportCardProps) {
  return (
    <div className="w-full">
      {/* Desktop Layout - Horizontal */}
      <div className="hidden lg:flex lg:gap-8 rounded-3xl p-8 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 50%, var(--accent) 130%)',
          border: '0px solid var(--accent-30)',
          boxShadow: '0 20px 60px rgba(82, 113, 255, 0.08)',
        }}
      >
        
        {/* Left Section - Visual */}
        <div className="flex-1 flex items-center justify-center space-x-6 border-r border-[#5271ff]/70 pr-8">
          {/* Passport Seal */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-2xl" />
            {passportSeal && (
              <div className="relative">
                {passportSeal}
              </div>
            )}
          </div>

          {/* Verification Badge
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm font-semibold text-success">Verified</span>
          </div> */}

          {/* QR Code */}
          {qrCode && (
            <div className="space-y-3 mt-4">
              <div className="p-4 bg-background/50 backdrop-blur rounded-lg border border-[var(--accent)]/50">
                {qrCode}
              </div>
              <p className="text-xs text-secondary text-center">Scan to verify</p>
            </div>
          )}
        </div>

        {/* Right Section - Details */}
        <div className="flex-1 space-y-6">
          {/* Passport Number */}
          <div className="inline-flex items-center space-x-2">
            <Image src="/Credence.png" alt="Credence" width={60} height={60} className="w-12 h-12" />
            <div>
                <p className="text-xs text-secondary uppercase tracking-widest">
                Passport Number
                </p>
                <p className="text-2xl font-bold font-heading text-accent break-all">
                {passportNumber}
                </p>
            </div>
          </div>

          {/* Top Stats */}
          <div className="flex items-center justify-start space-x-5">
            {/* Tier */}
            <div className="space-y-1">
              <p className="text-xs text-secondary uppercase tracking-wider">Tier</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[14px] font-semibold border ${tierColors[tierName]}`}>
                    {tierName}
                </span>
            </div>

            {/* Score */}
            {score && (
              <div className="space-y-1">
                <p className="text-xs text-secondary uppercase tracking-wider">Score</p>
                <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${scoreColors[score.scoreLevel]}`}
                    title={`Score: ${score.scoreNumeric}/100`}
                  >
                    {score.scoreLevel}
                    <span className="opacity-50 text-[14px]">{score.scoreNumeric}</span>
                  </span>
              </div>
            )}
          </div>

          <hr className="border-t-2 border-[#5271ff]" />

          {/* Middle Details */}
          <div className="space-y-3 ">
            <div className="flex justify-between items-start">
              <span className="text-xs text-secondary uppercase tracking-wider">Wallets</span>
              <span className="text-sm font-medium text-primary">{walletCount}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-secondary uppercase tracking-wider">Network</span>
              <span className="text-sm font-medium text-primary">{network}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-secondary uppercase tracking-wider">Issued</span>
              <span className="text-sm font-medium text-primary">{issuedDate}</span>
            </div>
          </div>

          <hr className="border-t-2 border-[#5271ff]" />

          {/* Hash Details */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-secondary uppercase tracking-wider mb-1.5">
                Commitment Hash
              </p>
              <p className="font-mono text-[12px] text-primary/60 break-all leading-relaxed">
                {commitmentHash}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-secondary uppercase tracking-wider mb-1">
                ZK Proof Hash
              </p>
              <p className="font-mono text-[12px] text-primary/60 break-all leading-relaxed">
                {proofHash}
              </p>
            </div>
            <div>
              <p className="text-xs text-secondary uppercase tracking-wider mb-1.5">
                User Email
              </p>
              <p className="font-mono text-[12px] text-accent/60 break-all leading-relaxed">
                {userEmail}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Vertical */}
      <div className="lg:hidden rounded-2xl p-6 space-y-6"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 40%, var(--accent) 150%)',
          border: '0px solid var(--accent-30)',
          boxShadow: '0 20px 60px rgba(82, 113, 255, 0.08)',
        }}
      >
        {/* Header Section */}
        <div className="space-y-4 text-center ">
          {/* Passport Seal */}
          {passportSeal && (
            <div className="flex justify-center">
              {passportSeal}
            </div>
          )}

          <div className="inline-flex items-center space-x-2">
            <Image src="/Credence.png" alt="Credence" width={60} height={60} className="w-12 h-12" />
            <div>
                <p className="text-xs text-secondary uppercase text-start tracking-widest">
                Passport Number
                </p>
                <p className="text-2xl font-bold font-heading text-accent break-all">
                {passportNumber}
                </p>
            </div>
          </div>
        </div>

        <hr className="border-t-2 border-[#5271ff]" />

        {/* Stats Grid */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {/* Tier */}
            <div className="space-y-1">
              <p className="text-xs text-secondary uppercase tracking-wider">Tier</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[14px] font-semibold border ${tierColors[tierName]}`}>
                    {tierName}
                </span>
            </div>

            {/* Score */}
            {score && (
              <div className="space-y-1">
                <p className="text-xs text-secondary uppercase tracking-wider">Score</p>
                <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${scoreColors[score.scoreLevel]}`}
                    title={`Score: ${score.scoreNumeric}/100`}
                  >
                    <span className="opacity-80 text-[14px]">{score.scoreLevel}</span>
                    <span className="opacity-50 text-[14px]">{score.scoreNumeric}</span>
                  </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs text-secondary uppercase tracking-wider">Wallets</span>
              <span className="text-sm font-medium text-primary">{walletCount}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-secondary uppercase tracking-wider">Network</span>
              <span className="text-sm font-medium text-primary">{network}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-secondary uppercase tracking-wider">Issued</span>
              <span className="text-sm font-medium text-primary">{issuedDate}</span>
            </div>
          </div>
        </div>

        <hr className="border-t-2 border-[#5271ff]" />

        {/* QR Code - Mobile */}
        {qrCode && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="p-2 bg-background/50 backdrop-blur rounded-lg border border-[var(--accent)]/50">
              {qrCode}
            </div>
            <p className="text-[12px] text-secondary">Scan to verify this credential</p>
          </div>
        )}

        <hr className="border-t-2 border-[#5271ff]" />

        {/* Hash Details - Mobile */}
        <div className="space-y-3 pt-2">
          <div>
            <p className="text-[12px] text-secondary uppercase tracking-wider mb-1">
              Commitment Hash
            </p>
            <p className="font-mono text-[12px] text-primary/60 break-all leading-relaxed">
              {commitmentHash}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-secondary uppercase tracking-wider mb-1">
              ZK Proof Hash
            </p>
            <p className="font-mono text-[12px] text-primary/60 break-all leading-relaxed">
              {proofHash}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-secondary uppercase tracking-wider mb-1">
              User Email
            </p>
            <p className="font-mono text-[12px] text-accent/60 break-all leading-relaxed">
              {userEmail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

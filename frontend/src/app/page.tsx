'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useEffect, useState, type ReactNode } from 'react';
import HeroPassportCard from '@/components/HeroPassportCard';
import ComparisonIllustration from '@/components/ComparisonIllustration';
import LenderViewComparison from '@/components/LenderViewComparison';
import { Wallet, ShieldCheck, Network, BadgeCheck, Check, UserRoundSearch, Menu, X } from "lucide-react"
import AmbientBackground from '@/components/AmbientBackground'
import { ThemeToggle } from '@/components/ThemeToggle';
import { useRouter } from 'next/navigation'

function useInView(ref: { current: HTMLElement | null }) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

function FadeIn({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
    >
      {children}
    </div>
  );
}

const scrollToFlow = () => {
  const el = document.getElementById('how-it-works');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

const whyNowStats = [
  { region: 'Africa', stat: '$50B+', label: 'Stablecoin Savings' },
  { region: 'Latin America', stat: '30M+', label: 'Crypto Users' },
  { region: 'Southeast Asia', stat: '$100B+', label: 'Cross-Border Payments' },
];

const solutionCapabilities = [
  { label: 'Portfolio Value', desc: 'Above threshold' },
  { label: 'Savings Consistency', desc: 'Stable accumulation' },
  { label: 'Long-Term Ownership', desc: 'Asset longevity' },
  { label: 'Financial Stability', desc: 'Risk assessment' },
];

const howItWorks = [
  {
    num: "01",
    label: "Connect Wallet",
    desc: "Link your Stellar wallet. We analyze your assets and on-chain financial history.",
    Icon: Wallet,
  },
  {
    num: "02",
    label: "Generate Proof",
    desc: "Zero-Knowledge proof of financial health is created. No balances are revealed.",
    Icon: ShieldCheck,
  },
  {
    num: "03",
    label: "Stellar Verification",
    desc: "Proof is verified on the Stellar network and committed on-chain.",
    Icon: Network,
  },
  {
    num: "04",
    label: "Receive Passport",
    desc: "Your verifiable financial credential is issued. Private. Portable.",
    Icon: BadgeCheck,
  },
]

const healthCapabilities = [
  'Portfolio Value Above Threshold',
  'Savings Consistency',
  'Asset Longevity',
  'Liquidation History',
  'Risk Profile',
  'Net Worth',
];

export default function Home() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 py-4 flex items-center justify-between bg-[var(--bg-primary)]/50 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/Credence.png" alt="Credence" width={40} height={40} className="w-8 h-8" />
            <span className="text-lg font-bold font-heading text-accent">Credence</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={scrollToFlow}
              className="px-3.5 py-1.5 rounded-full cursor-pointer border border-[#5271ff] border-default text-accent hover:bg-[var(--alpha-5)] transition-all text-center font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => router.push('/search')}
              className="px-3.5 py-1.5 rounded-full cursor-pointer border border-[#5271ff] border-default text-accent hover:bg-[var(--alpha-5)] transition-all text-center font-medium"
            >
              <UserRoundSearch />
            </button>
            <ThemeToggle />
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 text-accent rounded-md hover:bg-[var(--accent)]/10 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="lg:hidden border-t border-default bg-[var(--bg-primary)]/95 backdrop-blur-md px-4 py-4 space-y-3 shadow-lg">
            <button
              onClick={() => { scrollToFlow(); setMenuOpen(false); }}
              className="block w-full text-left text-sm font-medium text-accent hover:bg-[var(--accent)]/10 px-3 py-2 rounded-md"
            >
              How It Works
            </button>
            <button
              onClick={() => router.push('/search')}
              className="block w-full text-left text-sm font-medium text-accent hover:bg-[var(--accent)]/10 px-3 py-2 rounded-md"
            >
              Search Passports
            </button>
            <div className="flex items-center gap-3 px-3 py-2">
              <ThemeToggle />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 relative z-[1]">
        <AmbientBackground />
        {/* ─────────────── 1. HERO ─────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28 bg-[#5271ff]/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight font-heading text-accent">
                Your Crypto Portifolio & History
                <br />
                Should Count.
              </h1>
              <p className="text-base sm:text-lg text-secondary leading-relaxed max-w-lg">
                Millions of people save, invest, and build wealth through crypto.
                But when applying for loans, mortgages, business financing, or
                credit, that financial history becomes invisible.
              </p>
              <p className="text-base sm:text-lg text-secondary leading-relaxed max-w-lg">
                Credence turns your crypto assets and on-chain
                financial history into a privacy-preserving{' '}
                <span className="text-accent font-medium">financial credential</span>{' '}
                verified with Zero-Knowledge proofs on Stellar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/dashboard"
                  className="px-8 py-3.5 rounded-full bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all text-center"
                >
                  Generate Passport
                </Link>
                {/* <button
                  onClick={scrollToFlow}
                  className="px-8 py-3.5 rounded-full cursor-pointer border border-[#5271ff] border-default text-accent hover:bg-[var(--alpha-5)] transition-all text-center font-medium"
                >
                  How It Works
                </button> */}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroPassportCard />
            </div>
          </div>
        </section>

        {/* ─────────────── 2. PROBLEM ─────────────── */}
        <FadeIn className="border-none">
          <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28 bg-[#5271ff]/5">
            <div className="max-w-3xl mb-12">
              <p className="text-xs text-accent uppercase tracking-[0.15em] font-semibold mb-3 font-heading">
                The Problem
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-accent mb-4">
                Crypto Is Wealth.
                <br />
                But It Doesn&rsquo;t Count.
              </h2>
              <p className="text-secondary leading-relaxed max-w-2xl">
                A user can hold thousands of dollars in stablecoins, maintain healthy
                savings habits, avoid liquidations, and build years of financial
                history on-chain. Yet most lenders only understand bank statements,
                salary slips, property, and traditional credit reports.
              </p>
              <p className="text-secondary leading-relaxed mt-3 font-medium">
                Crypto wealth remains invisible.
              </p>
            </div>
            <ComparisonIllustration />
          </section>
        </FadeIn>

        {/* ─────────────── 3. WHY NOW ─────────────── */}
        <FadeIn className="border-none">
          <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28 bg-[#5271ff]/10">
            <div className="max-w-3xl mb-12">
              <p className="text-xs text-accent uppercase tracking-[0.15em] font-semibold mb-3 font-heading">
                Why Now
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-accent mb-4">
                Crypto Has Become
                <br />
                Financial Infrastructure.
              </h2>
              <p className="text-secondary leading-relaxed max-w-2xl">
                Across emerging markets, crypto is no longer speculation. People use
                digital assets to preserve purchasing power, save in stable currencies,
                receive international payments, build long-term wealth, and access
                global markets. Yet there is still no standard way to transform that
                activity into a recognized financial credential.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {whyNowStats.map((item) => (
                <div key={item.region} className="passport-card p-6">
                  <p className="text-xs text-secondary uppercase tracking-wider mb-1">
                    {item.region}
                  </p>
                  <p className="text-3xl font-bold font-heading text-accent mb-1">
                    {item.stat}
                  </p>
                  <p className="text-sm text-accent-70">{item.label}</p>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* ─────────────── 4. SOLUTION ─────────────── */}
        <FadeIn className="border-none">
          <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28 bg-[#5271ff]/5">
            <div className="max-w-3xl mb-12">
              <p className="text-xs text-accent uppercase tracking-[0.15em] font-semibold mb-3 font-heading">
                The Solution
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-accent mb-4">
                Introducing
                <br />
                Credence.
              </h2>
              <p className="text-secondary leading-relaxed max-w-2xl">
                A privacy-preserving credential that proves financial health without
                revealing balances, wallets, or transaction history. Using Zero-Knowledge
                proofs, users can demonstrate financial credibility while keeping their
                data private.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {solutionCapabilities.map((cap) => (
                <div key={cap.label} className="passport-card p-5 flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-success-20 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-accent">{cap.label}</p>
                    <p className="text-xs text-secondary">{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* ─────────────── 5. HOW IT WORKS ─────────────── */}
        <FadeIn className="border-none">
          <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 sm:py-28 bg-[#5271ff]/10">
            <div className="max-w-3xl mb-12">
              <p className="text-xs text-accent uppercase tracking-[0.15em] font-semibold mb-3 font-heading">
                Flow
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-accent mb-4">
                How It Works.
              </h2>
              <p className="text-secondary leading-relaxed max-w-2xl">
                From wallet connection to credential issuance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connecting line (desktop) */}
              {/* <div
                className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px"
                style={{ background: 'var(--border-color)' }}
              /> */}

              {howItWorks.map((step) => (
                <li key={step.num} className="group relative flex flex-col items-center text-center">
                  <div className="relative z-10 mb-5">
                    <div className="flex size-16 items-center justify-center bg-[#5271ff]/10 rounded-2xl border border-[#5271ff]/20 bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-accent/40 group-hover:shadow-lg group-hover:shadow-accent/10">
                      <step.Icon className="size-6 text-accent" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <span className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-accent font-heading text-xs font-bold text-accent-foreground shadow-md">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="font-heading text-lg font-semibold text-[#5271ff]">{step.label}</h3>
                  <p className="mt-2 max-w-[16rem] text-pretty text-sm leading-relaxed text-secondary">
                    {step.desc}
                  </p>
                </li>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* ─────────────── 6. FINANCIAL HEALTH ─────────────── */}
        <FadeIn className="border-none">
          <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28 bg-[#5271ff]/5">
            <div className="max-w-3xl mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-accent mb-4">
                Financial Reputation,
                <br />
                Not Just Portfolio Value.
              </h2>
              <p className="text-secondary leading-relaxed max-w-2xl">
                Credence can evaluates a broader
                picture of financial health, all while preserving user privacy.
                This transforms crypto activity into a meaningful reputation layer.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {healthCapabilities.map((cap) => (
                <div key={cap} className="passport-card p-4 flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-success-20 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span className="text-sm text-primary-50">{cap}</span>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* ─────────────── 7. LENDER VIEW ─────────────── */}
        <FadeIn className="border-none">
          <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28 bg-[#5271ff]/10">
            <div className="max-w-3xl mb-12">
              <p className="text-xs text-accent uppercase tracking-[0.15em] font-semibold mb-3 font-heading">
                Transparency Without Exposure
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-accent mb-4">
                What The Lender Sees.
              </h2>
              <p className="text-secondary leading-relaxed max-w-2xl">
                The lender receives a verified credential, not access to your
                financial data. Zero-Knowledge proofs ensure that only the
                minimum necessary information is revealed.
              </p>
            </div>
            <LenderViewComparison />
          </section>
        </FadeIn>

        {/* ─────────────── 8. MISSION ─────────────── */}
        <FadeIn className="border-none">
          <section className="max-w-6xl mx-auto px-6 py-20 sm:py-28 text-center bg-[#5271ff]/5">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-accent mb-6">
              Bridging Crypto Wealth
              <br />
              And Real-World Credit.
            </h2>
            <p className="text-secondary leading-relaxed max-w-2xl mx-auto mb-6">
              Crypto has created a new class of financially responsible users. The
              problem is not that they lack assets. The problem is that traditional
              systems cannot see them.
            </p>
            <p className="text-secondary leading-relaxed max-w-2xl mx-auto mb-10">
              Credence gives crypto holders a way to prove financial
              credibility while maintaining ownership of their privacy.
            </p>

            <div
              className="inline-block px-8 py-5 rounded-2xl mb-10"
              style={{
                background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
                border: '1px solid var(--border-color)',
              }}
            >
              <p className="text-lg font-heading font-bold text-accent italic">
                &ldquo;You&rsquo;ve already built financial credibility.
                <br />
                The system just doesn&rsquo;t see it yet.&rdquo;
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="px-8 py-3.5 rounded-full bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-all"
              >
                Generate Passport
              </Link>
            </div>
          </section>
        </FadeIn>
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

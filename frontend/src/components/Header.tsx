'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { StellarWalletButton } from '@/components/StellarWalletButton';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePathname } from 'next/navigation'

export function Header() {
    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = useState(false)

    const closeMenu = () => setMenuOpen(false)

    return (
        <header className="sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 py-4 flex items-center justify-between bg-[var(--accent)]/10 backdrop-blur-md">
            <Link href="/" className="flex items-center gap-2 shrink-0">
                <Image src="/Credence.png" alt="Credence" width={40} height={40} className="w-8 h-8" />
                <span className="text-lg font-bold font-heading text-accent">Credence</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-3">
                {
                    pathname !== '/dashboard' &&
                    <Link href="/dashboard" className="text-sm font-medium text-accent hover:scale-105 hover:font-semibold">Dashboard</Link>
                }
                <StellarWalletButton />
                <GoogleSignInButton />
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
            <div className="lg:hidden border-t border-default bg-[var(--accent)]/10 backdrop-blur-md px-4 py-4 space-y-3 shadow-lg">
                {pathname !== '/dashboard' && (
                <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="block text-sm font-medium text-accent hover:bg-[var(--accent)]/10 px-3 py-2 rounded-md"
                >
                    Dashboard
                </Link>
                )}
                <div className="px-3 py-2">
                    <StellarWalletButton />
                </div>
                <div className="px-3 py-2">
                    <GoogleSignInButton />
                </div>
                <div className="flex items-center gap-3 px-3 py-2">
                    <ThemeToggle />
                </div>
            </div>
            )}
        </header>
    )
}

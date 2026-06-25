import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Credence | Onchain Financial Identity',
  description: 'Prove your onchain portfolio value and history. Privately. On Stellar.',
  icons: [{ rel: 'icon', url: '/Credence.png' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className=" text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

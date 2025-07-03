import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { UIStringsProvider } from '../contexts/UIStringsContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CivicSense',
  description: 'Transform from passive observer to confident participant in democracy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UIStringsProvider>
          {children}
        </UIStringsProvider>
      </body>
    </html>
  );
} 
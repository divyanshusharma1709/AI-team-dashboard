import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Link from 'next/link';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Team Management Dashboard',
  description: 'AI-powered team operations dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
        <Providers>
          <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-main)]">
            <div className="pointer-events-none fixed inset-0 -z-10">
              <div className="absolute left-[-8rem] top-[-4rem] h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
              <div className="absolute right-[-8rem] top-20 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
            </div>

            <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur">
              <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Team Dashboard
                </Link>
                <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-slate-500 sm:gap-2 sm:text-sm">
                  <Link href="/" className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-slate-900">Dashboard</Link>
                  <Link href="/tasks" className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-slate-900">Tasks</Link>
                  <Link href="/employees" className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-slate-900">Employees</Link>
                  <Link href="/meetings" className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-slate-900">Meetings</Link>
                  <Link href="/agent" className="rounded-md bg-slate-900 px-2 py-1 text-white transition hover:bg-slate-700">AI Copilot</Link>
                </div>
              </div>
            </nav>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

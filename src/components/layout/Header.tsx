"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/loan-interest-calculator",  label: "대출이자" },
  { href: "/amortization-calculator",   label: "원리금상환" },
  { href: "/jeonse-loan-calculator",    label: "전세대출" },
  { href: "/prepayment-calculator",     label: "중도상환" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-15">
        <div className="flex items-center justify-between h-15 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
            <span className="text-2xl">💰</span>
            <span className="font-black text-lg text-slate-900 tracking-tight">
              머니<span className="text-brand-600">계산기</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors
                  ${pathname === n.href
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Toggle */}
          <button onClick={() => setOpen(!open)} aria-label="메뉴"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">
            {open
              ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            }
          </button>
        </div>

        {/* Mobile Nav */}
        {open && (
          <nav className="md:hidden py-2 border-t border-slate-100 space-y-0.5 pb-3">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors
                  ${pathname === n.href
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-700 hover:bg-slate-50"}`}>
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

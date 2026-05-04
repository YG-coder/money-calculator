"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const NAV_GROUPS = [
  {
    label: "대출 계산기",
    baseHref: "/loan",
    items: [
      { href: "/loan-interest-calculator", label: "대출이자 계산기" },
      { href: "/amortization-calculator",  label: "원리금상환 계산기" },
      { href: "/jeonse-loan-calculator",   label: "전세대출 계산기" },
      { href: "/prepayment-calculator",    label: "중도상환 계산기" },
    ],
  },
  {
    label: "부동산 계산기",
    baseHref: "/real-estate",
    items: [
      { href: "/real-estate/acquisition-tax-calculator", label: "취득세 계산기" },
      { href: "/real-estate/jeonse-vs-wolse-calculator", label: "월세 vs 전세 계산기" },
      { href: "/real-estate/property-yield-calculator", label: "양도소득세 계산기" },
      { href: "/real-estate/reconstruction-contribution-calculator", label: "재건축 분담금 계산기" },
    ],
  },
  {
    label: "금융 가이드",
    baseHref: "/blog",
    items: [],
  },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [openGroup, setOpenGroup]     = useState<string | null>(null);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileGroup(null);
    setOpenGroup(null);
  }, [pathname]);

  function isGroupActive(group: (typeof NAV_GROUPS)[0]) {
    if (group.items.length === 0) return pathname.startsWith(group.baseHref);
    return (
      group.items.some((i) => pathname === i.href) ||
      pathname === group.baseHref
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-3">

          {/* 로고 */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <span className="text-2xl">💰</span>
            <span className="font-black text-lg text-slate-900 tracking-tight">
              머니<span className="text-brand-600">계산기</span>
            </span>
          </Link>

          {/* 데스크탑 Nav */}
          <nav ref={navRef} className="hidden md:flex items-center gap-1">
            {NAV_GROUPS.map((group) => {
              const active = isGroupActive(group);

              if (group.items.length === 0) {
                return (
                  <Link
                    key={group.label}
                    href={group.baseHref}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors
                      ${active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    {group.label}
                  </Link>
                );
              }

              const isOpen = openGroup === group.label;
              return (
                <div key={group.label} className="relative">
                  <button
                    onClick={() => setOpenGroup(isOpen ? null : group.label)}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors
                      ${active || isOpen
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    {group.label}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-slate-100 shadow-lg py-1.5 z-50">
                      <Link
                        href={group.baseHref}
                        className={`block px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors
                          ${pathname === group.baseHref
                            ? "text-brand-700 bg-brand-50"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
                      >
                        전체 보기
                      </Link>
                      <div className="my-1 border-t border-slate-100" />
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block px-4 py-2.5 text-sm font-medium transition-colors
                            ${pathname === item.href
                              ? "text-brand-700 bg-brand-50"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* 모바일 토글 */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="메뉴"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          >
            {mobileOpen
              ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            }
          </button>
        </div>

        {/* 모바일 Nav */}
        {mobileOpen && (
          <nav className="md:hidden py-2 border-t border-slate-100 space-y-0.5 pb-3">
            {NAV_GROUPS.map((group) => {
              if (group.items.length === 0) {
                return (
                  <Link
                    key={group.label}
                    href={group.baseHref}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors
                      ${pathname.startsWith(group.baseHref)
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    {group.label}
                  </Link>
                );
              }

              const isExpanded = mobileGroup === group.label;
              return (
                <div key={group.label}>
                  <button
                    onClick={() => setMobileGroup(isExpanded ? null : group.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors
                      ${isGroupActive(group)
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <span>{group.label}</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-brand-100 pl-3">
                      <Link
                        href={group.baseHref}
                        className="block px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        전체 보기
                      </Link>
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            ${pathname === item.href
                              ? "text-brand-700 bg-brand-50"
                              : "text-slate-600 hover:bg-slate-50"}`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}

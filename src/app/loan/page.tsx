// src/app/loan/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  slug: "loan",
  title: "대출 계산기 — 이자·원리금·전세대출·중도상환",
  description:
    "대출이자 계산기, 원리금균등·원금균등 상환 계산기, 전세대출 계산기, 중도상환 계산기를 무료로 이용하세요.",
  keywords: ["대출계산기", "대출이자계산기", "원리금균등상환", "전세대출계산기"],
});

const LOAN_CALCS = [
  {
    title: "대출이자 계산기",
    desc: "원금·금리·기간을 입력하면 월 이자와 총 이자를 즉시 계산합니다. 만기일시상환 기준.",
    href: "/loan-interest-calculator",
    icon: "🏦",
    badge: "인기",
  },
  {
    title: "원리금상환 계산기",
    desc: "원리금균등·원금균등 방식별 월 납입금과 전체 상환 스케줄을 비교합니다.",
    href: "/amortization-calculator",
    icon: "📊",
    badge: null,
  },
  {
    title: "전세대출 계산기",
    desc: "전세 보증금·금리·LTV를 입력하면 대출 한도, 월 이자, 자기 부담금을 계산합니다.",
    href: "/jeonse-loan-calculator",
    icon: "🏠",
    badge: null,
  },
  {
    title: "중도상환 계산기",
    desc: "중도상환 수수료와 절약 이자를 비교해 지금 갚는 것이 실제로 이득인지 확인합니다.",
    href: "/prepayment-calculator",
    icon: "💸",
    badge: null,
  },
];

export default function LoanPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 px-4 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-brand-300">
            <a href="/" className="hover:text-white transition-colors">홈</a>
            <span>›</span>
            <span className="font-semibold text-white">대출 계산기</span>
          </nav>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-200">
            무료 대출 계산기
          </p>
          <h1 className="mb-3 text-3xl font-black leading-tight md:text-4xl">
            대출 계산기
          </h1>
          <p className="max-w-xl text-base text-brand-100">
            이자·상환·전세·중도상환까지 대출 관련 계산기를 한 곳에서 이용하세요.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-black text-slate-800">전체 대출 계산기</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LOAN_CALCS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:border-brand-200 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <span className="text-3xl">{c.icon}</span>
                {c.badge && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">
                    {c.badge}
                  </span>
                )}
              </div>
              <h3 className="mb-1.5 font-black text-slate-900 transition-colors group-hover:text-brand-600">
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">{c.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-center">
          <p className="mb-2 text-sm font-bold text-slate-800">
            💡 어떤 계산기부터 써야 할지 모르겠다면
          </p>
          <p className="mb-3 text-sm text-slate-600">
            대출 계획이 있다면 대출이자 계산기부터, 상환 방식이 궁금하다면
            원리금상환 계산기를 먼저 이용해보세요.
          </p>
          <Link
            href="/loan-interest-calculator"
            className="inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            대출이자 계산기 바로가기 →
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="mb-1 text-sm font-bold text-slate-800">
              🏠 부동산 매매 준비 중이신가요?
            </p>
            <p className="mb-4 text-sm text-slate-500">
              취득세 계산기와 월세 vs 전세 비교 계산기도 함께 이용해 보세요.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/real-estate/acquisition-tax-calculator"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                취득세 계산기 →
              </Link>
              <Link
                href="/real-estate/jeonse-vs-wolse-calculator"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                월세 vs 전세 계산기 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

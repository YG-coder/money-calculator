// src/app/real-estate/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  slug: "real-estate",
  title: "부동산 계산기 — 취득세·월세 vs 전세·수익률",
  description:
      "부동산 매매·임대 의사결정에 필요한 계산기를 모아뒀습니다. 취득세 계산기, 월세 vs 전세 비교 계산기, 부동산 수익률 계산기를 무료로 이용하세요.",
  keywords: [
    "부동산계산기",
    "취득세계산기",
    "전세월세비교",
    "부동산수익률계산기",
    "월세수익률",
  ],
});

const CALCS = [
  {
    title: "취득세 계산기",
    desc: "주택 취득가액과 보유 주택 수를 입력하면 취득세·농특세·지방교육세 합계를 계산합니다.",
    href: "/real-estate/acquisition-tax-calculator",
    icon: "🏠",
  },
  {
    title: "월세 vs 전세 계산기",
    desc: "전세 보증금의 기회비용과 월세 총 비용을 비교해 어떤 선택이 유리한지 계산합니다.",
    href: "/real-estate/jeonse-vs-wolse-calculator",
    icon: "⚖️",
  },
  {
    title: "부동산 수익률 계산기",
    desc: "매입가, 보증금, 월세, 대출 이자, 월 비용을 기준으로 예상 임대수익률을 계산합니다.",
    href: "/real-estate/property-yield-calculator",
    icon: "📈",
  },
  {
    title: "재건축 분담금 계산기",
    desc: "권리가액, 종후자산가액, 비례율 등을 기준으로 예상 재건축 조합원 분담금을 계산합니다.",
    href: "/real-estate/reconstruction-contribution-calculator",
    icon: "🏗️",
  },
];

export default function RealEstatePage() {
  return (
      <>
        <section className="bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 px-4 py-14 text-white">
          <div className="mx-auto max-w-4xl">
            <nav className="mb-4 flex items-center gap-1.5 text-xs text-brand-300">
              <Link href="/" className="transition-colors hover:text-white">
                홈
              </Link>
              <span>›</span>
              <span className="font-semibold text-white">부동산 계산기</span>
            </nav>

            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-200">
              부동산 의사결정 플랫폼
            </p>

            <h1 className="mb-3 text-3xl font-black leading-tight md:text-4xl">
              부동산 계산기
            </h1>

            <p className="max-w-xl text-base text-brand-100">
              매매·임대·수익률 관련 부동산 계산기를 한 곳에서 이용하세요.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-black text-slate-800">
            전체 부동산 계산기
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CALCS.map((c) => (
                <Link
                    key={c.href}
                    href={c.href}
                    className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:border-brand-200 hover:shadow-md"
                >
                  <span className="mb-3 block text-3xl">{c.icon}</span>

                  <h2 className="mb-1.5 font-black text-slate-900 transition-colors group-hover:text-brand-600">
                    {c.title}
                  </h2>

                  <p className="text-sm leading-relaxed text-slate-500">
                    {c.desc}
                  </p>
                </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-100 bg-slate-50 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="mb-1 text-sm font-bold text-slate-800">
                🏦 대출 관련 계산도 함께 확인하세요
              </p>

              <p className="mb-4 text-sm text-slate-500">
                부동산 매매 시 대출이자·원리금·전세대출 등 대출 계산기도 함께 이용할 수 있습니다.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                    href="/loan-interest-calculator"
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  대출이자 계산기 →
                </Link>

                <Link
                    href="/jeonse-loan-calculator"
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  전세대출 계산기 →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
  );
}
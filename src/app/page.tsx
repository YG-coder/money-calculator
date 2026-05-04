// src/app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";
import { blogPosts } from "@/data/blogPosts";

export const metadata: Metadata = buildMetadata({
  title: "머니계산기 | 대출·부동산 무료 금융 계산기",
  description:
    "대출이자·원리금·전세대출·중도상환·취득세·월세 vs 전세 계산기를 무료로 이용하세요. 복잡한 금융·부동산 계산을 쉽고 빠르게.",
});

const QUICK_CALCS = [
  {
    title: "대출이자 계산기",
    desc: "대출 원금·금리·기간으로 월 이자와 총 이자를 바로 계산",
    href: "/loan-interest-calculator",
    icon: "🏦",
    badge: "인기",
  },
  {
    title: "원리금상환 계산기",
    desc: "월 상환액과 총 이자를 상환 방식별로 비교",
    href: "/amortization-calculator",
    icon: "📊",
    badge: "추천",
  },
  {
    title: "취득세 계산기",
    desc: "주택 취득 시 예상 세금을 빠르게 계산",
    href: "/real-estate/acquisition-tax-calculator",
    icon: "🏠",
    badge: "신규",
  },
  {
    title: "월세 vs 전세 계산기",
    desc: "전세와 월세의 실질 비용을 비교",
    href: "/real-estate/jeonse-vs-wolse-calculator",
    icon: "⚖️",
    badge: "신규",
  },
];

const POPULAR = [
  {
    title: "대출이자 계산기",
    desc: "원금·금리·기간으로 월 이자, 총 이자를 즉시 계산",
    href: "/loan-interest-calculator",
    icon: "🏦",
    badge: "인기",
  },
  {
    title: "취득세 계산기",
    desc: "주택 취득세·농특세·지방교육세를 한번에 계산",
    href: "/real-estate/acquisition-tax-calculator",
    icon: "🏠",
    badge: "신규",
  },
  {
    title: "월세 vs 전세 계산기",
    desc: "전세 vs 월세 실질 비용을 기회비용 기준으로 비교",
    href: "/real-estate/jeonse-vs-wolse-calculator",
    icon: "⚖️",
    badge: "신규",
  },
  {
    title: "원리금상환 계산기",
    desc: "균등·원금 방식 비교, 월별 상환 스케줄 확인",
    href: "/amortization-calculator",
    icon: "📊",
    badge: null,
  },
];

const LOAN_CALCS = [
  {
    title: "대출이자 계산기",
    desc: "원금·금리·기간으로 월 이자, 총 이자를 즉시 계산",
    href: "/loan-interest-calculator",
    icon: "🏦",
  },
  {
    title: "원리금상환 계산기",
    desc: "균등·원금 방식 비교, 월별 상환 스케줄 확인",
    href: "/amortization-calculator",
    icon: "📊",
  },
  {
    title: "전세대출 계산기",
    desc: "대출 한도·월 이자·DTI 비율 한번에 계산",
    href: "/jeonse-loan-calculator",
    icon: "🏠",
  },
  {
    title: "중도상환 계산기",
    desc: "수수료 제하고 실질 이득이 있는지 확인",
    href: "/prepayment-calculator",
    icon: "💸",
  },
];

const REALESTATE_CALCS = [
  {
    title: "취득세 계산기",
    desc: "주택 가격·보유 수에 따른 취득세·농특세·지방교육세 계산",
    href: "/real-estate/acquisition-tax-calculator",
    icon: "🏠",
    badge: "신규",
  },
  {
    title: "월세 vs 전세 계산기",
    desc: "전세 보증금 기회비용 vs 월세 실질 비용 비교",
    href: "/real-estate/jeonse-vs-wolse-calculator",
    icon: "⚖️",
    badge: "신규",
  },
  {
    title: "부동산 수익률 계산기",
    desc: "매입가·보증금·월세·대출 이자를 반영해 월 순수익과 수익률 계산",
    href: "/real-estate/property-yield-calculator",
    icon: "📈",
    badge: "신규",
  },
  {
    title: "재건축 분담금 계산기",
    desc: "권리가액·종후자산가액·비례율 기준 예상 분담금 계산",
    href: "/real-estate/reconstruction-contribution-calculator",
    icon: "🏗️",
    badge: "신규",
  },
];

const latestPosts = blogPosts
  .filter((post) => post.published !== false)
  .slice(0, 3);

const HOME_FAQ = [
  {
    q: "계산 결과가 실제 은행과 다를 수 있나요?",
    a: "네, 본 계산기는 참고용이며 실제 금융 상품과 차이가 있을 수 있습니다. 우대금리, 가산금리, 수수료 등이 은행마다 다르므로 최종 결정 전 반드시 해당 금융기관에 확인하세요.",
  },
  {
    q: "입력 데이터가 저장되나요?",
    a: "아니요. 계산기에 입력한 수치는 서버로 전송되지 않으며 브라우저에서만 처리됩니다. 입력값은 URL 파라미터에만 저장되어 공유가 편리합니다.",
  },
  {
    q: "모바일에서도 사용 가능한가요?",
    a: "네, 모든 계산기는 모바일·태블릿·PC에서 동일하게 이용할 수 있습니다.",
  },
  {
    q: "어떤 계산기를 먼저 써볼까요?",
    a: "주택담보대출이나 신용대출 계획 중이라면 대출이자 계산기 → 원리금상환 계산기 순서로 이용하시면 됩니다. 부동산 매매를 앞두고 있다면 취득세 계산기, 전세·월세를 비교하고 싶다면 월세 vs 전세 계산기를 먼저 사용해 보세요.",
  },
];

function CalcCard({
  title,
  desc,
  href,
  icon,
  badge,
}: {
  title: string;
  desc: string;
  href: string;
  icon: string;
  badge?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:border-brand-200 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="text-3xl">{icon}</span>
        {badge && (
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mb-1.5 font-black text-slate-900 transition-colors group-hover:text-brand-600">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
    </Link>
  );
}

export default function Page() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-200">
            무료 금융·부동산 계산기
          </p>
          <h1 className="mb-4 text-3xl font-black leading-tight md:text-5xl">
            복잡한 금융 계산,
            <br />
            쉽고 빠르게
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-base text-brand-100 md:text-xl">
            대출이자·원리금·전세대출·중도상환·취득세·월세 vs 전세 계산을 무료로.
            <br className="hidden md:block" />
            입력하면 즉시 결과를 확인할 수 있어요.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/loan-interest-calculator"
              className="rounded-xl bg-white px-6 py-3 font-bold text-brand-700 shadow-lg transition hover:bg-brand-50"
            >
              대출이자 계산하기 →
            </Link>
            <Link
              href="/real-estate/acquisition-tax-calculator"
              className="rounded-xl border border-brand-400 bg-brand-500 px-6 py-3 font-bold text-white transition hover:bg-brand-400"
            >
              취득세 계산하기 →
            </Link>
          </div>
        </div>
      </section>

      {/* 빠른 실행 */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">
            지금 바로 계산하기
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            가장 많이 찾는 계산기를 빠르게 이용해보세요.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_CALCS.map((c) => (
            <CalcCard key={c.href} {...c} />
          ))}
        </div>
      </section>

      {/* 인기 계산기 */}
      <section className="border-t border-slate-100 bg-slate-50 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-black text-slate-800">
            인기 계산기
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR.map((c) => (
              <CalcCard key={c.href} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* 대출 계산기 섹션 */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800">대출 계산기</h2>
            <p className="mt-1 text-sm text-slate-500">
              대출 조건을 입력하고 월 상환액과 총 이자를 확인하세요
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {LOAN_CALCS.map((c) => (
              <CalcCard key={c.href} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* 부동산 계산기 섹션 */}
      <section className="border-t border-slate-100 bg-slate-50 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800">부동산 계산기</h2>
            <p className="mt-1 text-sm text-slate-500">
              매매·임대 의사결정에 필요한 부동산 계산기
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {REALESTATE_CALCS.map((c) => (
              <CalcCard key={c.href} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* 최신 금융 가이드 */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800">
              최신 금융 가이드
            </h2>
            <Link
              href="/blog"
              className="text-sm font-semibold text-brand-600 hover:underline"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {latestPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:border-brand-200 hover:shadow-md"
              >
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-600">
                  {post.category}
                </span>
                <h3 className="mt-3 mb-1.5 text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand-600">
                  {post.title}
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-slate-500">
                  {post.description}
                </p>
                <p className="text-xs text-slate-300">{post.date}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 홈 FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-black text-slate-800">
          자주 묻는 질문
        </h2>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: HOME_FAQ.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
        <div className="space-y-3">
          {HOME_FAQ.map((item, i) => (
            <details
              key={i}
              className="group overflow-hidden rounded-xl border border-slate-100 bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50">
                <span>Q. {item.q}</span>
                <svg
                  className="ml-3 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="border-t border-slate-50 px-5 pt-3 pb-4 text-sm leading-relaxed text-slate-600">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* 신뢰 안내 */}
      <section className="py-10">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
            <p className="mb-2 text-xs text-slate-400">🔒 개인정보 보호</p>
            <p className="text-sm font-semibold text-slate-800">
              입력한 계산 값은 서버에 저장되지 않습니다
            </p>
            <p className="mt-1 text-xs text-slate-500">
              모든 계산은 브라우저에서 바로 처리되며 별도의 회원가입 없이 이용할
              수 있습니다.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

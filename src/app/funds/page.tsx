// src/app/funds/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  slug: "funds",
  title: "자금계획 계산기 — 필요한 돈과 마련 가능한 돈",
  description:
    "생활에 필요한 현금과 지금 마련할 수 있는 금액의 차이를 계산합니다. 월 잉여자금 계산기로 매달 남는 돈과 연간 환산 금액을 확인하세요. 저축액이나 소비 수준을 권하지 않고 금액만 계산합니다.",
  keywords: [
    "자금계획계산기",
    "월잉여자금계산기",
    "생활비계산",
    "가계수지계산",
    "필요자금계산",
  ],
});

const FUNDS_CALCS = [
  {
    title: "월 잉여자금 계산기",
    desc: "월 소득과 7개 지출 항목으로 매달 남는 금액과 연간 환산 금액을 계산합니다.",
    href: "/funds/monthly-surplus",
    icon: "🧮",
  },
];

export default function Page() {
  return (
    <>
      <section className="bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 px-4 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-brand-300">
            <Link href="/" className="transition-colors hover:text-white">
              홈
            </Link>
            <span>›</span>
            <span className="font-semibold text-white">자금계획</span>
          </nav>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-200">
            무료 자금계획 계산기
          </p>
          <h1 className="mb-3 text-3xl font-black leading-tight md:text-4xl">
            자금계획 계산기
          </h1>
          <p className="max-w-xl text-base text-brand-100">
            앞으로 필요한 돈과 지금 마련할 수 있는 돈의 차이를 계산합니다.
            금액만 계산하며 저축이나 소비 수준을 권하지 않습니다.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-xl font-black text-slate-800">
          전체 자금계획 계산기
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FUNDS_CALCS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:border-brand-200 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <span className="text-3xl">{c.icon}</span>
              </div>
              <h3 className="mb-1.5 font-black text-slate-900 transition-colors group-hover:text-brand-600">
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14 text-[15px] leading-relaxed text-slate-600 sm:px-6">
          <h2 className="mb-4 text-2xl font-black text-slate-900">
            다른 계산기와 무엇이 다른가
          </h2>
          <p className="mb-4">
            머니계산기의 다른 영역이 이미 정해진 거래의 금액을 다룬다면,
            자금계획은 <strong className="text-slate-900">아직 실행하지 않은
            일에 필요한 현금</strong>을 다룹니다. 같은 금액이라도 어느 질문에
            답하는지가 다릅니다.
          </p>

          <div className="mb-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 p-3 text-left">영역</th>
                  <th className="border border-slate-200 p-3 text-left">
                    다루는 돈
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 p-3 font-semibold text-slate-800">
                    대출
                  </td>
                  <td className="border border-slate-200 p-3">
                    빌리는 돈과 갚는 돈
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-3 font-semibold text-slate-800">
                    부동산
                  </td>
                  <td className="border border-slate-200 p-3">
                    거래·주거·운용에 드는 돈
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-3 font-semibold text-slate-800">
                    금융
                  </td>
                  <td className="border border-slate-200 p-3">
                    금융상품에 넣었을 때 달라지는 금액
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-3 font-semibold text-slate-800">
                    자금계획
                  </td>
                  <td className="border border-slate-200 p-3">
                    생활에 필요한 현금과 마련 가능한 금액
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="mb-4 text-2xl font-black text-slate-900">
            결과를 어떻게 읽어야 하나
          </h2>
          <p className="mb-4">
            계산 결과는 입력한 금액으로만 만든 참고값입니다. 이 사이트는 얼마를
            모으라거나 어떤 지출을 줄이라고 권하지 않습니다. 금액과 그 금액이
            나온 계산식만 보여 주고, 판단은 이용자에게 맡깁니다.
          </p>
          <p className="mb-4">
            목표 금액을 정해 두고 매달 얼마씩 모아야 하는지 역산하려면{" "}
            <Link
              href="/finance/goal-savings"
              className="font-semibold text-brand-600 underline underline-offset-2"
            >
              목표 저축 계산기
            </Link>
            를 이용하세요. 금융상품의 이자까지 반영해 계산합니다.
          </p>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  slug: "about",
  title: "소개 — 머니계산기",
  description:
    "머니계산기는 대출이자, 원리금 상환, 전세대출 등 금융 계산을 쉽게 할 수 있도록 제공하는 무료 서비스입니다.",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-black text-slate-900">
        머니계산기 소개
      </h1>
      <p className="mb-8 text-sm text-slate-400">머니계산기.kr</p>

      <div className="space-y-6 rounded-2xl border border-slate-100 bg-white p-8 text-sm leading-relaxed text-slate-600 shadow-sm">
        <p>
          <strong className="text-slate-900">머니계산기(머니계산기.kr)</strong>
          는 대출이자, 원리금 상환, 전세대출, 중도상환 등 복잡한 금융 계산을
          누구나 쉽게 이해할 수 있도록 돕기 위해 만들어진 무료 서비스입니다.
        </p>

        <p>
          많은 사람들이 금융 상품을 이용할 때 금리와 조건을 제대로 비교하지 않고
          선택하는 경우가 많습니다. 이로 인해 수백만 원 이상의 불필요한 비용이
          발생할 수 있습니다.
        </p>

        <p>
          머니계산기는 이러한 문제를 해결하기 위해 만들어졌으며, 간단한
          입력만으로 실제 부담 금액을 직관적으로 확인할 수 있도록
          설계되었습니다.
        </p>

        <div>
          <h2 className="mb-3 text-base font-bold text-slate-800">제공 기능</h2>

          <ul className="space-y-2">
            {[
              [
                "🏦",
                "대출이자 계산기",
                "만기일시상환 기준 월 이자 및 총 이자 계산",
              ],
              [
                "📊",
                "원리금상환 계산기",
                "원리금균등·원금균등 방식 비교 및 상환 스케줄 확인",
              ],
              [
                "🏠",
                "전세대출 계산기",
                "대출 한도, 월 이자, 소득 대비 부담 비율 계산",
              ],
              ["💸", "중도상환 계산기", "수수료를 포함한 실제 절약 금액 계산"],
            ].map(([icon, title, desc]) => (
              <li key={title} className="flex items-start gap-3">
                <span className="shrink-0 text-lg">{icon}</span>
                <div>
                  <span className="font-semibold text-slate-800">{title}</span>
                  <span className="ml-2 text-slate-400">{desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 🔥 신뢰 요소 (애드센스 핵심) */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
          <h3 className="mb-2 text-sm font-bold text-slate-800">
            🔒 개인정보 보호
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            모든 계산은 사용자의 브라우저에서 처리되며 입력 데이터는 서버로
            전송되지 않습니다. 별도의 회원가입이나 개인정보 입력 없이 안전하게
            이용할 수 있습니다.
          </p>
        </div>

        {/* 🔥 CTA (CTR 유도) */}
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
          <p className="mb-2 text-sm font-bold text-slate-800">
            💡 금융 계산, 지금 바로 확인해보세요
          </p>
          <p className="mb-3 text-sm text-slate-600">
            실제 숫자로 계산해 보면 예상보다 큰 차이를 확인할 수 있습니다.
          </p>

          <a
            href="/loan-interest-calculator"
            className="block rounded-xl bg-slate-900 py-3 text-center text-sm font-bold text-white hover:bg-slate-800"
          >
            👉 대출이자 계산기 바로가기
          </a>
        </div>

        {/* 🔥 법적 문구 */}
        <p className="border-t border-slate-100 pt-2 text-xs text-slate-400">
          ※ 본 사이트에서 제공하는 계산 결과는 참고용이며 실제 금융 상품과
          차이가 있을 수 있습니다. 중요한 금융 의사결정은 반드시 금융기관과 상담
          후 진행하시기 바랍니다.
        </p>
      </div>
    </div>
  );
}

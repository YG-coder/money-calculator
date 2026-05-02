// src/app/about/page.tsx
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  slug: "about",
  title: "소개 — 머니계산기",
  description:
      "머니계산기는 대출이자, 원리금 상환, 전세대출, 취득세, 양도세 등 금융·부동산 계산을 쉽게 할 수 있도록 제공하는 무료 서비스입니다.",
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
            는 대출이자, 원리금 상환, 전세대출, 부동산 세금 등 복잡한 금융 계산을
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

          {/* 기능 목록 */}
          <div>
            <h2 className="mb-3 text-base font-bold text-slate-800">제공 기능</h2>

            <ul className="space-y-2">
              {[
                ["🏦", "대출이자 계산기", "만기일시상환 기준 월 이자 및 총 이자 계산"],
                ["📊", "원리금상환 계산기", "원리금균등·원금균등 방식 비교"],
                ["🏠", "전세대출 계산기", "대출 한도 및 월 이자 계산"],
                ["💸", "중도상환 계산기", "수수료 포함 실제 절약 금액 계산"],

                // 🔥 부동산 추가 (핵심 보강)
                ["🏠", "취득세 계산기", "주택 취득 시 세금 계산"],
                ["⚖️", "월세 vs 전세 계산기", "기회비용 기준 실질 비용 비교"],
                ["📐", "양도소득세 계산기", "부동산 매도 시 세금 계산"],
                ["🏗️", "재건축 분담금 계산기", "조합원 예상 분담금 계산"],
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

          {/* 🔒 개인정보 */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
            <h3 className="mb-2 text-sm font-bold text-slate-800">
              🔒 개인정보 보호
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              모든 계산은 사용자의 브라우저에서 처리되며 입력 데이터는 서버로
              전송되지 않습니다. 별도의 회원가입 없이 안전하게 이용할 수 있습니다.
            </p>
          </div>

          {/* 🔥 운영자 정보 (E-E-A-T 핵심) */}
          <div className="rounded-xl border border-slate-100 bg-white p-5">
            <h3 className="mb-2 text-sm font-bold text-slate-800">
              운영자 정보
            </h3>
            <p className="text-xs leading-relaxed text-slate-500">
              운영자: Incomelab
              <br />
              문의: support@머니계산기.kr
              <br />
              오류 제보 및 제휴 문의는 이메일을 통해 연락해주시기 바랍니다.
            </p>
          </div>

          {/* 💡 CTA */}
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

          {/* ⚠️ 책임 한계 (강화됨) */}
          <p className="border-t border-slate-100 pt-2 text-xs text-slate-400">
            ※ 본 사이트에서 제공하는 계산 결과와 정보는 일반적인 금융 정보를
            기반으로 한 참고용 자료입니다. 실제 금리, 세율, 대출 조건은 금융기관 및
            정책에 따라 달라질 수 있으며, 중요한 금융 의사결정은 반드시 해당 기관
            또는 전문가 확인 후 진행하시기 바랍니다.
          </p>
        </div>
      </div>
  );
}
// src/app/jeonse-loan-calculator/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import JeonseLoanCalc from "@/components/calculator/JeonseLoanCalc";

export const metadata: Metadata = buildMetadata({
  slug: "jeonse-loan-calculator",
  title: "전세대출 계산기 — 한도·월 이자·자기 부담금 계산",
  description:
    "전세 보증금, 금리, 기간을 입력하면 전세대출 가능 금액과 월 이자, 자기 부담금을 계산합니다.",
});

const EXAMPLES: CalcExample[] = [
  {
    title: "서울 소형 전세",
    desc: "보증금 3억, LTV 80%, 금리 3.5%, 24개월",
    inputs: [
      { label: "보증금", value: "30,000만원" },
      { label: "금리",   value: "연 3.5%" },
      { label: "기간",   value: "24개월" },
      { label: "LTV",    value: "80%" },
    ],
    results: [
      { label: "대출 금액", value: "2억 4,000만", highlight: true },
      { label: "월 이자",   value: "700,000원" },
      { label: "자기 부담", value: "6,000만" },
    ],
    note: "실제 상품은 보증기관, 소득, 주택 조건에 따라 달라질 수 있습니다.",
  },
  {
    title: "수도권 중형 전세",
    desc: "보증금 2억, LTV 80%, 금리 3.8%, 24개월",
    inputs: [
      { label: "보증금", value: "20,000만원" },
      { label: "금리",   value: "연 3.8%" },
      { label: "기간",   value: "24개월" },
      { label: "LTV",    value: "80%" },
    ],
    results: [
      { label: "대출 금액", value: "1억 6,000만", highlight: true },
      { label: "월 이자",   value: "506,667원" },
      { label: "자기 부담", value: "4,000만" },
    ],
    note: "보증금이 높아질수록 자기 자금과 이자 부담을 함께 고려해야 합니다.",
  },
];

const FAQ = [
  {
    q: "전세대출 한도는 어떻게 결정되나요?",
    a: "보증금, LTV 비율, 소득, 신용, 보증기관 조건 등에 따라 달라집니다. 이 계산기는 단순 참고용 시뮬레이터입니다.",
  },
  {
    q: "전세대출은 왜 월 이자만 계산되나요?",
    a: "전세자금대출은 보통 만기일시상환 방식으로 이자만 납부하고 만기에 원금을 상환하는 구조가 많기 때문입니다.",
  },
  {
    q: "HUG, HF, SGI 차이가 중요한가요?",
    a: "네. 보증기관에 따라 승인 가능 금액과 조건이 달라질 수 있습니다.",
  },
];

export default function JeonseLoanCalculatorPage() {
  return (
    <Suspense>
      <CalcShell
        title="전세대출 계산기"
        description="전세대출 가능 금액과 월 이자, 자기 부담금을 빠르게 계산하세요."
        icon="🏠"
        slug="jeonse-loan-calculator"
        calculator={
          <>
            <JeonseLoanCalc />
            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <p className="mb-2 text-sm font-bold text-slate-800">
                ⚠️ 보증기관 선택에 따라 한도 차이 발생
              </p>
              <p className="mb-3 text-sm text-slate-600">
                HUG, HF, SGI 보증에 따라 금리와 대출 가능 금액이 달라질 수
                있습니다.
              </p>
              <a
                href="/blog/jeonse-loan-hug-hf-sgi"
                className="block rounded-xl bg-slate-900 py-3 text-center font-bold text-white hover:bg-slate-800"
              >
                👉 전세대출 차이 완벽 정리
              </a>
            </div>
          </>
        }
        guide={
          <>
            <p>
              전세대출은 보통 <strong>만기일시상환</strong> 구조로, 계약 기간
              동안 이자만 납부하고 만기에 원금을 상환합니다.
            </p>
            <p>
              보증금이 커질수록 자기 자금과 월 이자 부담을 함께 확인하는 것이
              중요합니다.
            </p>
            <hr className="border-slate-100" />
            <p className="text-slate-400">
              실제 상품 조건은 보증기관(HUG·HF·SGI), 소득, 신용도에 따라 달라질
              수 있습니다.
            </p>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "월세 vs 전세 계산기",  href: "/real-estate/jeonse-vs-wolse-calculator", icon: "⚖️" },
          { label: "대출이자 계산기",       href: "/loan-interest-calculator",               icon: "🏦" },
          { label: "중도상환 계산기",       href: "/prepayment-calculator",                  icon: "💸" },
        ]}
        relatedGuides={[
          { label: "전세대출 보증기관(HUG·HF·SGI) 완벽 정리", href: "/blog/jeonse-loan-hug-hf-sgi" },
          { label: "전세 vs 월세 어떤 게 유리한가",            href: "/blog/jeonse-vs-wolse" },
        ]}
      />
    </Suspense>
  );
}

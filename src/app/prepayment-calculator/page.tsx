// src/app/prepayment-calculator/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import PrepaymentCalc from "@/components/calculator/PrepaymentCalc";

export const metadata: Metadata = buildMetadata({
  slug: "prepayment-calculator",
  title: "중도상환 계산기 — 수수료·실질 이득 계산",
  description:
    "잔여 원금, 중도상환 금액, 금리, 잔여 기간을 입력하면 중도상환 수수료와 실질 이득을 계산합니다.",
});

const EXAMPLES: CalcExample[] = [
  {
    title: "잔여 원금 2억, 일부 중도상환",
    desc: "잔여 원금 2억, 중도상환 5천만, 연 4.5%, 잔여 30개월",
    inputs: [
      { label: "잔여 원금", value: "20,000만원" },
      { label: "상환 금액", value: "5,000만원" },
      { label: "금리",      value: "연 4.5%" },
      { label: "잔여 기간", value: "30개월" },
      { label: "수수료율",  value: "1.2%" },
    ],
    results: [
      { label: "수수료",    value: "60만" },
      { label: "실질 이득", value: "계산값 기준 확인", highlight: true },
    ],
    note: "원리금균등상환 기준의 참고용 계산입니다.",
  },
  {
    title: "수수료 면제 시점 직전 비교",
    desc: "중도상환 수수료가 남아 있다면 절약 이자와 반드시 비교해야 합니다.",
    inputs: [{ label: "포인트", value: "수수료 > 절약 이자 여부 확인" }],
    results: [
      { label: "판단 기준", value: "실질 이득이 +인지 확인", highlight: true },
    ],
    note: "중도상환은 무조건 빠를수록 좋은 것이 아닙니다.",
  },
];

const FAQ = [
  {
    q: "중도상환은 무조건 이득인가요?",
    a: "아니요. 절약되는 이자보다 수수료가 크면 손해일 수 있습니다.",
  },
  {
    q: "중도상환 수수료는 언제까지 발생하나요?",
    a: "일반적으로 대출 실행 후 일정 기간 동안 발생하며, 상품마다 다릅니다. 보통 3년 이내 조건이 많습니다.",
  },
  {
    q: "이 계산기는 어떤 상환 방식을 기준으로 하나요?",
    a: "원리금균등상환 기준의 참고용 계산입니다. 실제 계약 조건과 상환 방식에 따라 결과가 달라질 수 있습니다.",
  },
];

export default function PrepaymentCalculatorPage() {
  return (
    <Suspense>
      <CalcShell
        title="중도상환 계산기"
        description="중도상환 수수료와 실질 이득을 확인해 지금 갚는 것이 유리한지 판단하세요."
        icon="💸"
        slug="prepayment-calculator"
        calculator={
          <>
            <PrepaymentCalc />
            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <p className="mb-2 text-sm font-bold text-slate-800">
                ⚠️ 지금 갚으면 오히려 손해일 수 있습니다
              </p>
              <p className="mb-3 text-sm text-slate-600">
                중도상환 수수료와 절약 이자를 비교하지 않으면 손해를 볼 수
                있습니다.
              </p>
              <a
                href="/blog/prepayment-fee-timing"
                className="block rounded-xl bg-slate-900 py-3 text-center font-bold text-white hover:bg-slate-800"
              >
                👉 중도상환 타이밍 확인
              </a>
            </div>
          </>
        }
        guide={
          <>
            <p>
              중도상환은 대출을 조기 상환해 이자를 줄이는 방법이지만, 수수료가
              발생하면 실제 이득이 줄어들 수 있습니다.
            </p>
            <p>
              따라서 <strong>절약되는 이자 - 수수료</strong>를 기준으로 판단해야
              합니다.
            </p>
            <hr className="border-slate-100" />
            <p className="text-slate-400">
              이 계산기는 원리금균등상환 기준의 참고용 계산입니다.
            </p>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "대출이자 계산기",  href: "/loan-interest-calculator", icon: "🏦" },
          { label: "원리금상환 계산기", href: "/amortization-calculator",  icon: "📊" },
          { label: "전세대출 계산기",  href: "/jeonse-loan-calculator",   icon: "🏠" },
        ]}
        relatedGuides={[
          { label: "중도상환 타이밍 완벽 가이드", href: "/blog/prepayment-fee-timing" },
          { label: "대출 갈아타기 전략",           href: "/blog/loan-refinancing-strategy" },
        ]}
      />
    </Suspense>
  );
}

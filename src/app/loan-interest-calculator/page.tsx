import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import LoanInterestCalc from "@/components/calculator/LoanInterestCalc";

export const metadata: Metadata = buildMetadata({
  slug: "loan-interest-calculator",
  title: "대출이자 계산기 — 월 이자·총 이자 계산",
  description:
    "대출 금액, 금리, 기간을 입력하면 월 이자와 총 이자를 계산합니다. 만기일시상환 기준으로 빠르게 확인하세요.",
});

const EXAMPLES: CalcExample[] = [
  {
    title: "1억 원 1년 대출",
    desc: "1억원, 연 4.0%, 12개월",
    inputs: [
      { label: "원금", value: "10,000만원" },
      { label: "금리", value: "연 4.0%" },
      { label: "기간", value: "12개월" },
    ],
    results: [
      { label: "월 이자", value: "333,333원", highlight: true },
      { label: "총 이자", value: "400만" },
      { label: "만기 총 상환", value: "1억 400만" },
    ],
    note: "만기일시상환 기준으로, 원금은 만기에 한 번에 상환하고 매달 이자만 납부합니다.",
  },
  {
    title: "3억 원 2년 대출",
    desc: "3억원, 연 4.5%, 24개월",
    inputs: [
      { label: "원금", value: "30,000만원" },
      { label: "금리", value: "연 4.5%" },
      { label: "기간", value: "24개월" },
    ],
    results: [
      { label: "월 이자", value: "1,125,000원", highlight: true },
      { label: "총 이자", value: "2,700만" },
      { label: "만기 총 상환", value: "3억 2,700만" },
    ],
    note: "금리가 0.5%p만 낮아져도 총 이자 차이가 커질 수 있습니다.",
  },
];

const FAQ = [
  {
    q: "이 계산기는 어떤 상환 방식을 기준으로 하나요?",
    a: "이 계산기는 만기일시상환 기준입니다. 원금은 만기에 한 번에 상환하고, 기간 동안 매달 이자만 납부하는 구조입니다.",
  },
  {
    q: "원리금균등상환과 결과가 왜 다른가요?",
    a: "원리금균등상환은 원금과 이자를 함께 나누어 갚기 때문에 총 이자와 월 납입액이 달라집니다. 그 경우에는 원리금상환 계산기를 이용하세요.",
  },
  {
    q: "금리 차이가 정말 큰 영향을 주나요?",
    a: "네. 대출 금액이 크거나 기간이 길수록 0.5%p 차이도 수백만 원 이상 차이를 만들 수 있습니다.",
  },
];

export default function LoanInterestCalculatorPage() {
  return (
    <Suspense>
      <CalcShell
        title="대출이자 계산기"
        description="대출 금액과 금리를 입력하면 월 이자와 총 이자를 바로 확인할 수 있습니다."
        icon="🏦"
        slug="loan-interest-calculator"
        calculator={
          <>
            <LoanInterestCalc />

            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <p className="mb-2 text-sm font-bold text-slate-800">
                ⚠️ 금리 0.5% 차이로 수백만 원 손해 가능
              </p>
              <p className="mb-3 text-sm text-slate-600">
                같은 대출 금액이라도 금리에 따라 총 이자는 크게 달라집니다. 지금
                조건이 최선인지 꼭 비교해보세요.
              </p>
              <a
                href="/blog/loan-refinancing-strategy"
                className="block rounded-xl bg-slate-900 py-3 text-center font-bold text-white hover:bg-slate-800"
              >
                👉 금리 낮추는 방법 확인
              </a>
            </div>
          </>
        }
        guide={
          <>
            <p>
              <strong>만기일시상환</strong>: 대출 기간 동안 매달 이자만
              납부하고, 원금은 만기에 한 번에 상환합니다.
            </p>
            <p>
              단기 대출이나 전세대출처럼 이자만 납부하는 구조를 빠르게 계산할 때
              유용합니다.
            </p>
            <hr className="border-slate-100" />
            <p className="text-slate-400">
              원금과 이자를 함께 갚는 방식은 원리금상환 계산기를 이용하세요.
            </p>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
      />
    </Suspense>
  );
}

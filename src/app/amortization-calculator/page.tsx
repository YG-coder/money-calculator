import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import AmortizationCalc from "@/components/calculator/AmortizationCalc";

export const metadata: Metadata = buildMetadata({
  slug: "amortization-calculator",
  title: "원리금상환 계산기 — 원리금균등·원금균등 월 납입금 계산",
  description:
    "원리금균등상환과 원금균등상환의 월 납입금, 총 이자, 월별 상환 스케줄을 비교합니다. 내 소득에 맞는 상환 방식을 선택하세요.",
});

const EXAMPLES: CalcExample[] = [
  {
    title: "주택담보대출 30년 원리금균등",
    desc: "3억원, 연 4.5%, 360개월 원리금균등상환",
    inputs: [
      { label: "원금", value: "30,000만원" },
      { label: "금리", value: "연 4.5%" },
      { label: "기간", value: "360개월 (30년)" },
      { label: "방식", value: "원리금균등" },
    ],
    results: [
      { label: "월 납입액", value: "1,520,060원", highlight: true },
      { label: "총 납입액", value: "5억 4,722만원" },
      { label: "총 이자", value: "2억 4,722만원" },
    ],
    note: "원금의 약 82% 수준의 이자를 30년간 부담할 수 있습니다.",
  },
  {
    title: "같은 조건 원금균등과 비교",
    desc: "3억원, 연 4.5%, 360개월 원금균등상환",
    inputs: [
      { label: "원금", value: "30,000만원" },
      { label: "금리", value: "연 4.5%" },
      { label: "기간", value: "360개월 (30년)" },
      { label: "방식", value: "원금균등" },
    ],
    results: [
      { label: "첫달 납입액", value: "1,958,333원", highlight: true },
      { label: "총 납입액", value: "5억 306만원" },
      { label: "총 이자", value: "2억 306만원" },
    ],
    note: "원리금균등 대비 총 이자를 크게 줄일 수 있지만 초반 부담은 더 큽니다.",
  },
];

const FAQ = [
  {
    q: "원리금균등과 원금균등 중 어떤 게 유리한가요?",
    a: "총 이자만 보면 원금균등 방식이 더 적습니다. 다만 초반 월 납입액이 크기 때문에 소득 여유가 있을 때 적합합니다. 매달 같은 금액으로 관리하려면 원리금균등이 편합니다.",
  },
  {
    q: "30년 주택담보대출 총 이자가 왜 이렇게 많나요?",
    a: "기간이 길수록 이자 누적 부담이 커지기 때문입니다. 같은 금리라도 10년보다 30년이 총 이자가 훨씬 많습니다.",
  },
  {
    q: "상환 기간을 줄이면 얼마나 절약되나요?",
    a: "같은 금리와 원금이라면 30년보다 20년이 총 이자를 크게 줄여줍니다. 대신 월 납입액은 올라갑니다.",
  },
];

export default function AmortizationCalculatorPage() {
  return (
    <Suspense>
      <CalcShell
        title="원리금상환 계산기"
        description="원리금균등·원금균등 방식별 월 납입액과 전체 상환 스케줄을 확인하세요."
        icon="📊"
        slug="amortization-calculator"
        calculator={
          <>
            <AmortizationCalc />

            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <p className="mb-2 text-sm font-bold text-slate-800">
                ⚠️ 상환 방식 선택 잘못하면 수천만 원 차이
              </p>
              <p className="mb-3 text-sm text-slate-600">
                원리금균등과 원금균등 차이를 모르고 선택하면 불필요한 이자를 더
                낼 수 있습니다.
              </p>
              <a
                href="/blog/equal-payment-vs-equal-principal"
                className="block rounded-xl bg-slate-900 py-3 text-center font-bold text-white hover:bg-slate-800"
              >
                👉 상환 방식 완벽 비교
              </a>
            </div>
          </>
        }
        guide={
          <>
            <p>
              <strong>원리금균등</strong>: 매달 같은 금액을 납부합니다. 초반에는
              이자 비중이 높고 후반으로 갈수록 원금 비중이 커집니다.
            </p>
            <p>
              <strong>원금균등</strong>: 매달 갚는 원금은 같고, 이자는 잔액이
              줄어들수록 감소합니다. 초반 부담은 크지만 총 이자는 더 적습니다.
            </p>
            <hr className="border-slate-100" />
            <p className="text-slate-400">
              월 부담을 안정적으로 관리하려면 원리금균등, 총 이자를 줄이려면
              원금균등이 유리한 경우가 많습니다.
            </p>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
      />
    </Suspense>
  );
}

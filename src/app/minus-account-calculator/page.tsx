// src/app/minus-account-calculator/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import MinusAccountCalc from "@/components/calculator/MinusAccountCalc";

export const metadata: Metadata = buildMetadata({
  slug: "minus-account-calculator",
  title: "마이너스통장 이자 계산기 — 사용금액 기준 이자 계산",
  description:
    "마이너스통장은 한도가 아니라 실제 사용금액에만 이자가 붙습니다. 사용금액과 금리를 입력하면 일·월·연 이자와 사용률을 계산합니다.",
  keywords: ["마이너스통장계산기", "마이너스통장이자", "마이너스통장이자계산", "한도대출이자"],
});

const EXAMPLES: CalcExample[] = [
  {
    title: "2,000만원 사용 · 연 6.5%",
    desc: "한도 5,000만원, 사용금액 2,000만원, 연 6.5%, 30일 사용",
    inputs: [
      { label: "사용금액", value: "2,000만원" },
      { label: "금리", value: "연 6.5%" },
      { label: "한도", value: "5,000만원" },
      { label: "사용일수", value: "30일" },
    ],
    results: [
      { label: "일 이자", value: "3,562원", highlight: true },
      { label: "월 예상 이자", value: "108,333원" },
      { label: "30일 기간 이자", value: "106,849원" },
      { label: "사용률", value: "40%" },
    ],
    note: "한도는 5,000만원이지만 이자는 실제 쓴 2,000만원에만 붙습니다. 한도를 늘려도 쓰지 않으면 이자는 늘지 않습니다.",
  },
  {
    title: "1,000만원 사용 · 연 6.0%",
    desc: "한도 3,000만원, 사용금액 1,000만원, 연 6.0%, 20일 사용",
    inputs: [
      { label: "사용금액", value: "1,000만원" },
      { label: "금리", value: "연 6.0%" },
      { label: "한도", value: "3,000만원" },
      { label: "사용일수", value: "20일" },
    ],
    results: [
      { label: "일 이자", value: "1,644원", highlight: true },
      { label: "월 예상 이자", value: "50,000원" },
      { label: "20일 기간 이자", value: "32,877원" },
      { label: "사용률", value: "33.3%" },
    ],
    note: "같은 한도라도 사용금액이 절반이면 이자도 절반입니다. 마이너스통장 이자는 사용금액에 비례합니다.",
  },
];

const FAQ = [
  {
    q: "한도 전체에 이자가 붙나요?",
    a: "아니요. 마이너스통장은 한도가 아니라 실제로 인출·사용한 금액에만 이자가 붙습니다. 한도가 5,000만원이어도 2,000만원만 쓰면 이자는 2,000만원 기준으로만 계산됩니다. 한도를 크게 열어두어도 쓰지 않으면 이자는 발생하지 않습니다.",
  },
  {
    q: "일·월·연 이자는 어떻게 계산되나요?",
    a: "일 이자는 사용금액 × 연이율 ÷ 365, 월 예상 이자는 사용금액 × 연이율 ÷ 12, 연 이자는 사용금액 × 연이율입니다. 마이너스통장은 보통 매일 사용 잔액에 대해 일할(단리)로 이자가 쌓이고 월 단위로 후취됩니다.",
  },
  {
    q: "실제 은행 청구액과 다를 수 있나요?",
    a: "네. 이 계산기는 사용금액과 사용일수가 일정하다고 가정한 참고용 추정치입니다. 실제로는 매일 사용 잔액이 달라지고, 은행별로 일수 계산 기준(365일·실제 일수 등)이 다를 수 있어 청구액과 차이가 날 수 있습니다.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="마이너스통장 이자 계산기"
        description="한도가 아니라 실제 사용금액 기준으로 마이너스통장 이자를 계산하세요."
        icon="🟥"
        slug="minus-account-calculator"
        breadcrumb={[
          { name: "홈", url: BASE_URL },
          { name: "대출 계산기", url: `${BASE_URL}/loan` },
          {
            name: "마이너스통장 이자 계산기",
            url: `${BASE_URL}/minus-account-calculator`,
          },
        ]}
        calculator={<MinusAccountCalc />}
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">
              한도와 사용금액의 차이
            </h2>
            <p>
              마이너스통장은 정해진 <strong>한도</strong> 안에서 자유롭게
              돈을 꺼내 쓰는 대출입니다. 여기서 중요한 건 한도와 실제
              사용금액이 다르다는 점입니다. 한도는 &lsquo;최대 얼마까지 쓸 수
              있는가&rsquo;이고, 사용금액은 &lsquo;지금 실제로 얼마를 쓰고
              있는가&rsquo;입니다. 이자는 한도가 아니라 사용금액을 기준으로
              붙습니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              왜 사용금액에만 이자가 붙는가
            </h2>
            <p>
              일반 대출은 받는 순간 원금 전체에 이자가 시작되지만,
              마이너스통장은 통장 잔액이 마이너스로 내려간 금액,
              즉 실제로 꺼내 쓴 금액에만 이자가 발생합니다. 그래서 한도를
              크게 열어두어도 쓰지 않으면 이자는 0원입니다. 반대로 사용금액이
              늘면 그만큼 이자도 비례해서 늘어납니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              일할(단리) 계산 방식
            </h2>
            <p>
              마이너스통장 이자는 보통 매일 사용 잔액에 대해 일할로 계산됩니다.
              하루치 이자는 사용금액 × 연이율 ÷ 365이고, 이렇게 쌓인 이자가
              월 단위로 통장에서 빠져나갑니다. 이 계산기는 사용금액이
              일정하다고 가정해 일·월·연 이자를 보여주며, 사용일수를 입력하면
              해당 기간 동안의 이자도 확인할 수 있습니다.
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>일 이자 = 사용금액 × 연이율 ÷ 365</li>
              <li>월 예상 이자 = 사용금액 × 연이율 ÷ 12</li>
              <li>연 예상 이자 = 사용금액 × 연이율</li>
              <li>기간 이자 = 일 이자 × 사용일수</li>
            </ul>

            <div className="rounded-2xl bg-blue-50 p-5 text-blue-900">
              <p className="font-bold">참고</p>
              <p className="mt-2">
                실제 청구액은 매일의 사용 잔액과 은행별 계산 기준(일수 산정
                방식 등)에 따라 달라질 수 있습니다. 정확한 금액은 이용 중인
                금융회사의 안내를 확인하세요.
              </p>
            </div>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "대출이자 계산기", href: "/loan-interest-calculator", icon: "🏦" },
          { label: "DSR 계산기", href: "/dsr-calculator", icon: "📐" },
          { label: "원리금상환 계산기", href: "/amortization-calculator", icon: "📊" },
          { label: "중도상환 계산기", href: "/prepayment-calculator", icon: "💸" },
        ]}
        relatedGuides={[
          {
            label: "대출 이자 계산 방법 완벽 정리",
            href: "/blog/loan-interest-calculation",
          },
        ]}
      />
    </Suspense>
  );
}

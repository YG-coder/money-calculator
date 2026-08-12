// src/app/finance/cma-vs-deposit/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import CmaVsDepositCalc from "@/components/calculator/CmaVsDepositCalc";

export const metadata: Metadata = buildMetadata({
  slug: "finance/cma-vs-deposit",
  title: "CMA vs 예금 계산기 — 세후 수령액 비교",
  description:
    "같은 금액·기간에서 예금 금리와 CMA 예상수익률을 넣어 세후 이자와 수령액을 비교합니다. CMA는 확정금리가 아니며, 일반과세 15.4% 기준입니다.",
  keywords: ["CMA예금비교", "CMA수익률계산", "CMA이자계산", "CMA예금이자"],
});

const crumbs = [
  { name: "홈", url: BASE_URL },
  { name: "금융 계산기", url: `${BASE_URL}/finance` },
  { name: "CMA vs 예금 계산기", url: `${BASE_URL}/finance/cma-vs-deposit` },
];

const EXAMPLES: CalcExample[] = [
  {
    title: "1,000만원 · 12개월 · 예금 3.5% vs CMA 3.0%",
    desc: "같은 1,000만원을 12개월, 예금 3.5% / CMA 예상수익률 3.0%, 일반과세",
    inputs: [
      { label: "예치금액", value: "1,000만원" },
      { label: "기간", value: "12개월" },
      { label: "예금 금리", value: "3.5%" },
      { label: "CMA 예상수익률", value: "3.0%" },
    ],
    results: [
      { label: "예금 세후 수령액", value: "10,296,100원" },
      { label: "CMA 세후 수령액", value: "10,253,800원" },
      { label: "차이", value: "CMA가 42,300원 적음", highlight: true },
    ],
    note: "입력한 수익률 기준으로는 예금이 조금 더 받습니다. 다만 CMA 예상수익률은 확정된 값이 아니라 입력값 기준 가정이고, 실제 CMA 수익률은 상품·시장에 따라 달라질 수 있습니다.",
  },
  {
    title: "3,000만원 · 6개월 · 예금 3.0% vs CMA 3.6%",
    desc: "같은 3,000만원을 6개월, 예금 3.0% / CMA 예상수익률 3.6%, 일반과세",
    inputs: [
      { label: "예치금액", value: "3,000만원" },
      { label: "기간", value: "6개월" },
      { label: "예금 금리", value: "3.0%" },
      { label: "CMA 예상수익률", value: "3.6%" },
    ],
    results: [
      { label: "예금 세후 수령액", value: "30,380,700원" },
      { label: "CMA 세후 수령액", value: "30,456,840원" },
      { label: "차이", value: "CMA가 76,140원 많음", highlight: true },
    ],
    note: "입력한 CMA 예상수익률이 예금 금리보다 높으면 세후 수령액도 그만큼 많아집니다. 하지만 이는 어디까지나 입력한 수익률이 유지된다는 가정이며, CMA는 확정금리가 아닙니다.",
  },
];

const FAQ = [
  {
    q: "CMA가 예금보다 유리한가요?",
    a: "이 계산기는 어느 쪽이 유리한지 판단하지 않습니다. CMA 수익률은 확정금리가 아니라 입력한 예상수익률이 유지된다는 가정일 뿐이고, 실제로는 상품 유형과 시장 상황에 따라 달라집니다. 계산기는 입력한 두 수익률을 같은 조건(단리·일반과세)으로 비교해 세후 수령액 차이만 보여줍니다.",
  },
  {
    q: "왜 CMA 수익률을 직접 입력하나요?",
    a: "CMA는 RP형·MMF형·MMW형·발행어음형 등 상품 구조가 다양하고, 확정금리가 아니라 시장금리에 따라 수시로 바뀝니다. 특정 수익률을 미리 넣어두면 실제와 어긋나기 쉬우므로, 이용 중이거나 검토 중인 CMA의 예상수익률을 직접 입력하도록 했습니다.",
  },
  {
    q: "과세는 어떻게 적용되나요?",
    a: "예금과 CMA 모두 일반과세 15.4%(이자소득세 14% + 지방소득세 1.4%)를 적용합니다. 비과세는 별도 세제우대 계좌·자격에 따른 것이라 일반 CMA·예금 상품의 기본 속성이 아니어서, 이 계산기에서는 일반과세로 고정했습니다.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="CMA vs 예금 계산기"
        description="예금 금리와 CMA 예상수익률을 넣어 같은 조건에서 세후 수령액을 비교하세요."
        icon="⚖️"
        slug="finance/cma-vs-deposit"
        breadcrumb={crumbs}
        calculator={
          <>
            <CmaVsDepositCalc />
            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <p className="mb-2 text-sm font-bold text-slate-800">
                ⚠️ CMA 수익률은 확정금리가 아닙니다
              </p>
              <p className="text-sm text-slate-600">
                예금 금리는 만기까지 정해져 있지만, CMA 예상수익률은 시장 상황과
                상품 유형에 따라 달라집니다. 이 비교는 입력한 수익률이 유지된다는
                가정 위에서만 성립합니다.
              </p>
            </div>
          </>
        }
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">
              CMA와 예금은 무엇이 다른가
            </h2>
            <p>
              <strong>예금</strong>은 가입 시점에 금리가 정해져 만기까지 유지되는
              확정금리 상품입니다. <strong>CMA</strong>는 증권사의 수시입출금
              계좌로, 하루만 맡겨도 수익이 붙을 수 있지만 수익률이 확정되어 있지
              않고 시장금리에 따라 바뀝니다. 그래서 &lsquo;정해진 이자&rsquo;와
              &lsquo;달라질 수 있는 수익&rsquo;이라는 성격 차이가 있습니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              이 계산기의 비교 방식
            </h2>
            <p>
              공정한 비교를 위해 예금과 CMA를 같은 조건으로 맞춥니다. 같은
              예치금액을 같은 기간 동안 <strong>단리 일시예치</strong>하고, 둘 다
              <strong>일반과세 15.4%</strong>를 적용합니다. 이렇게 하면 복리 여부
              같은 변수가 빠지고, 입력한 두 수익률의 차이가 그대로 결과 차이로
              나타납니다.
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>예금·CMA 세전 이자 = 예치금액 × 수익률 × (기간/12)</li>
              <li>세후 이자 = 세전 이자 − 이자과세 15.4%</li>
              <li>수령액 = 예치금액 + 세후 이자</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-900">
              결과를 볼 때 주의할 점
            </h2>
            <p>
              CMA 쪽 숫자는 &lsquo;입력한 예상수익률이 기간 내내 유지된다면&rsquo;을
              가정한 값입니다. 실제 CMA 수익률은 RP형·MMF형·MMW형·발행어음형 등 상품
              유형과 시장 상황에 따라 달라지고, 수익 산정·지급 방식도 상품별로 다를
              수 있습니다. 그래서 이 계산기는 어느 쪽이 유리한지 판단하지 않고,
              입력한 조건에서의 수령액 차이만 보여줍니다.
            </p>

            <div className="rounded-2xl bg-blue-50 p-5 text-blue-900">
              <p className="font-bold">함께 확인하면 좋은 것</p>
              <p className="mt-2">
                목돈을 예금에 넣을 때의 이자는 예금 이자 계산기에서, 매달 적립하는
                적금과의 차이는 예금 vs 적금 계산기에서 확인할 수 있습니다.
              </p>
            </div>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "예금 이자 계산기", href: "/finance/deposit", icon: "🏦" },
          { label: "예금 vs 적금 계산기", href: "/finance/deposit-vs-savings", icon: "⚖️" },
          { label: "적금 이자 계산기", href: "/finance/installment-savings", icon: "🪙" },
          { label: "복리 계산기", href: "/finance/compound", icon: "📈" },
        ]}
        relatedGuides={[]}
      />
    </Suspense>
  );
}

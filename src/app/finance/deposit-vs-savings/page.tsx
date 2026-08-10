// src/app/finance/deposit-vs-savings/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import SavingsCompareCalc from "@/components/calculator/SavingsCompareCalc";

export const metadata: Metadata = buildMetadata({
  slug: "finance/deposit-vs-savings",
  title: "예금 vs 적금 계산기 — 같은 금리인데 이자가 다른 이유",
  description:
    "같은 금리·같은 총액에서 예금과 적금의 세후 이자를 비교합니다. 적금 표면금리가 왜 예금과 다른지, 총 납입액 대비 이자율과 이자 배수를 확인하세요.",
  keywords: ["예금적금비교", "적금이자율", "예금적금이자차이", "적금금리계산"],
});

const crumbs = [
  { name: "홈", url: BASE_URL },
  { name: "금융 계산기", url: `${BASE_URL}/finance` },
  { name: "예금 vs 적금 계산기", url: `${BASE_URL}/finance/deposit-vs-savings` },
];

const EXAMPLES: CalcExample[] = [
  {
    title: "월 100만원 · 12개월 · 연 5% · 일반과세",
    desc: "적금에 매달 100만원씩 12개월(총 1,200만원), 예금은 같은 1,200만원 일시예치",
    inputs: [
      { label: "월 납입액", value: "100만원" },
      { label: "기간", value: "12개월" },
      { label: "금리", value: "연 5.0%" },
      { label: "과세", value: "일반과세 15.4%" },
    ],
    results: [
      { label: "예금 세후 이자", value: "507,600원 (총액 대비 4.23%)", highlight: true },
      { label: "적금 세후 이자", value: "274,950원 (총액 대비 2.29%)" },
      { label: "예금이 적금의", value: "약 1.85배" },
    ],
    note: "같은 5%인데 예금 세후 이자가 적금의 약 1.85배입니다. 적금은 첫 달 납입금만 12개월치 이자를 받고 마지막 달은 1개월치만 받기 때문에, 총 납입액 대비 이자율은 표면금리(5%)의 절반 수준으로 내려갑니다. 다만 예금은 처음부터 1,200만원이 있어야 가능하다는 점이 다릅니다.",
  },
];

const FAQ = [
  {
    q: "같은 5% 적금이 왜 예금보다 이자가 적나요?",
    a: "적금은 매달 돈을 나눠 넣기 때문에, 각 회차 납입금이 이자를 받는 기간이 다릅니다. 첫 달 납입금만 만기까지 전 기간 이자를 받고, 마지막 달 납입금은 1개월치 이자만 받습니다. 반면 예금은 총액 전체가 처음부터 만기까지 이자를 받습니다. 그래서 같은 표면금리라도 적금의 이자가 예금보다 적습니다.",
  },
  {
    q: "적금은 총 납입액 대비 이자율로 봐야 하나요?",
    a: "적금의 표면금리는 '전체 원금이 내내 굴러가는 금리'가 아닙니다. 12개월 적금이라면 총 납입액 대비 세전 이자율이 표면금리의 약 절반 수준입니다. 적금과 예금을 비교할 때는 표면금리가 아니라, 같은 총액을 분모로 둔 이자율로 보는 것이 정확합니다.",
  },
  {
    q: "그럼 예금이 항상 유리한가요?",
    a: "아니요. 이 비교는 같은 총액을 처음부터 예금에 넣을 수 있다는 가정입니다. 적금은 목돈이 없어 매달 모으는 상품이므로, 애초에 예금에 넣을 목돈이 없다면 직접 비교 대상이 아닙니다. 어느 쪽이 유리한지가 아니라, 같은 금리라도 이자가 왜 다른지를 이해하는 용도로 사용하세요.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="예금 vs 적금 계산기"
        description="같은 금리인데 왜 적금 이자가 적은지, 세후 이자와 총 납입액 대비 이자율로 비교하세요."
        icon="⚖️"
        slug="finance/deposit-vs-savings"
        breadcrumb={crumbs}
        calculator={
          <>
            <SavingsCompareCalc />
            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <p className="mb-2 text-sm font-bold text-slate-800">
                ⚠️ 표면금리로 직접 비교하지 마세요
              </p>
              <p className="text-sm text-slate-600">
                적금 5%와 예금 5%는 실제 이자가 다릅니다. 적금은 매달 나눠 넣어
                원금이 굴러가는 기간이 짧기 때문입니다. 표면금리 대신 총 납입액 대비
                이자율로 비교하세요.
              </p>
            </div>
          </>
        }
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">
              같은 금리인데 왜 이자가 다를까
            </h2>
            <p>
              예금과 적금은 돈을 넣는 방식이 다릅니다. <strong>예금</strong>은
              목돈을 처음부터 한 번에 예치해, 총액 전체가 만기까지 이자를 받습니다.
              <strong>적금</strong>은 매달 나눠 넣기 때문에, 각 회차 납입금이 이자를
              받는 기간이 제각각입니다. 첫 달 납입금은 전 기간, 마지막 달 납입금은
              한 달치 이자만 받습니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              적금 표면금리 ≠ 총 납입액 대비 이자율
            </h2>
            <p>
              그래서 적금의 표면금리는 &lsquo;전체 원금이 내내 그 금리로
              굴러간다&rsquo;는 뜻이 아닙니다. 총 납입액을 기준으로 보면, 12개월
              적금의 총 납입액 대비 세전 이자율은 표면금리의 약 절반 수준으로 내려갑니다. 예금과
              적금을 비교할 때 표면금리만 보면 오해가 생기는 이유입니다.
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>예금 이자 = 총액 × 금리 × 기간 (전액이 내내 이자를 받음)</li>
              <li>적금 이자 ≈ 월납입 × 월이율 × n(n+1)/2 (회차별 기간이 다름)</li>
              <li>비교 기준은 표면금리가 아니라 같은 총액 대비 이자율</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-900">
              그래도 우열을 단정할 수 없는 이유
            </h2>
            <p>
              이 계산기의 예금은 &lsquo;같은 총액을 처음부터 예치했다면&rsquo;을
              가정합니다. 하지만 적금을 드는 이유는 대개 그만한 목돈이 아직 없기
              때문입니다. 목돈이 있다면 예금이, 매달 모아야 한다면 적금이 각자의
              쓰임이 있으므로, 이 계산기는 어느 쪽이 유리한지 판단하지 않습니다. 같은
              금리라도 이자가 왜 다른지를 이해하는 데 사용하세요.
            </p>

            <div className="rounded-2xl bg-blue-50 p-5 text-blue-900">
              <p className="font-bold">함께 확인하면 좋은 것</p>
              <p className="mt-2">
                목돈 예치 이자는 예금 이자 계산기에서, 매달 적립 시 만기 수령액은
                적금 계산기에서 각각 자세히 확인할 수 있습니다.
              </p>
            </div>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "예금 이자 계산기", href: "/finance/deposit", icon: "🏦" },
          { label: "적금 이자 계산기", href: "/finance/installment-savings", icon: "🪙" },
          { label: "복리 계산기", href: "/finance/compound", icon: "📈" },
          { label: "목표저축 계산기", href: "/finance/goal-savings", icon: "🎯" },
        ]}
        relatedGuides={[]}
      />
    </Suspense>
  );
}

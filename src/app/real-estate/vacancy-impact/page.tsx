// src/app/real-estate/vacancy-impact/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import VacancyImpactCalc from "@/components/calculator/VacancyImpactCalc";

export const metadata: Metadata = buildMetadata({
  slug: "real-estate/vacancy-impact",
  title: "공실률 영향 계산기 — 공실이 임대수익에 미치는 영향",
  description:
    "월세와 공실률, 운영비를 입력하면 공실로 줄어드는 임대수입과 순수익, 만실 대비 감소율을 계산합니다. 매입가 입력 시 실효 수익률도 확인합니다.",
  keywords: ["공실률계산기", "공실률영향", "임대수익공실", "실효임대수익률"],
});

const crumbs = [
  { name: "홈", url: BASE_URL },
  { name: "부동산 계산기", url: `${BASE_URL}/real-estate` },
  { name: "공실률 영향 계산기", url: `${BASE_URL}/real-estate/vacancy-impact` },
];

const EXAMPLES: CalcExample[] = [
  {
    title: "월세 100만 · 공실률 10% · 운영비 10만",
    desc: "월세 100만원, 공실률 10%, 월 운영비 10만원, 매입가 5억원",
    inputs: [
      { label: "월세", value: "100만원" },
      { label: "공실률", value: "10%" },
      { label: "월 운영비", value: "10만원" },
      { label: "매입가", value: "50,000만원" },
    ],
    results: [
      { label: "공실 반영 연 임대수입", value: "10,800,000원", highlight: true },
      { label: "공실로 줄어든 금액", value: "1,200,000원" },
      { label: "공실 반영 순수익", value: "9,600,000원" },
      { label: "순수익 감소율", value: "11.11%" },
      { label: "실효 수익률", value: "2.16% → 1.92%" },
    ],
    note: "임대수입 자체는 공실률만큼 10% 줄지만, 운영비는 공실과 상관없이 그대로 나가기 때문에 순수익 감소율은 11.11%로 더 큽니다. 매입가 5억 기준 실효 수익률은 만실 2.16%에서 공실 반영 1.92%로 낮아집니다.",
  },
  {
    title: "월세 80만 · 공실률 5% · 운영비 5만",
    desc: "월세 80만원, 공실률 5%, 월 운영비 5만원",
    inputs: [
      { label: "월세", value: "80만원" },
      { label: "공실률", value: "5%" },
      { label: "월 운영비", value: "5만원" },
    ],
    results: [
      { label: "공실 반영 연 임대수입", value: "9,120,000원", highlight: true },
      { label: "공실로 줄어든 금액", value: "480,000원" },
      { label: "예상 공실 기간", value: "0.6개월" },
      { label: "순수익 감소율", value: "5.33%" },
    ],
    note: "공실률 5%는 1년에 약 0.6개월 비는 것과 같습니다. 임대수입은 5% 줄지만, 운영비를 반영한 순수익 기준으로는 약 5.33% 줄어듭니다.",
  },
];

const FAQ = [
  {
    q: "공실률과 공실 기간은 어떻게 연결되나요?",
    a: "공실률은 1년 중 비어 있는 비율입니다. 연 공실 개월수 = 공실률 × 12 ÷ 100으로 환산됩니다. 예를 들어 공실률 10%는 1년에 약 1.2개월, 5%는 약 0.6개월 비는 것과 같습니다.",
  },
  {
    q: "왜 순수익 감소율이 공실률보다 큰가요?",
    a: "공실이 생기면 임대수입은 줄지만, 관리비·수선 등 운영비는 공실과 상관없이 계속 나갑니다. 그래서 수입에서 고정비를 뺀 순수익은 임대수입보다 더 큰 비율로 줄어듭니다. 예를 들어 임대수입이 10% 줄어도 순수익은 11% 넘게 줄 수 있습니다.",
  },
  {
    q: "이 계산기로 투자 여부를 판단할 수 있나요?",
    a: "아니요. 이 계산기는 특정 매물의 투자 가치를 판단하거나 추천하지 않습니다. 입력한 공실률과 운영비를 기준으로 공실이 수익에 미치는 영향을 수치로 보여줄 뿐이며, 실제 공실률·수선비·세금 등은 시장과 조건에 따라 달라집니다.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="공실률 영향 계산기"
        description="공실이 임대수입과 순수익을 얼마나 줄이는지 수치로 확인하세요."
        icon="🏚️"
        slug="real-estate/vacancy-impact"
        breadcrumb={crumbs}
        calculator={<VacancyImpactCalc />}
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">
              공실률이 왜 중요한가
            </h2>
            <p>
              임대 수익을 계산할 때 흔히 &lsquo;만실&rsquo;, 즉 1년 내내 세입자가
              있다고 가정합니다. 하지만 실제로는 세입자가 바뀌는 사이 비는 기간이
              생깁니다. <strong>공실률</strong>은 1년 중 이렇게 비는 비율이며, 이
              계산기는 공실이 임대수입과 순수익을 얼마나 줄이는지 보여줍니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">계산 방식</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>연 만실 임대수입 = 월세 × 12</li>
              <li>공실 손실 = 연 만실 임대수입 × 공실률</li>
              <li>공실 반영 순수익 = (임대수입 − 공실 손실) − 연 운영비</li>
              <li>연 공실 개월수 = 공실률 × 12 ÷ 100</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-900">
              두 가지 감소율을 구분하세요
            </h2>
            <p>
              공실의 영향은 두 가지로 나눠 봐야 합니다.{" "}
              <strong>임대수입 감소율</strong>은 공실률 그 자체입니다. 반면{" "}
              <strong>순수익 감소율</strong>은 운영비까지 반영한 값으로, 보통
              공실률보다 큽니다. 관리비·수선비 같은 운영비는 공실이 나도 그대로
              나가기 때문입니다. 그래서 &lsquo;10% 공실&rsquo;이 순수익 기준으로는
              그보다 더 큰 타격이 될 수 있습니다.
            </p>

            <div className="rounded-2xl bg-blue-50 p-5 text-blue-900">
              <p className="font-bold">함께 확인하면 좋은 것</p>
              <p className="mt-2">
                공실을 뺀 만실 기준 수익률은 부동산 수익률 계산기에서, 전세를
                월세로 돌릴 때의 전환율은 전월세 전환율 계산기에서 확인할 수
                있습니다.
              </p>
            </div>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "부동산 수익률 계산기", href: "/real-estate/property-yield-calculator", icon: "📈" },
          { label: "전월세 전환율 계산기", href: "/real-estate/jeonse-wolse-conversion", icon: "🔁" },
          { label: "월세 vs 전세 계산기", href: "/real-estate/jeonse-vs-wolse-calculator", icon: "⚖️" },
          { label: "취득세 계산기", href: "/real-estate/acquisition-tax-calculator", icon: "🏛️" },
        ]}
        relatedGuides={[]}
      />
    </Suspense>
  );
}
